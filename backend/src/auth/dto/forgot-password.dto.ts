import { IsEmail, IsOptional } from 'class-validator';

export class ForgotPasswordDto {
    @IsOptional()
    @IsEmail()
    email?: string;
}
