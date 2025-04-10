import { PrismaClient } from '@prisma/client';

export async function seedCities(prisma: PrismaClient): Promise<void> {
  console.log('Seeding cities...');
  
  const cities = [
    {
      nameUz: "Nyu-York",
      nameRu: "Нью-Йорк",
      nameEn: "New York",
      descriptionEn: "The largest city in the United States and a global center for finance, culture, and education.",
      countryCode: 840 // USA
    },
    {
      nameUz: "Boston",
      nameRu: "Бостон",
      nameEn: "Boston",
      descriptionEn: "A major educational hub in the United States, home to Harvard and MIT.",
      countryCode: 840 // USA
    },
    {
      nameUz: "London",
      nameRu: "Лондон",
      nameEn: "London",
      descriptionEn: "The capital and largest city of the United Kingdom, a leading global city.",
      countryCode: 826 // UK
    },
    {
      nameUz: "Toronto",
      nameRu: "Торонто",
      nameEn: "Toronto",
      descriptionEn: "The largest city in Canada and a major center for business and higher education.",
      countryCode: 124 // Canada
    },
    {
      nameUz: "Melburn",
      nameRu: "Мельбурн",
      nameEn: "Melbourne",
      descriptionEn: "Australia's second-largest city, known for its cultural scene and educational institutions.",
      countryCode: 36 // Australia
    },
    {
      nameUz: "Berlin",
      nameRu: "Берлин",
      nameEn: "Berlin",
      descriptionEn: "The capital and largest city of Germany, with a rich cultural and educational landscape.",
      countryCode: 276 // Germany
    }
  ];
  
  for (const city of cities) {
    await prisma.city.upsert({
      where: {
        id: `${city.nameEn.toLowerCase()}-${city.countryCode}`
      },
      update: city,
      create: {
        id: `${city.nameEn.toLowerCase()}-${city.countryCode}`,
        ...city
      },
    });
  }
  
  console.log(`Seeded ${cities.length} cities`);
} 