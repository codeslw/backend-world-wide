import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Cron, CronExpression } from '@nestjs/schedule';
import { IntakeSeason, Prisma } from '@prisma/client';
import { CreateIntakeDto } from './dto/create-intake.dto';
import { UpdateIntakeDto } from './dto/update-intake.dto';
import { PrismaService } from '../db/prisma.service';
import {
  defaultDeadline,
  defaultStartMonth,
  intakeStartDate,
  isDeadlineBeforeStart,
  isIntakeFullyExpired,
  monthNumberToName,
  nextFutureCycle,
} from './intake.util';

/** Fields identifying a global intake row for find-or-create. */
export interface IntakeCycleConfig {
  season: IntakeSeason;
  startMonth?: number;
  year: number;
  deadline?: Date;
}

@Injectable()
export class IntakesService {
  private readonly logger = new Logger(IntakesService.name);

  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  /**
   * Resolve a create/update payload into a fully-defaulted, validated set of
   * intake fields. `season` is required; startMonth defaults to the season's
   * first month; deadline defaults to the 1st of (startMonth - 2 months);
   * `month` is always derived from startMonth.
   */
  private resolveFields(input: {
    season: IntakeSeason;
    startMonth?: number;
    year: number;
    deadline?: Date | string;
  }): {
    season: IntakeSeason;
    startMonth: number;
    month: string;
    year: number;
    deadline: Date;
  } {
    const season = input.season;
    const startMonth = input.startMonth ?? defaultStartMonth(season);
    const year = input.year;
    const deadline = input.deadline
      ? new Date(input.deadline)
      : defaultDeadline(startMonth, year);

    if (!isDeadlineBeforeStart(deadline, startMonth, year)) {
      throw new BadRequestException(
        `Intake deadline (${deadline.toISOString()}) must be before the ` +
          `start date (${intakeStartDate(startMonth, year).toISOString()}).`,
      );
    }

    return {
      season,
      startMonth,
      month: monthNumberToName(startMonth),
      year,
      deadline,
    };
  }

  create(createIntakeDto: CreateIntakeDto) {
    const data = this.resolveFields(createIntakeDto);
    return this.prisma.intake.create({ data });
  }

