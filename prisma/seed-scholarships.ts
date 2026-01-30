import { PrismaClient, University, UniversityProgram } from '@prisma/client';

const prisma = new PrismaClient();

const SCHOLARSHIP_TITLES = [
  'International Student Merit Scholarship',
  "Dean's Excellence Award",
  'Global Leaders Scholarship',
  'Future Innovators Grant',
  'Academic Achievement Scholarship',
  'Entrance Scholarship',
  'Community Impact Award',
];

const DESCRIPTIONS = [
  'Awarded to students with outstanding academic records.',
  'Financial aid for international students showing leadership potential.',
  'Merit-based scholarship for high-achieving applicants.',
  'Support for students demonstrating financial need and academic promise.',
  'A renewable scholarship for maintaining a high GPA.',
];

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomAmount(): string {
  const amounts = [
    '1000',
    '2500',
    '5000',
    '10000',
    '15000',
    '20000',
    'Full Tuition',
  ];
  return getRandomItem(amounts);
}

async function main() {
  console.log('Starting scholarship seeding...');

  // Fetch all universities with their programs
  const universities = await prisma.university.findMany({
    include: {
      universityPrograms: true,
    },
  });

  console.log(`Found ${universities.length} universities.`);

  let scholarshipCount = 0;

  for (const uni of universities) {
    // Decide how many scholarships to create for this university (0 to 3)
    const numScholarships = Math.floor(Math.random() * 4);

    if (numScholarships === 0) continue;

    for (let i = 0; i < numScholarships; i++) {
      const programs = uni.universityPrograms;
      let connectedPrograms: { id: string }[] = [];

      // connect to some random programs if available
      if (programs.length > 0) {
        // Pick 1 to 3 random programs to attach this scholarship to
        const numProgramsToConnect = Math.min(
          programs.length,
          Math.floor(Math.random() * 3) + 1,
        );
        const shuffled = [...programs].sort(() => 0.5 - Math.random());
        connectedPrograms = shuffled
          .slice(0, numProgramsToConnect)
          .map((p) => ({ id: p.id }));
      }

      const title = getRandomItem(SCHOLARSHIP_TITLES);
      const description = getRandomItem(DESCRIPTIONS);
      const amount = getRandomAmount();

      await prisma.scholarship.create({
        data: {
          title: title,
          description: description,
          institutionName: uni.name,
          sourceUrl: uni.website || 'https://example.com/scholarship',
          amount: amount,
          currency: uni.applicationFeeCurrency || 'USD',
          isAutoApplied: Math.random() > 0.7,
          universityId: uni.id,
          eligibility: {
            type: 'Merit-based',
            gpa: '3.0+',
            other: 'International student status',
          },
          programs: {
            connect: connectedPrograms,
          },
        },
      });
      scholarshipCount++;
    }
  }

  console.log(`Seeding finished. Created ${scholarshipCount} scholarships.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
