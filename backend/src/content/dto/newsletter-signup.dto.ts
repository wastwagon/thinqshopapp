import { IsEmail, MaxLength } from 'class-validator';

export class NewsletterSignupDto {
    @IsEmail()
    @MaxLength(255)
    email!: string;
}
