import { IsString, IsOptional, IsBoolean, IsNotEmpty } from 'class-validator';

export class CreateAddressDto {
    @IsString()
    @IsNotEmpty()
    full_name: string;

    @IsString()
    @IsNotEmpty()
    phone: string;

    @IsString()
    @IsNotEmpty()
    street: string;

    @IsString()
    @IsNotEmpty()
    city: string;

    @IsString()
    @IsNotEmpty()
    region: string;

    @IsOptional()
    @IsString()
    landmark?: string;

    @IsOptional()
    @IsString()
    gps_coords?: string;

    @IsOptional()
    @IsBoolean()
    is_default?: boolean;
}

export class UpdateAddressDto extends CreateAddressDto { }
