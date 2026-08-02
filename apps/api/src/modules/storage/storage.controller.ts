import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { StorageService } from './storage.service';
import { CreateStorageDto } from './dto/create-storage.dto';
import { UpdateStorageDto } from './dto/update-storage.dto';

@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post()
  async create(@Body() createDto: CreateStorageDto) {
    return this.storageService.create(createDto);
  }

  @Get()
  async findAll() {
    return this.storageService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.storageService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateStorageDto) {
    return this.storageService.update(id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.storageService.remove(id);
  }
}
