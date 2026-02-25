
import * as dotenv from 'dotenv';
dotenv.config({ path: '../.env' });
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding Admin User...');

    const email = 'admin@thinqshopping.app';
    const password = await bcrypt.hash('admin123', 10);

    const admin = await prisma.user.upsert({
        where: { email },
        update: { role: 'admin' },
        create: {
            email,
            password,
            user_identifier: 'ADMIN-001',
            role: 'admin',
            is_active: true,
            is_verified: true,
            phone: '+233000000000',
            profile: {
                create: {
                    first_name: 'ThinQShop',
                    last_name: 'Admin',
                }
            },
            wallet: {
                create: {
                    balance_ghs: 0
                }
            }
        },
    });

    console.log('Admin user seeded:', admin.email);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
