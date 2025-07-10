import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    console.log('🔧 Setting up admin user...');
    
    const adminEmail = 'danny@hardlyhard.com';
    const adminPassword = 'admin123!'; // You should change this after first login
    const adminName = 'Danny Schantz';
    
    // Check if admin user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail }
    });
    
    if (existingUser) {
      console.log('👤 Admin user already exists! Updating admin status...');
      
      // Update to admin if not already
      const updatedUser = await prisma.user.update({
        where: { email: adminEmail },
        data: { isAdmin: true }
      });
      
      console.log(`✅ Updated user ${updatedUser.email} to admin status`);
      return updatedUser;
    }
    
    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);
    
    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        name: adminName,
        password: hashedPassword,
        isAdmin: true
      }
    });
    
    console.log('✅ Admin user created successfully!');
    console.log(`📧 Email: ${adminEmail}`);
    console.log(`🔑 Password: ${adminPassword}`);
    console.log(`👑 Admin: ${adminUser.isAdmin}`);
    console.log('');
    console.log('🔒 IMPORTANT: Please change your password after first login!');
    
    return adminUser;
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createAdminUser()
  .then(() => {
    console.log('🎉 Admin setup complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Setup failed:', error);
    process.exit(1);
  }); 