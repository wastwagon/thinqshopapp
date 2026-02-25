import { PrismaClient } from '@prisma/client';
import { runSeed } from './seed-runner';

const prisma = new PrismaClient();

runSeed(prisma)
    .then(() => console.log('Seed complete.'))
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
