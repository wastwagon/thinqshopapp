import { IsString, IsNumber, IsOptional, IsIn, IsObject, Min, ValidateIf } from 'class-validator';

export class CreateWithdrawalDto {
    @IsNumber()
    @Min(1)
    amount: number;

    @IsIn(['mobile_money', 'bank_transfer'])
    method: 'mobile_money' | 'bank_transfer';

    @IsObject()
    recipient_details: {
        account_name: string;
        phone?: string;
        network?: string;
        bank_name?: string;
        account_number?: string;
    };
}

export class ApproveWithdrawalDto {
    @IsOptional()
    @IsString()
    admin_note?: string;
}

export class RejectWithdrawalDto {
    @IsString()
    rejection_reason: string;
}
