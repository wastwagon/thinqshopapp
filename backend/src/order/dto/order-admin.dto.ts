import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateOrderStatusDto {
    @IsString()
    @IsIn(['pending', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'])
    status: string;
}

export class ReturnRequestDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(1000)
    reason: string;
}

export class ConfirmOrderPaymentDto {
    @IsString()
    @IsOptional()
    paystack_reference?: string;
}

export class ResolveReturnDto {
    @IsString()
    @IsIn(['approve', 'reject', 'refund'])
    action: string;

    @IsOptional()
    @IsString()
    @MaxLength(1000)
    notes?: string;
}
