import { IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
    @IsString()
    @MinLength(1, { message: 'Reset token is required' })
    token: string;

    @IsString()
    @MinLength(6, { message: 'Password must be at least 6 characters' })
    password: string;
}
