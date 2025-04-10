import { PrismaClient } from '@prisma/client';

export async function seedPrograms(prisma: PrismaClient): Promise<void> {
  console.log('Seeding programs...');
  
  // Main program categories
  const mainPrograms = [
    {
      id: 'bachelor',
      titleUz: "Bakalavr",
      titleRu: "Бакалавр",
      titleEn: "Bachelor's Degree",
      descriptionEn: "Undergraduate academic degrees awarded by colleges and universities upon completion of a course of study lasting three to seven years."
    },
    {
      id: 'master',
      titleUz: "Magistr",
      titleRu: "Магистр",
      titleEn: "Master's Degree",
      descriptionEn: "Graduate academic degrees awarded by universities upon completion of a course of study demonstrating mastery of a specific field of study or area of professional practice."
    },
    {
      id: 'phd',
      titleUz: "Doktorantura",
      titleRu: "Докторантура",
      titleEn: "PhD",
      descriptionEn: "The highest university degree awarded following a course of study and research."
    }
  ];
  
  // Subprograms (specific fields of study)
  const subPrograms = [
    {
      id: 'engineering',
      parentId: 'bachelor',
      titleUz: "Muhandislik",
      titleRu: "Инженерия",
      titleEn: "Engineering",
      descriptionEn: "Programs focused on designing, building, and maintaining structures, machines, systems, and processes."
    },
    {
      id: 'computer-science',
      parentId: 'bachelor',
      titleUz: "Kompyuter fanlari",
      titleRu: "Компьютерные науки",
      titleEn: "Computer Science",
      descriptionEn: "Programs focused on the theory, design, development, and application of computer systems and software."
    },
    {
      id: 'business',
      parentId: 'bachelor',
      titleUz: "Biznes",
      titleRu: "Бизнес",
      titleEn: "Business",
      descriptionEn: "Programs focused on principles and practices of business operations, management, and finance."
    },
    {
      id: 'mba',
      parentId: 'master',
      titleUz: "MBA",
      titleRu: "МБА",
      titleEn: "MBA",
      descriptionEn: "Master of Business Administration programs that prepare students for careers in business and management."
    },
    {
      id: 'data-science',
      parentId: 'master',
      titleUz: "Ma'lumotlar fani",
      titleRu: "Наука о данных",
      titleEn: "Data Science",
      descriptionEn: "Programs focused on extracting knowledge and insights from structured and unstructured data."
    },
    {
      id: 'computer-science-phd',
      parentId: 'phd',
      titleUz: "Kompyuter fanlari bo'yicha doktorantura",
      titleRu: "Докторантура по компьютерным наукам",
      titleEn: "Computer Science PhD",
      descriptionEn: "Research-focused doctoral programs in the field of computer science."
    }
  ];
  
  // Create main programs first
  for (const program of mainPrograms) {
    await prisma.program.upsert({
      where: { id: program.id },
      update: program,
      create: program,
    });
  }
  
  // Then create subprograms
  for (const program of subPrograms) {
    await prisma.program.upsert({
      where: { id: program.id },
      update: program,
      create: program,
    });
  }
  
  console.log(`Seeded ${mainPrograms.length + subPrograms.length} programs`);
} 