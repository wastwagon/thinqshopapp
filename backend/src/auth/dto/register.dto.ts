import { IsOptional, IsString, MaxLength, MinLength, Matches } from 'class-validator';

/** Accept either email or phone (10–15 digits, optional +). */
const EMAIL_OR_PHONE_REGEX = /^([^\s@]+@[^\s@]+\.[^\s@]+)|(\+?\d{10,15})$/;

export class RegisterDto {
    @IsString()
    @MinLength(1, { message: 'Enter your email or phone number' })
    @Matches(EMAIL_OR_PHONE_REGEX, {
        message: 'Enter a valid email address or phone number (e.g. +233XXXXXXXXX)',
    })
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
