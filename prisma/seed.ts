import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: adminPassword,
      role: 'ADMIN'
    }
  });

  // Create reception user
  const receptionPassword = await bcrypt.hash('reception123', 10);
  await prisma.user.upsert({
    where: { username: 'reception1' },
    update: {},
    create: {
      username: 'reception1',
      password: receptionPassword,
      role: 'RECEPTION'
    }
  });

  // Create nurse user
  const nursePassword = await bcrypt.hash('nurse123', 10);
  await prisma.user.upsert({
    where: { username: 'nurse1' },
    update: {},
    create: {
      username: 'nurse1',
      password: nursePassword,
      role: 'NURSE'
    }
  });

  // Create display user (for waiting area screen)
  const displayPassword = await bcrypt.hash('display123', 10);
  await prisma.user.upsert({
    where: { username: 'display1' },
    update: {},
    create: {
      username: 'display1',
      password: displayPassword,
      role: 'DISPLAY'
    }
  });

  // Create doctor users and profiles
  const doctors = [
    {
      username: 'dr.ahmed',
      password: await bcrypt.hash('doctor123', 10),
      name: 'Dr. Ahmed Ali',
      specialization: 'General Medicine',
      consultationFee: 2000,
      roomNumber: 'Room 1'
    },
    {
      username: 'dr.fatima',
      password: await bcrypt.hash('doctor123', 10),
      name: 'Dr. Fatima Khan',
      specialization: 'Pediatrics',
      consultationFee: 2500,
      roomNumber: 'Room 2'
    },
    {
      username: 'dr.hassan',
      password: await bcrypt.hash('doctor123', 10),
      name: 'Dr. Hassan Raza',
      specialization: 'Cardiology',
      consultationFee: 3000,
      roomNumber: 'Room 3'
    }
  ];

  for (const doc of doctors) {
    const user = await prisma.user.upsert({
      where: { username: doc.username },
      update: {},
      create: {
        username: doc.username,
        password: doc.password,
        role: 'DOCTOR'
      }
    });

    await prisma.doctor.upsert({
      where: { userId: user.id },
      update: {
        name: doc.name,
        specialization: doc.specialization,
        consultationFee: doc.consultationFee,
        roomNumber: doc.roomNumber
      },
      create: {
        userId: user.id,
        name: doc.name,
        specialization: doc.specialization,
        consultationFee: doc.consultationFee,
        roomNumber: doc.roomNumber
      }
    });
  }

  // eslint-disable-next-line no-console
  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

