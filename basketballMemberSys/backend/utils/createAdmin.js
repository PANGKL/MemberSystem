import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const username = 'admin';
    const email = 'admin@example.com';
    const password = '123456';
    const name = 'admin';

    const existingAdmin = await prisma.user.findUnique({
      where: { username }
    });

    if (existingAdmin) {
      console.log('Admin account already exists.');
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        name,
        role: 'ADMIN',
        points: 9999,
        level: 'EXPERT'
      }
    });

    console.log('Admin account created successfully!');
    console.log(`Username: ${username}`);
    console.log(`Password: ${password}`);
  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
