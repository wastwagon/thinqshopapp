import * as dotenv from 'dotenv';
dotenv.config({ path: '../.env' });
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const rawPassword = '406125418520';
    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    const userEmail = 'suraj@oceancyber.net';

    const user = await prisma.user.upsert({
        where: { email: userEmail },
        update: {
            password: hashedPassword,
        },
        create: {
            email: userEmail,
            password: hashedPassword,
            phone: '+233000000000',
            is_verified: true,
            profile: {
                create: {
                    first_name: 'Suraj',
                    last_name: 'OceanCyber',
                },
            },
            wallet: {
                create: {
                    balance_ghs: 50000.00,
                },
            },
        },
    });

    console.log(`✅ successfully seeded user: ${user.email} with ID: ${user.id}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
