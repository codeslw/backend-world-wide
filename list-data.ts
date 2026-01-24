import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const universities = await prisma.university.findMany({
        take: 5,
        select: { id: true, name: true }
    });
    console.log('Universities in DB:', JSON.stringify(universities, null, 2));

    const programs = await prisma.universityProgram.findMany({
        take: 5,
        select: { id: true, program: { select: { titleRu: true } } }
    });
    console.log('Programs in DB:', JSON.stringify(programs, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
