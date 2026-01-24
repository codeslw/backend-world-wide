import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const universityId = 'ce9f9be9-6538-46ab-8e43-acf301996756';
    const programIds = ['023a5fbe-f8e5-4bd9-a474-c9740b2038f8'];

    console.log('Checking University:', universityId);
    const university = await prisma.university.findUnique({
        where: { id: universityId },
    });
    console.log('University found:', university ? university.name : 'NO');

    console.log('Checking Programs:', programIds);
    const foundPrograms = await prisma.universityProgram.findMany({
        where: { id: { in: programIds } },
        include: { university: true, program: true }
    });

    console.log('Found Programs count:', foundPrograms.length);
    foundPrograms.forEach(p => {
        console.log(`- Program ID: ${p.id}, Program Name: ${p.program.titleRu}, University ID: ${p.universityId}, University: ${p.university.name}`);
    });

    if (foundPrograms.length < programIds.length) {
        const missing = programIds.filter(id => !foundPrograms.some(p => p.id === id));
        console.log('Missing Program IDs:', missing);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
