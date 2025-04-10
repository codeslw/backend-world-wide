import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

export async function seedAdminUser(prisma: PrismaClient): Promise<void> {
  console.log('Seeding admin users...');
  
  // Default admin credentials (should be changed in production)
  const adminUser = {
    email: 'admin@eduworld.com',
    password: 'Admin123!', // Will be hashed before storage
    role: Role.ADMIN
  };
  
  // Check if admin user already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminUser.email }
  });
  
  if (!existingAdmin) {
    // Hash the password using bcrypt
    const hashedPassword = await bcrypt.hash(adminUser.password, 10);
    
    // Create the admin user
    await prisma.user.create({
      data: {
        email: adminUser.email,
        password: hashedPassword,
        role: adminUser.role,
        profile: {
          create: {
            firstName: "Admin",
            lastName: "User"
          }
        }
      }
    });
    
    console.log('Admin user created successfully');
  } else {
    console.log('Admin user already exists, skipping');
  }
} 