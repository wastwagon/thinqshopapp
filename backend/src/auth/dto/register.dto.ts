import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(6, { message: 'Password must be at least 6 characters' })
    password: string;

    @IsString()
    @MinLength(1)
    @MaxLength(100)
    first_name: string;

    @IsString()
    @MinLength(1)
    @MaxLength(100)
    last_name: string;

    @IsOptional()
    @IsString()
    @MaxLength(20)
    phone?: string;
}
