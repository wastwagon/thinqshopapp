import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const ghanaWarehouses = [
        {
            name: 'Lapaz Hub',
            code: 'GH-LAPAZ-001',
            address: 'Lapaz Main Road, Opposite Las Palmas, Accra',
            city: 'Accra',
            country: 'Ghana',
            phone: '+233 24 000 0000',
            recipient_name: 'ThinQ Lapaz Team',
            is_active: true,
        },
        {
            name: 'Kumasi Hub',
            code: 'GH-KUMASI-001',
            address: 'Adum Central, Kumasi',
            city: 'Kumasi',
            country: 'Ghana',
            phone: '+233 24 111 1111',
            recipient_name: 'ThinQ Kumasi Team',
            is_active: true,
        }
    ];

    for (const w of ghanaWarehouses) {
        await prisma.warehouse.upsert({
            where: { code: w.code },
            update: w,
            create: w,
        });
    }

    console.log('Ghana Warehouses seeded successfully');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
