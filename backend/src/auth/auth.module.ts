import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

@Module({
    imports: [
        PassportModule,
        JwtModule.register({
            secret: process.env.JWT_SECRET || 'thinq_jwt_secret',
            signOptions: { expiresIn: '7d' },
        }),
    ],
    providers: [AuthService],
    controllers: [AuthController],
    exports: [AuthService, JwtModule],
})
export class AuthModule { }
