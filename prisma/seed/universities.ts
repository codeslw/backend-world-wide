import { PrismaClient, Prisma } from '@prisma/client';

// Define a type for the seed data structure
type UniversitySeedData = Omit<Prisma.UniversityCreateInput, 'country' | 'city' | 'universityPrograms'> & {
  id: string; // Explicitly include id for upsert logic
  cityId: string;
  countryCode: number;
  programs: Array<{ programId: string; tuitionFee: number; tuitionFeeCurrency?: string }>;
};

export async function seedUniversities(prisma: PrismaClient): Promise<void> {
  console.log('Seeding universities...');

  const universitiesData: UniversitySeedData[] = [
    {
      id: 'harvard', // Use a consistent ID for upsert
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
      winterIntakeDeadline: new Date("2024-12-15"), // Adjusted year for relevance
      autumnIntakeDeadline: new Date("2025-01-01"), // Adjusted year for relevance
      ranking: 1,
      studentsCount: 23000,
      acceptanceRate: 4.6,
      avgApplicationFee: 75,
      photoUrl: "https://www.harvard.edu/wp-content/uploads/2020/10/harvard-university-min.jpg",
      cityId: "boston-840", // Ensure this City ID exists from city seeder
      countryCode: 840,    // Ensure this Country code exists from country seeder
      programs: [
        { programId: 'bachelor', tuitionFee: 51000, tuitionFeeCurrency: "USD" },
        { programId: 'master', tuitionFee: 52000, tuitionFeeCurrency: "USD" },
        { programId: 'phd', tuitionFee: 53000, tuitionFeeCurrency: "USD" },
        { programId: 'engineering', tuitionFee: 54000, tuitionFeeCurrency: "USD" },
        { programId: 'computer-science', tuitionFee: 55000, tuitionFeeCurrency: "USD" },
        { programId: 'business', tuitionFee: 73000, tuitionFeeCurrency: "USD" },
        { programId: 'mba', tuitionFee: 75000, tuitionFeeCurrency: "USD" }
      ]
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
      winterIntakeDeadline: new Date("2024-11-01"),
      autumnIntakeDeadline: new Date("2025-01-05"),
      ranking: 2,
      studentsCount: 11520,
      acceptanceRate: 6.7,
      avgApplicationFee: 75,
      photoUrl: "https://www.mit.edu/files/images/201808/MIT-Dome-Sunset-1.jpg",
      cityId: "boston-840",
      countryCode: 840,
      programs: [
        { programId: 'bachelor', tuitionFee: 55000 },
        { programId: 'master', tuitionFee: 56000 },
        { programId: 'phd', tuitionFee: 57000 },
        { programId: 'engineering', tuitionFee: 58000 },
        { programId: 'computer-science', tuitionFee: 59000 },
        { programId: 'data-science', tuitionFee: 60000 },
        { programId: 'computer-science-phd', tuitionFee: 61000 }
      ]
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
      winterIntakeDeadline: new Date("2024-10-15"),
      autumnIntakeDeadline: new Date("2025-01-15"),
      ranking: 3,
      studentsCount: 24000,
      acceptanceRate: 17.5,
      avgApplicationFee: 75,
      photoUrl: "https://www.ox.ac.uk/sites/files/oxford/styles/ow_medium_feature/s3/field/field_image_main/Radcliffe%20Camera%20%28Bodleian%20Library%29.jpg",
      cityId: "london-826", // Ensure this City ID exists
      countryCode: 826,    // Ensure this Country code exists
      programs: [
        { programId: 'bachelor', tuitionFee: 28000, tuitionFeeCurrency: "GBP" },
        { programId: 'master', tuitionFee: 30000, tuitionFeeCurrency: "GBP" },
        { programId: 'phd', tuitionFee: 32000, tuitionFeeCurrency: "GBP" },
        { programId: 'business', tuitionFee: 45000, tuitionFeeCurrency: "GBP" },
        { programId: 'mba', tuitionFee: 65000, tuitionFeeCurrency: "GBP" }
      ]
    }
  ];

  // Ensure programs exist before trying to connect them
  const allProgramIds = [...new Set(universitiesData.flatMap(u => u.programs.map(p => p.programId)))];
  const existingPrograms = await prisma.program.findMany({
      where: { id: { in: allProgramIds } },
      select: { id: true },
  });
  const existingProgramIds = new Set(existingPrograms.map(p => p.id));

  let createdCount = 0;
  let updatedCount = 0;

  for (const uniData of universitiesData) {
    const { id, programs, cityId, countryCode, ...universityBaseData } = uniData;

    // Filter programs to only include those that actually exist in the DB
    const validPrograms = programs.filter(p => existingProgramIds.has(p.programId));
    if (validPrograms.length !== programs.length) {
        console.warn(`University ${id}: Skipping non-existent program IDs.`);
    }
    if (validPrograms.length === 0) {
        console.warn(`University ${id}: Skipping seeding as no valid programs found.`);
        continue;
    }

    // Data for creating UniversityProgram entries
    const universityProgramCreateData = validPrograms.map(p => ({
      program: { connect: { id: p.programId } },
      tuitionFee: p.tuitionFee,
      tuitionFeeCurrency: p.tuitionFeeCurrency || 'USD',
    }));

    try {
        const result = await prisma.university.upsert({
            where: { id: id }, // Use the predefined ID
            update: {
                ...universityBaseData,
                country: { connect: { code: countryCode } },
                city: { connect: { id: cityId } },
                // In update, we need to manage the relation explicitly
                // We'll handle this transactionally below if needed, for simplicity
                // in seeding, we often just recreate relations if the base data changes.
                // Clear existing programs and add new ones:
                universityPrograms: {
                    deleteMany: {},
                    create: universityProgramCreateData,
                },
            },
            create: {
                id: id, // Assign the predefined ID on create
                ...universityBaseData,
                country: { connect: { code: countryCode } },
                city: { connect: { id: cityId } },
                universityPrograms: {
                    create: universityProgramCreateData,
                },
            },
        });
        // Simple check if it was created or updated based on createdAt/updatedAt
        if (result.createdAt.getTime() === result.updatedAt.getTime()) {
             createdCount++;
        } else {
             updatedCount++;
        }
    } catch (error) {
        console.error(`Error seeding university ${id}:`, error);
        // Decide if you want to stop seeding or continue with others
        // throw error; // Uncomment to stop on first error
    }
  }

  console.log(`Seeded universities: ${createdCount} created, ${updatedCount} updated.`);
} 