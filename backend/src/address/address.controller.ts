import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, ParseIntPipe } from '@nestjs/common';
import { AddressService } from './address.service';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';
import { AuthGuard } from '../auth/auth.guard';

@UseGuards(AuthGuard)
@Controller('addresses')
export class AddressController {
    constructor(private readonly addressService: AddressService) { }

    @Post()
    create(@Request() req, @Body() createAddressDto: CreateAddressDto) {
        return this.addressService.create(req.user.sub, createAddressDto);
    }

    @Get()
    findAll(@Request() req) {
        return this.addressService.findAll(req.user.sub);
    }

    @Get(':id')
    findOne(@Request() req, @Param('id', ParseIntPipe) id: number) {
        return this.addressService.findOne(id, req.user.sub);
    }

    @Patch(':id')
    update(@Request() req, @Param('id', ParseIntPipe) id: number, @Body() updateAddressDto: UpdateAddressDto) {
        return this.addressService.update(id, req.user.sub, updateAddressDto);
    }

    @Delete(':id')
    remove(@Request() req, @Param('id', ParseIntPipe) id: number) {
        return this.addressService.remove(id, req.user.sub);
    }
}
