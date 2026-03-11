import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SmsService } from '../sms/sms.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { InvoiceStatus } from '@prisma/client';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PDFDocument = require('pdfkit');

@Injectable()
export class InvoiceService {
    constructor(
        private prisma: PrismaService,
        private smsService: SmsService,
    ) {}

    private nextInvoiceNumber(): string {
        const y = new Date().getFullYear();
        return `INV-${y}-${Date.now().toString().slice(-6)}`;
    }

    private computeTotals(
        items: { quantity: number; unit_price: number }[],
        discountAmount: number,
        discountPercent: number | null,
        taxRate: number | null,
    ) {
        const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);
        let discount = discountAmount;
        if (discountPercent != null && discountPercent > 0) {
            discount += (subtotal * discountPercent) / 100;
        }
        const afterDiscount = subtotal - discount;
        const taxAmount = taxRate != null && taxRate > 0 ? (afterDiscount * taxRate) / 100 : 0;
        const total = afterDiscount + taxAmount;
        return { subtotal, discount_amount: discount, tax_amount: taxAmount, total };
    }

    async create(dto: CreateInvoiceDto, adminUserId?: number) {
        if (!dto.items?.length) {
            throw new ForbiddenException('At least one line item is required');
        }
        const issueDate = new Date(dto.issue_date);
        const dueDate = new Date(dto.due_date);
        const lineInputs = dto.items.map((i) => ({
            quantity: Number(i.quantity),
            unit_price: Number(i.unit_price),
        }));
        const { subtotal, discount_amount, tax_amount, total } = this.computeTotals(
            lineInputs,
            Number(dto.discount_amount ?? 0),
            dto.discount_percent != null ? Number(dto.discount_percent) : null,
            dto.tax_rate != null ? Number(dto.tax_rate) : null,
        );

        const invoiceNumber = this.nextInvoiceNumber();
        const invoice = await this.prisma.invoice.create({
            data: {
                invoice_number: invoiceNumber,
                status: 'draft',
                issue_date: issueDate,
                due_date: dueDate,
                customer_name: dto.customer_name,
                customer_email: dto.customer_email,
                customer_phone: dto.customer_phone ?? null,
                customer_address: dto.customer_address ?? null,
                subtotal,
                discount_amount,
                discount_percent: dto.discount_percent != null ? dto.discount_percent : null,
                tax_rate: dto.tax_rate != null ? dto.tax_rate : null,
                tax_amount,
                total,
                currency: dto.currency ?? 'GHS',
                notes: dto.notes ?? null,
                created_by: adminUserId ?? null,
                items: {
                    create: dto.items.map((item, idx) => {
                        const qty = Number(item.quantity);
                        const up = Number(item.unit_price);
                        return {
                            description: item.description,
                            quantity: qty,
                            unit: item.unit,
                            unit_price: up,
                            line_total: qty * up,
                            sort_order: idx,
                        };
                    }),
                },
            },
            include: { items: true },
        });
        return invoice;
    }

    async findAll(query: { page?: number; limit?: number; status?: string }) {
        const page = Math.max(1, Number(query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(query.limit) || 50));
        const skip = (page - 1) * limit;
        const where: any = {};
        if (query.status) {
            where.status = query.status as InvoiceStatus;
        }
        const [data, total] = await Promise.all([
            this.prisma.invoice.findMany({
                where,
                include: { items: true },
                orderBy: { created_at: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.invoice.count({ where }),
        ]);
        return {
            data,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }

    async findOne(id: number) {
        const invoice = await this.prisma.invoice.findUnique({
            where: { id },
            include: { items: { orderBy: { sort_order: 'asc' } } },
        });
        if (!invoice) throw new NotFoundException('Invoice not found');
        return invoice;
    }

    async update(id: number, dto: UpdateInvoiceDto) {
        const existing = await this.prisma.invoice.findUnique({ where: { id }, include: { items: true } });
        if (!existing) throw new NotFoundException('Invoice not found');
        if (existing.status !== 'draft') {
            throw new ForbiddenException('Only draft invoices can be updated');
        }

        const items = dto.items ?? existing.items.map((i) => ({ description: i.description, quantity: Number(i.quantity), unit: i.unit, unit_price: Number(i.unit_price) }));
        if (!items.length) throw new ForbiddenException('At least one line item is required');

        const lineInputs = items.map((i: any) => ({
            quantity: Number(i.quantity),
            unit_price: Number(i.unit_price),
        }));
        const discountAmount = dto.discount_amount !== undefined ? Number(dto.discount_amount) : Number(existing.discount_amount);
        const discountPercent = dto.discount_percent !== undefined ? (dto.discount_percent != null ? Number(dto.discount_percent) : null) : (existing.discount_percent != null ? Number(existing.discount_percent) : null);
        const taxRate = dto.tax_rate !== undefined ? (dto.tax_rate != null ? Number(dto.tax_rate) : null) : (existing.tax_rate != null ? Number(existing.tax_rate) : null);
        const { subtotal, discount_amount, tax_amount, total } = this.computeTotals(lineInputs, discountAmount, discountPercent, taxRate);

        await this.prisma.invoiceLineItem.deleteMany({ where: { invoice_id: id } });
        const invoice = await this.prisma.invoice.update({
            where: { id },
            data: {
                ...(dto.issue_date && { issue_date: new Date(dto.issue_date) }),
                ...(dto.due_date && { due_date: new Date(dto.due_date) }),
                ...(dto.customer_name != null && { customer_name: dto.customer_name }),
                ...(dto.customer_email != null && { customer_email: dto.customer_email }),
                ...(dto.customer_phone !== undefined && { customer_phone: dto.customer_phone ?? null }),
                ...(dto.customer_address !== undefined && { customer_address: dto.customer_address ?? null }),
                subtotal,
                discount_amount,
                ...(dto.discount_percent !== undefined && { discount_percent: dto.discount_percent }),
                ...(dto.tax_rate !== undefined && { tax_rate: dto.tax_rate }),
                tax_amount,
                total,
                ...(dto.notes !== undefined && { notes: dto.notes ?? null }),
                ...(dto.currency && { currency: dto.currency }),
                items: {
                    create: items.map((item: any, idx: number) => {
                        const qty = Number(item.quantity);
                        const up = Number(item.unit_price);
                        return {
                            description: item.description,
                            quantity: qty,
                            unit: item.unit,
                            unit_price: up,
                            line_total: qty * up,
                            sort_order: idx,
                        };
                    }),
                },
            },
            include: { items: { orderBy: { sort_order: 'asc' } } },
        });
        return invoice;
    }

    async updateStatus(id: number, status: string) {
        const invoice = await this.prisma.invoice.findUnique({ where: { id } });
        if (!invoice) throw new NotFoundException('Invoice not found');
        const valid: InvoiceStatus[] = ['draft', 'sent', 'paid', 'overdue'];
        if (!valid.includes(status as InvoiceStatus)) {
            throw new ForbiddenException('Invalid status');
        }
        return this.prisma.invoice.update({
            where: { id },
            data: { status: status as InvoiceStatus },
            include: { items: true },
        });
    }

    async generatePdf(id: number, invoiceData?: any): Promise<Buffer> {
        const invoice = invoiceData ?? (await this.findOne(id));
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ size: 'A4', margin: 50 });
            const chunks: Buffer[] = [];
            doc.on('data', (chunk: Buffer) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            const currency = (invoice as any).currency || 'GHS';
            const fmt = (n: number) => Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

            doc.fontSize(20).text('INVOICE', { continued: false }).moveDown(0.5);
            doc.fontSize(10).text(`#${(invoice as any).invoice_number}`, { continued: false }).moveDown(0.3);
            doc.text(`Issue: ${new Date((invoice as any).issue_date).toLocaleDateString()}  |  Due: ${new Date((invoice as any).due_date).toLocaleDateString()}`, { continued: false }).moveDown(1);

            doc.fontSize(11).text('Bill to', { continued: false }).moveDown(0.3);
            doc.fontSize(10)
                .text((invoice as any).customer_name, { continued: false })
                .text((invoice as any).customer_email, { continued: false });
            if ((invoice as any).customer_phone) doc.text((invoice as any).customer_phone, { continued: false });
            if ((invoice as any).customer_address) doc.text((invoice as any).customer_address, { continued: false });
            doc.moveDown(1.5);

            const tableTop = doc.y;
            doc.fontSize(9).font('Helvetica-Bold');
            doc.text('Description', 50, tableTop);
            doc.text('Qty', 280, tableTop);
            doc.text('Unit', 320, tableTop);
            doc.text('Unit price', 360, tableTop, { width: 80, align: 'right' });
            doc.text('Total', 450, tableTop, { width: 90, align: 'right' });
            doc.moveTo(50, tableTop + 14).lineTo(550, tableTop + 14).stroke();
            doc.font('Helvetica');

            let y = tableTop + 22;
            for (const item of (invoice as any).items || []) {
                doc.fontSize(9).text(item.description || '—', 50, y, { width: 220 });
                doc.text(String(Number(item.quantity)), 280, y);
                doc.text(item.unit || '—', 320, y);
                doc.text(currency + ' ' + fmt(Number(item.unit_price)), 360, y, { width: 80, align: 'right' });
                doc.text(currency + ' ' + fmt(Number(item.line_total)), 450, y, { width: 90, align: 'right' });
                y += 18;
            }

            y += 10;
            doc.moveTo(50, y).lineTo(550, y).stroke();
            y += 16;

            doc.text('Subtotal:', 350, y);
            doc.text(currency + ' ' + fmt(Number((invoice as any).subtotal)), 450, y, { width: 90, align: 'right' });
            y += 16;
            if (Number((invoice as any).discount_amount) > 0) {
                doc.text('Discount:', 350, y);
                doc.text('-' + currency + ' ' + fmt(Number((invoice as any).discount_amount)), 450, y, { width: 90, align: 'right' });
                y += 16;
            }
            if (Number((invoice as any).tax_amount) > 0) {
                doc.text('Tax:', 350, y);
                doc.text(currency + ' ' + fmt(Number((invoice as any).tax_amount)), 450, y, { width: 90, align: 'right' });
                y += 16;
            }
            doc.font('Helvetica-Bold').fontSize(11);
            doc.text('Total:', 350, y);
            doc.text(currency + ' ' + fmt(Number((invoice as any).total)), 450, y, { width: 90, align: 'right' });

            if ((invoice as any).notes) {
                doc.font('Helvetica').fontSize(9).moveDown(2).text('Notes: ' + (invoice as any).notes, 50, doc.y, { width: 500 });
            }

            doc.end();
        });
    }

    /**
     * Send invoice summary (quotation/key figures) via SMS to the customer's phone.
     * Requires invoice to have customer_phone.
     */
    async sendInvoiceSummarySms(id: number): Promise<{ sent: boolean; message?: string }> {
        const invoice = await this.findOne(id);
        const inv = invoice as any;
        const phone = inv.customer_phone;
        if (!phone || !String(phone).trim()) {
            return { sent: false, message: 'Customer phone number is missing' };
        }
        const currency = inv.currency || 'GHS';
        const total = Number(inv.total).toLocaleString(undefined, { minimumFractionDigits: 2 });
        const due = inv.due_date ? new Date(inv.due_date).toLocaleDateString() : 'N/A';
        const msg = `ThinQShop Invoice ${inv.invoice_number}. Total: ${currency} ${total}. Due: ${due}. Thank you.`;
        const sent = await this.smsService.send(phone, msg);
        return sent ? { sent: true } : { sent: false, message: 'SMS could not be sent' };
    }
}
