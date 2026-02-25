import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
    let service: AuthService;
    let prisma: PrismaService;
    let jwtService: JwtService;

    const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: '$2b$10$hashed',
        role: 'user',
        user_identifier: null,
        phone: null,
        ghana_card: null,
        voter_id: null,
        is_verified: false,
        is_active: true,
        email_verified_at: null,
        phone_verified_at: null,
        created_at: new Date(),
        updated_at: new Date(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                {
                    provide: PrismaService,
                    useValue: {
                        user: {
                            findUnique: jest.fn(),
                            create: jest.fn(),
                            update: jest.fn(),
                            delete: jest.fn(),
                        },
                    },
                },
                {
                    provide: JwtService,
                    useValue: { sign: jest.fn().mockReturnValue('fake-jwt-token') },
                },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
        prisma = module.get<PrismaService>(PrismaService);
        jwtService = module.get<JwtService>(JwtService);
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('validateUser', () => {
        it('should return null when user not found', async () => {
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
            const result = await service.validateUser('nobody@example.com', 'pass');
            expect(result).toBeNull();
        });

        it('should return null when password does not match', async () => {
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
            jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);
            const result = await service.validateUser('test@example.com', 'wrong');
            expect(result).toBeNull();
        });

        it('should return user without password when credentials valid', async () => {
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
            jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
            const result = await service.validateUser('test@example.com', 'correct');
            expect(result).not.toHaveProperty('password');
            expect(result?.email).toBe('test@example.com');
        });
    });

    describe('login', () => {
        it('should return access_token and user', async () => {
            const user = { id: 1, email: 'test@example.com', role: 'user' };
            const result = await Promise.resolve(service.login(user));
            expect(result).toHaveProperty('access_token');
            expect(typeof result.access_token).toBe('string');
            expect(result).toHaveProperty('user');
            expect(result.user).toMatchObject({ email: user.email, role: user.role });
        });
    });
});
