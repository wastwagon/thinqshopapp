import { IsArray, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateProcurementRequestDto {
    @IsString()
    @IsNotEmpty()
    description: string;

    @IsOptional()
    @IsString()
    request_type?: string;

    @IsOptional()
    @IsString()
    specifications?: string;

    @IsOptional()
    @IsNumber()
    @Min(1)
    quantity?: number;

    @IsOptional()
    @IsString()
    budget_range?: string;

    @IsOptional()
    @IsString()
    reference_link?: string;

    @IsOptional()
    @IsArray()
    reference_images?: string[];

}

export class AcceptQuoteDto {
    @IsNumber()
    quoteId: number;
}

export class UpdateProcurementRequestStatusDto {
    @IsString()
    @IsIn(['submitted', 'quote_provided', 'accepted', 'payment_received', 'processing', 'delivered', 'cancelled'])
    status: string;
}

export class CreateProcurementQuoteDto {
    @IsNumber()
    @Min(0.01)
    amount: number;

    @IsString()
    @IsNotEmpty()
    details: string;
}
