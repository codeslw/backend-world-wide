import { PrismaClient } from '@prisma/client';
import { seedCountries } from './seed/countries';
import { seedCities } from './seed/cities';
import { seedPrograms } from './seed/programs';
import { seedUniversities } from './seed/universities';
import { seedAdminUser } from './seed/users';

const prisma = new PrismaClient();

/**
 * Main seed function that orchestrates the seeding of all data
 */
async function main() {
  console.log('Starting database seeding...');
  
  try {
    // Seed in order of dependencies
    await seedCountries(prisma);
    await seedCities(prisma);
    await seedPrograms(prisma);
    await seedUniversities(prisma);
    await seedAdminUser(prisma);
    
    console.log('Database seeding completed successfully');
  } catch (error) {
    console.error('Error during database seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  }); 