  /**
   * Find an existing intake matching (season, startMonth, year) or create one.
   * Used by the inline university-program flow so intakes stay globally deduped.
   * Optional Prisma transaction client so callers can run inside a transaction.
   */
  async findOrCreate(
    config: IntakeCycleConfig,
    tx?: Prisma.TransactionClient,
  ): Promise<{ id: string }> {
    const client = tx ?? this.prisma;
    const fields = this.resolveFields(config);

    const existing = await client.intake.findUnique({
      where: {
        season_startMonth_year: {
          season: fields.season,
          startMonth: fields.startMonth,
          year: fields.year,
        },
      },
      select: { id: true },
    });
    if (existing) return existing;

    try {
      return await client.intake.create({
        data: fields,
        select: { id: true },
      });
    } catch (error) {
      // Concurrent create raced us to the unique key — re-read.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const row = await client.intake.findUnique({
          where: {
            season_startMonth_year: {
              season: fields.season,
              startMonth: fields.startMonth,
              year: fields.year,
            },
          },
          select: { id: true },
        });
        if (row) return row;
      }
      throw error;
    }
  }

  findAll() {
    return this.prisma.intake.findMany({
      orderBy: [{ year: 'asc' }, { startMonth: 'asc' }],
    });
  }

  findOne(id: string) {
    return this.prisma.intake.findUnique({ where: { id } });
  }

  async update(id: string, updateIntakeDto: UpdateIntakeDto) {
    const existing = await this.prisma.intake.findUnique({ where: { id } });
    if (!existing) {
      throw new BadRequestException(`Intake ${id} not found`);
    }

    // Merge incoming changes onto the existing row, then re-resolve defaults so
    // `month` stays in sync and the deadline-before-start invariant holds.
    const merged = this.resolveFields({
      season: updateIntakeDto.season ?? existing.season,
      startMonth: updateIntakeDto.startMonth ?? existing.startMonth,
      year: updateIntakeDto.year ?? existing.year,
      deadline:
        updateIntakeDto.deadline !== undefined
          ? updateIntakeDto.deadline
          : existing.deadline,
    });

    return this.prisma.intake.update({
      where: { id },
      data: merged,
    });
  }

  remove(id: string) {
    return this.prisma.intake.delete({ where: { id } });
  }

  /**
   * Daily job: expire intakes whose deadline has passed and roll each linked
   * program forward to the next same-season cycle, then delete intake rows that
   * are fully expired (deadline + start both past) and no longer linked.
   */
  @Cron(CronExpression.EVERY_DAY_AT_1AM, { name: 'expire-intakes' })
  async scheduledExpiry(): Promise<void> {
    try {
      const summary = await this.runExpiryAndRollover(new Date());
      this.logger.log(
        `Intake expiry: detached ${summary.detachedLinks} link(s), ` +
          `rolled over ${summary.rolledOver} program-intake(s), ` +
          `deleted ${summary.deletedIntakes} intake row(s).`,
      );
    } catch (err) {
      this.logger.error(
        `Scheduled intake expiry failed: ${
          err instanceof Error ? err.message : err
        }`,
        err instanceof Error ? err.stack : undefined,
      );
    }
  }

  /**
   * Core expiry + rollover logic. Extracted (and public) so it can be invoked
   * directly by tests / an admin trigger. Returns a small summary of what it did.
   */
  async runExpiryAndRollover(now: Date): Promise<{
    detachedLinks: number;
    rolledOver: number;
    deletedIntakes: number;
  }> {
    let detachedLinks = 0;
    let rolledOver = 0;
    let deletedIntakes = 0;

    await this.prisma.$transaction(async (tx) => {
      // 1) Expired intakes (deadline passed) + their program links.
      const expired = await tx.intake.findMany({
        where: { deadline: { lt: now } },
        include: {
          universityPrograms: { select: { universityProgramId: true } },
        },
      });

      for (const intake of expired) {
        const programIds = intake.universityPrograms.map(
          (link) => link.universityProgramId,
        );

        if (programIds.length > 0) {
          // 2) Roll forward: same season, next FUTURE cycle.
          const cycle = nextFutureCycle(intake, now);
          const target = await this.findOrCreate(
            {
              season: cycle.season,
              startMonth: cycle.startMonth,
              year: cycle.year,
              deadline: cycle.deadline,
            },
            tx,
          );

          // Attach the rolled-forward intake to each program (idempotent), then
          // detach the expired one.
          for (const universityProgramId of programIds) {
            const created = await tx.universityProgramIntake.createMany({
              data: [{ universityProgramId, intakeId: target.id }],
              skipDuplicates: true,
            });
            rolledOver += created.count;
          }

          const removed = await tx.universityProgramIntake.deleteMany({
            where: { intakeId: intake.id },
          });
          detachedLinks += removed.count;
        }

        // 3) Delete the old intake row if it is now fully expired and unlinked.
        const stillLinked = await tx.universityProgramIntake.count({
          where: { intakeId: intake.id },
        });
        if (stillLinked === 0 && isIntakeFullyExpired(intake, now)) {
          await tx.intake.delete({ where: { id: intake.id } });
          deletedIntakes += 1;
        }
      }
    });

    // Program intake lists changed — drop the university cache so reads refresh.
    if (detachedLinks > 0 || rolledOver > 0 || deletedIntakes > 0) {
      await this.clearUniversityCache();
    }

    return { detachedLinks, rolledOver, deletedIntakes };
  }

  private async clearUniversityCache(): Promise<void> {
    try {
      const mgr = this.cacheManager as any;
      if (typeof mgr.reset === 'function') {
        await mgr.reset();
      } else if (typeof mgr.clear === 'function') {
        await mgr.clear();
      } else if (typeof mgr.store?.reset === 'function') {
        await mgr.store.reset();
      }
    } catch (e) {
      this.logger.warn(
        `Cache clear after intake expiry failed: ${
          e instanceof Error ? e.message : e
        }`,
      );
    }
  }
}
