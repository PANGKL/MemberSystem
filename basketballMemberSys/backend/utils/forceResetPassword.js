
//node /Users/pangkamlok/Desktop/github/basketballMemberSys/backend/utils/forceResetPassword.js <username> <newPassword>



import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const prisma = new PrismaClient();

async function forceResetPassword() {
  const args = process.argv.slice(2);
  if (args.length !== 2) {
    console.error('Usage: node forceResetPassword.js <username> <newPassword>');
    process.exit(1);
  }

  const [username, newPassword] = args;

  try {
    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      console.error(`User with username "${username}" not found.`);
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await prisma.user.update({
      where: { username },
      data: {
        password: hashedPassword
      }
    });

    console.log(`Password for user "${username}" has been successfully reset.`);
    console.log(`New Password: ${newPassword}`);

  } catch (error) {
    console.error('Error resetting password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

forceResetPassword();