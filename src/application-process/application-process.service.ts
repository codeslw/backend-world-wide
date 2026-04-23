import { Injectable } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { CreateProcessTemplateDto } from './dto/create-process-template.dto';
import { CreateProcessStepDto } from './dto/create-process-step.dto';
import { CreateDocumentTypeDto } from './dto/create-document-type.dto';
import {
  EntityNotFoundException,
  InvalidDataException,
} from '../common/exceptions/app.exceptions';

@Injectable()
export class ApplicationProcessService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Templates ───────────────────────────────────────────────────────────────

  async createTemplate(dto: CreateProcessTemplateDto) {
    // If setting as default, unset any existing default
    if (dto.isDefault) {
      await this.prisma.applicationProcessTemplate.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.applicationProcessTemplate.create({
      data: {
        name: dto.name,
        description: dto.description,
        isDefault: dto.isDefault ?? false,
        ...(dto.programId && { program: { connect: { id: dto.programId } } }),
      },
      include: {
        steps: {
          include: { requiredDocuments: true },
          orderBy: { order: 'asc' },
        },
        program: true,
      },
    });
  }

  async findAllTemplates() {
    return this.prisma.applicationProcessTemplate.findMany({
      include: {
        steps: {
          include: { requiredDocuments: true },
          orderBy: { order: 'asc' },
        },
        program: true,
      },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findTemplateById(id: string) {
    const template = await this.prisma.applicationProcessTemplate.findUnique({
      where: { id },
      include: {
        steps: {
          include: { requiredDocuments: true },
          orderBy: { order: 'asc' },
        },
        program: true,
      },
    });

    if (!template) {
      throw new EntityNotFoundException('ApplicationProcessTemplate', id);
    }

    return template;
  }

  async findTemplateForProgram(programId: string) {
    // First try program-specific, then fall back to default
    let template = await this.prisma.applicationProcessTemplate.findUnique({
      where: { programId },
      include: {
        steps: {
          include: { requiredDocuments: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!template) {
      template = await this.prisma.applicationProcessTemplate.findFirst({
        where: { isDefault: true },
        include: {
          steps: {
            include: { requiredDocuments: true },
            orderBy: { order: 'asc' },
          },
        },
      });
    }

    return template;
  }

  async updateTemplate(
    id: string,
    dto: Partial<CreateProcessTemplateDto>,
  ) {
    const template = await this.prisma.applicationProcessTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new EntityNotFoundException('ApplicationProcessTemplate', id);
    }

    if (dto.isDefault) {
      await this.prisma.applicationProcessTemplate.updateMany({
        where: { isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    return this.prisma.applicationProcessTemplate.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
      },
      include: {
        steps: {
          include: { requiredDocuments: true },
          orderBy: { order: 'asc' },
        },
        program: true,
      },
    });
  }

  async deleteTemplate(id: string) {
    const template = await this.prisma.applicationProcessTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new EntityNotFoundException('ApplicationProcessTemplate', id);
    }

    if (template.isDefault) {
      throw new InvalidDataException('Cannot delete the default template');
    }

    await this.prisma.applicationProcessTemplate.delete({ where: { id } });
  }

  async cloneTemplateForProgram(templateId: string, programId: string) {
    const source = await this.findTemplateById(templateId);

    // Check program doesn't already have a template
    const existing = await this.prisma.applicationProcessTemplate.findUnique({
      where: { programId },
    });
    if (existing) {
      throw new InvalidDataException(
        'This program already has a custom process template',
      );
    }

    const program = await this.prisma.program.findUnique({
      where: { id: programId },
    });
    if (!program) {
      throw new EntityNotFoundException('Program', programId);
    }

    // Create template clone
    const newTemplate = await this.prisma.applicationProcessTemplate.create({
      data: {
        name: `${source.name} - ${program.titleEn || program.titleRu}`,
        description: source.description,
        isDefault: false,
        program: { connect: { id: programId } },
      },
    });

    // Clone steps and their document types
    for (const step of source.steps) {
      const newStep = await this.prisma.applicationProcessStep.create({
        data: {
          template: { connect: { id: newTemplate.id } },
          order: step.order,
          name: step.name,
          description: step.description,
          statusKey: step.statusKey,
          isActive: step.isActive,
        },
      });

      if (step.requiredDocuments.length > 0) {
        await this.prisma.applicationDocumentType.createMany({
          data: step.requiredDocuments.map((doc) => ({
            stepId: newStep.id,
            name: doc.name,
            description: doc.description,
            required: doc.required,
            fileTypes: doc.fileTypes,
            maxSizeMb: doc.maxSizeMb,
          })),
        });
      }
    }

    return this.findTemplateById(newTemplate.id);
  }

  // ── Steps ───────────────────────────────────────────────────────────────────

  async createStep(dto: CreateProcessStepDto) {
    const template = await this.prisma.applicationProcessTemplate.findUnique({
      where: { id: dto.templateId },
    });

    if (!template) {
      throw new EntityNotFoundException('ApplicationProcessTemplate', dto.templateId);
    }

    return this.prisma.applicationProcessStep.create({
      data: {
        template: { connect: { id: dto.templateId } },
        order: dto.order,
        name: dto.name,
        description: dto.description,
        statusKey: dto.statusKey,
        isActive: dto.isActive ?? true,
      },
      include: { requiredDocuments: true },
    });
  }

  async updateStep(id: string, dto: Partial<CreateProcessStepDto>) {
    const step = await this.prisma.applicationProcessStep.findUnique({
      where: { id },
    });

    if (!step) {
      throw new EntityNotFoundException('ApplicationProcessStep', id);
    }

    return this.prisma.applicationProcessStep.update({
      where: { id },
      data: {
        ...(dto.order !== undefined && { order: dto.order }),
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.statusKey !== undefined && { statusKey: dto.statusKey }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      include: { requiredDocuments: true },
    });
  }

  async deleteStep(id: string) {
    const step = await this.prisma.applicationProcessStep.findUnique({
      where: { id },
    });

    if (!step) {
      throw new EntityNotFoundException('ApplicationProcessStep', id);
    }

    await this.prisma.applicationProcessStep.delete({ where: { id } });
  }

  // ── Document Types ──────────────────────────────────────────────────────────

  async createDocumentType(dto: CreateDocumentTypeDto) {
    const step = await this.prisma.applicationProcessStep.findUnique({
      where: { id: dto.stepId },
    });

    if (!step) {
      throw new EntityNotFoundException('ApplicationProcessStep', dto.stepId);
    }

    return this.prisma.applicationDocumentType.create({
      data: {
        step: { connect: { id: dto.stepId } },
        name: dto.name,
        description: dto.description,
        required: dto.required ?? true,
        fileTypes: dto.fileTypes || ['pdf'],
        maxSizeMb: dto.maxSizeMb || 5,
      },
    });
  }

  async updateDocumentType(id: string, dto: Partial<CreateDocumentTypeDto>) {
    const doc = await this.prisma.applicationDocumentType.findUnique({
      where: { id },
    });

    if (!doc) {
      throw new EntityNotFoundException('ApplicationDocumentType', id);
    }

    return this.prisma.applicationDocumentType.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.required !== undefined && { required: dto.required }),
        ...(dto.fileTypes !== undefined && { fileTypes: dto.fileTypes }),
        ...(dto.maxSizeMb !== undefined && { maxSizeMb: dto.maxSizeMb }),
      },
    });
  }

  async deleteDocumentType(id: string) {
    const doc = await this.prisma.applicationDocumentType.findUnique({
      where: { id },
    });

    if (!doc) {
      throw new EntityNotFoundException('ApplicationDocumentType', id);
    }

    await this.prisma.applicationDocumentType.delete({ where: { id } });
  }
}
