import { PrismaClient } from '@prisma/client';

export async function seedCountries(prisma: PrismaClient): Promise<void> {
  console.log('Seeding countries...');
  
  const countries = [
    {
      code: 840,
      nameUz: "Amerika Qo'shma Shtatlari",
      nameRu: "Соединенные Штаты Америки",
      nameEn: "United States of America"
    },
    {
      code: 826,
      nameUz: "Buyuk Britaniya",
      nameRu: "Великобритания",
      nameEn: "United Kingdom"
    },
    {
      code: 124,
      nameUz: "Kanada",
      nameRu: "Канада",
      nameEn: "Canada"
    },
    {
      code: 36,
      nameUz: "Avstraliya",
      nameRu: "Австралия",
      nameEn: "Australia"
    },
    {
      code: 276,
      nameUz: "Germaniya",
      nameRu: "Германия",
      nameEn: "Germany"
    }
  ];
  
  for (const country of countries) {
    await prisma.country.upsert({
      where: { code: country.code },
      update: country,
      create: country,
    });
  }
  
  console.log(`Seeded ${countries.length} countries`);
} 