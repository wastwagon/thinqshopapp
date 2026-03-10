import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const ARKESEL_API_URL = 'https://sms.arkesel.com/sms/api';

/**
 * Normalize phone to digits only for Arkesel (e.g. +233544919953 -> 233544919953).
 * Handles Ghana 0-prefix (0544... -> 233544...).
 */
export function normalizePhoneForSms(phone: string | null | undefined): string | null {
    if (!phone || typeof phone !== 'string') return null;
    const trimmed = phone.trim();
    if (!trimmed) return null;
    let digits = trimmed.replace(/\D/g, '');
    if (digits.startsWith('0') && digits.length === 10) {
        digits = '233' + digits.slice(1);
    } else if (!digits.startsWith('233') && digits.length === 9 && /^[1-9]/.test(digits)) {
        digits = '233' + digits;
    }
    if (digits.length < 10) return null;
    return digits;
}

@Injectable()
export class SmsService {
    constructor(private prisma: PrismaService) {}

    /**
     * Send SMS via Arkesel API (supports international numbers including Ghana).
     * See https://developers.arkesel.com and https://arkesel.com
     */
    async send(to: string, message: string): Promise<boolean> {
        const apiKey = process.env.ARKESEL_API_KEY;
        if (!apiKey || !message?.trim()) return false;
        const recipient = normalizePhoneForSms(to);
        if (!recipient) return false;

        const senderId = (process.env.ARKESEL_SENDER_ID || 'ThinQShop').slice(0, 11);

        try {
            const res = await fetch(ARKESEL_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'send-sms',
                    api_key: apiKey,
                    to: recipient,
                    from: senderId,
                    sms: message.trim().slice(0, 480),
                }),
            });
            const data = (await res.json().catch(() => ({}))) as { code?: string; message?: string };
            if (data?.code === 'ok' || data?.message?.toLowerCase() === 'successfully sent') return true;
            return false;
        } catch {
            return false;
        }
    }

    /**
     * Send SMS to a user by ID (uses user.phone). No-op if no phone or Arkesel not configured.
     */
    async sendToUser(userId: number, message: string): Promise<void> {
        try {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                select: { phone: true },
            });
            const phone = user?.phone;
            if (!phone) return;
            await this.send(phone, message);
        } catch {
            // Fire-and-forget; do not throw
        }
    }
}
