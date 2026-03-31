import { IsArray, IsIn, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class QrCodeDto {
    @IsString()
    @IsNotEmpty()
    image: string;

    @IsNumber()
    @Min(0)
    amount_cny: number;

    @IsOptional()
    @IsString()
    recipient_name?: string;
}

export class CreateTransferDto {
    @IsNumber()
    @Min(0.01)
    amount_ghs: number;

    @IsString()
    @IsIn(['send_to_china', 'receive_from_china'])
    transfer_direction: string;

    @IsString()
    @IsIn(['bank_account', 'alipay', 'wechat_pay', 'mobile_money'])
    recipient_type: string;

    @IsObject()
    recipient_details: Record<string, unknown>;

    @IsOptional()
    @IsString()
    purpose?: string;

    @IsString()
    @IsIn(['wallet', 'card', 'mobile_money'])
    payment_method: string;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => QrCodeDto)
    qr_codes?: QrCodeDto[];
}

export class UpdateTransferStatusDto {
    @IsString()
    @IsIn(['payment_received', 'processing', 'sent_to_partner', 'completed', 'failed', 'cancelled'])
    status: string;

    @IsOptional()
    @IsString()
    admin_notes?: string;
}

export class ConfirmTransferPaymentDto {
    @IsString()
    @IsNotEmpty()
    paystack_reference: string;
}

export class AddTransferReplyImageDto {
    @IsString()
    @IsNotEmpty()
    imageUrl: string;
}

export class UpdateTransferFulfillmentDto {
    @IsString()
    @IsNotEmpty()
    confirmation_image: string;

    @IsOptional()
    @IsString()
    admin_notes?: string;
}
