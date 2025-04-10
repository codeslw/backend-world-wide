import { PrismaClient } from '@prisma/client';

export async function seedUniversities(prisma: PrismaClient): Promise<void> {
  console.log('Seeding universities...');
  
  const universities = [
    {
      id: 'harvard',
      nameUz: "Garvard universiteti",
      nameRu: "Гарвардский университет",
      nameEn: "Harvard University",
      established: 1636,
      type: "PRIVATE",
      descriptionUz: "AQShning eng qadimgi va dunyodagi eng nufuzli universitetlardan biri.",
      descriptionRu: "Старейший университет США и один из самых престижных в мире.",
      descriptionEn: "The oldest institution of higher education in the United States and one of the most prestigious universities in the world.",
      website: "https://www.harvard.edu",
      email: "admissions@harvard.edu",
      phone: "+1-617-495-1000",
      address: "Cambridge, MA 02138, United States",
      winterIntakeDeadline: new Date("2023-12-15"),
      autumnIntakeDeadline: new Date("2024-01-01"),
      ranking: 1,
      studentsCount: 23000,
      acceptanceRate: 4.6,
      avgApplicationFee: 75,
      tuitionFeeMin: 49653,
      tuitionFeeMax: 53307,
      tuitionFeeCurrency: "USD",
      photoUrl: "https://www.harvard.edu/wp-content/uploads/2020/10/harvard-university-min.jpg",
      cityId: "boston-840",
      countryCode: 840,
      programs: {
        connect: [
          { id: 'bachelor' },
          { id: 'master' },
          { id: 'phd' },
          { id: 'engineering' },
          { id: 'computer-science' },
          { id: 'business' },
          { id: 'mba' }
        ]
      }
    },
    {
      id: 'mit',
      nameUz: "Massachusets Texnologiya Instituti",
      nameRu: "Массачусетский технологический институт",
      nameEn: "Massachusetts Institute of Technology",
      established: 1861,
      type: "PRIVATE",
      descriptionUz: "Dunyodagi eng yaxshi texnologiya universitetlaridan biri.",
      descriptionRu: "Один из лучших технологических университетов мира.",
      descriptionEn: "A private research university known for its pioneering research and academic strength in physical sciences and engineering.",
      website: "https://www.mit.edu",
      email: "admissions@mit.edu",
      phone: "+1-617-253-1000",
      address: "Cambridge, MA 02139, United States",
      winterIntakeDeadline: new Date("2023-11-01"),
      autumnIntakeDeadline: new Date("2024-01-05"),
      ranking: 2,
      studentsCount: 11520,
      acceptanceRate: 6.7,
      avgApplicationFee: 75,
      tuitionFeeMin: 53790,
      tuitionFeeMax: 57590,
      tuitionFeeCurrency: "USD",
      photoUrl: "https://www.mit.edu/files/images/201808/MIT-Dome-Sunset-1.jpg",
      cityId: "boston-840",
      countryCode: 840,
      programs: {
        connect: [
          { id: 'bachelor' },
          { id: 'master' },
          { id: 'phd' },
          { id: 'engineering' },
          { id: 'computer-science' },
          { id: 'data-science' },
          { id: 'computer-science-phd' }
        ]
      }
    },
    {
      id: 'oxford',
      nameUz: "Oksford universiteti",
      nameRu: "Оксфордский университет",
      nameEn: "University of Oxford",
      established: 1096,
      type: "PUBLIC",
      descriptionUz: "Ingliz tilidagi dunyo bo'yicha eng qadimgi universitet.",
      descriptionRu: "Старейший англоязычный университет в мире.",
      descriptionEn: "The oldest university in the English-speaking world and the world's second-oldest university in continuous operation.",
      website: "https://www.ox.ac.uk",
      email: "admissions@ox.ac.uk",
      phone: "+44-1865-270000",
      address: "Oxford OX1 2JD, United Kingdom",
      winterIntakeDeadline: new Date("2023-10-15"),
      autumnIntakeDeadline: new Date("2024-01-15"),
      ranking: 3,
      studentsCount: 24000,
      acceptanceRate: 17.5,
      avgApplicationFee: 75,
      tuitionFeeMin: 26770,
      tuitionFeeMax: 39230,
      tuitionFeeCurrency: "GBP",
      photoUrl: "https://www.ox.ac.uk/sites/files/oxford/styles/ow_medium_feature/s3/field/field_image_main/Radcliffe%20Camera%20%28Bodleian%20Library%29.jpg",
      cityId: "london-826",
      countryCode: 826,
      programs: {
        connect: [
          { id: 'bachelor' },
          { id: 'master' },
          { id: 'phd' },
          { id: 'business' },
          { id: 'mba' }
        ]
      }
    }
  ];
  
  for (const university of universities) {
    await prisma.university.upsert({
      where: { id: university.id },
      update: {
        ...university,
        programs: university.programs
      },
      create: {
        ...university
      },
    });
  }
  
  console.log(`Seeded ${universities.length} universities`);
} 