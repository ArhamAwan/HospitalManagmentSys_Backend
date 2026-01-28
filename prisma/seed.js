"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    // Create admin user
    const adminPassword = await bcryptjs_1.default.hash('admin123', 10);
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
    const receptionPassword = await bcryptjs_1.default.hash('reception123', 10);
    await prisma.user.upsert({
        where: { username: 'reception1' },
        update: {},
        create: {
            username: 'reception1',
            password: receptionPassword,
            role: 'RECEPTION'
        }
    });
    // Create doctor users and profiles
    const doctors = [
        {
            username: 'dr.ahmed',
            password: await bcryptjs_1.default.hash('doctor123', 10),
            name: 'Dr. Ahmed Ali',
            specialization: 'General Medicine',
            consultationFee: 2000,
            roomNumber: 'Room 1'
        },
        {
            username: 'dr.fatima',
            password: await bcryptjs_1.default.hash('doctor123', 10),
            name: 'Dr. Fatima Khan',
            specialization: 'Pediatrics',
            consultationFee: 2500,
            roomNumber: 'Room 2'
        },
        {
            username: 'dr.hassan',
            password: await bcryptjs_1.default.hash('doctor123', 10),
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
