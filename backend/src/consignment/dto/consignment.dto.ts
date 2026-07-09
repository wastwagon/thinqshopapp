import {
    IsString,
    IsNumber,
    IsOptional,
    IsArray,
    IsIn,
    IsObject,
    Min,
    Max,
    MinLength,
    ArrayMinSize,
    IsBoolean,
} from 'class-validator';

export class CreateConsignmentSubmissionDto {
    @IsString()
    @MinLength(2)
    name: string;

    @IsNumber()
    category_id: number;

    @IsString()
    @MinLength(10)
    description: string;

    @IsOptional()
    @IsString()
    short_description?: string;

    @IsNumber()
    @Min(1)
    asking_price: number;

    @IsOptional()
    @IsNumber()
    @Min(1)
    stock_quantity?: number;

    @IsIn(['new', 'like_new', 'good', 'fair'])
    condition: 'new' | 'like_new' | 'good' | 'fair';

    @IsArray()
    @ArrayMinSize(1)
    @IsString({ each: true })
    images: string[];

    @IsOptional()
    @IsObject()
    specifications?: Record<string, unknown>;

    @IsString()
    @MinLength(5)
    pickup_details: string;

    @IsOptional()
    @IsString()
    brand?: string;

    @IsOptional()
    @IsString()
    model?: string;

    @IsOptional()
    @IsString()
    serial_number?: string;
}

export class UpdateConsignmentSubmissionDto {
    @IsOptional()
    @IsString()
    @MinLength(2)
    name?: string;

    @IsOptional()
    @IsNumber()
    category_id?: number;

    @IsOptional()
    @IsString()
    @MinLength(10)
    description?: string;

    @IsOptional()
    @IsString()
    short_description?: string;

    @IsOptional()
    @IsNumber()
    @Min(1)
    asking_price?: number;

    @IsOptional()
    @IsNumber()
    @Min(1)
    stock_quantity?: number;

    @IsOptional()
    @IsIn(['new', 'like_new', 'good', 'fair'])
    condition?: 'new' | 'like_new' | 'good' | 'fair';

    @IsOptional()
    @IsArray()
    @ArrayMinSize(1)
    @IsString({ each: true })
    images?: string[];

    @IsOptional()
    @IsObject()
    specifications?: Record<string, unknown>;

    @IsOptional()
    @IsString()
    @MinLength(5)
    pickup_details?: string;

    @IsOptional()
    @IsString()
    brand?: string;

    @IsOptional()
    @IsString()
    model?: string;

    @IsOptional()
    @IsString()
    serial_number?: string;
}

export class ApproveConsignmentDto {
    @IsOptional()
    @IsNumber()
    @Min(1)
    approved_price?: number;

    @IsOptional()
    @IsNumber()
    @Min(1)
    stock_quantity?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(100)
    commission_pct?: number;

    @IsOptional()
    @IsNumber()
    compare_price?: number;

    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    short_description?: string;

    @IsOptional()
    @IsString()
    description?: string;
}

export class RejectConsignmentDto {
    @IsString()
    @MinLength(3)
    rejection_reason: string;
}

export class RequestChangesConsignmentDto {
    @IsString()
    @MinLength(3)
    admin_notes: string;
}

export class UpdateConsignmentSettingsDto {
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(100)
    default_commission_pct?: number;

    @IsOptional()
    @IsBoolean()
    sell_for_me_enabled?: boolean;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(365)
    auto_release_days_after_shipped?: number;
}

export class EscrowHoldDto {
    @IsString()
    @MinLength(3)
    reason: string;
}
