/**
 * Process pending emails from email_queue. Requires DATABASE_URL and SMTP env vars.
 * Run from repo root: DATABASE_URL=... node backend/node_modules/ts-node/dist/bin.js backend/scripts/process-email-queue.ts
 * Or: npm run email:process (from root)
 */
import { PrismaClient } from '@prisma/client';
import * as nodemailer from 'nodemailer';

const prisma = new PrismaClient();

async function main() {
    const transport = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'localhost',
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });
    const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@thinqshopping.app';

    const pending = await prisma.emailQueue.findMany({
        where: { status: 'pending' },
        orderBy: { created_at: 'asc' },
        take: 50,
    });
    if (pending.length === 0) {
        console.log('No pending emails.');
        return;
    }
    for (const row of pending) {
        try {
            await transport.sendMail({
                from,
                to: row.recipient,
                subject: row.subject,
                text: row.body,
                html: row.body.replace(/\n/g, '<br>'),
            });
            await prisma.emailQueue.update({
                where: { id: row.id },
                data: { status: 'sent', sent_at: new Date() },
            });
            console.log(`Sent email ${row.id} to ${row.recipient}`);
        } catch (e) {
            console.error(`Failed email ${row.id}:`, e);
            await prisma.emailQueue.update({
                where: { id: row.id },
                data: { status: 'failed' },
            });
        }
    }
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
