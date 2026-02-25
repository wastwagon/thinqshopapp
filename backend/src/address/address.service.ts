import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';

@Injectable()
export class AddressService {
    constructor(private prisma: PrismaService) { }

    async create(userId: number, createAddressDto: CreateAddressDto) {
        // If setting as default, unset other defaults
        if (createAddressDto.is_default) {
            await this.prisma.address.updateMany({
                where: { user_id: userId, is_default: true },
                data: { is_default: false },
            });
        }

        return this.prisma.address.create({
            data: {
                ...createAddressDto,
                user_id: userId,
                address_type: 'home', // Defaulting to home for now
            },
        });
    }

    async findAll(userId: number) {
        return this.prisma.address.findMany({
            where: { user_id: userId },
            orderBy: { is_default: 'desc' },
        });
    }

    async findOne(id: number, userId: number) {
        const address = await this.prisma.address.findFirst({
            where: { id, user_id: userId },
        });
        if (!address) throw new NotFoundException('Address not found');
        return address;
    }

    async update(id: number, userId: number, updateAddressDto: UpdateAddressDto) {
        const address = await this.findOne(id, userId);

        if (updateAddressDto.is_default) {
            await this.prisma.address.updateMany({
                where: { user_id: userId, is_default: true },
                data: { is_default: false },
            });
        }

        return this.prisma.address.update({
            where: { id },
            data: updateAddressDto,
        });
    }

    async remove(id: number, userId: number) {
        await this.findOne(id, userId); // Ensure ownership
        return this.prisma.address.delete({ where: { id } });
    }
}
