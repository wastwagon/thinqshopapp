import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateSupportTicketDto {
    @IsString()
    @IsIn(['logistics', 'procurement', 'wallet', 'account', 'order', 'other'])
    category: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(2000)
    message: string;

    @IsOptional()
    @IsString()
    @MaxLength(120)
    reference?: string;
}
