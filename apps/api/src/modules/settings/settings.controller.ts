import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { CreateSettingsDto } from './dto/create-settings.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Post()
  async create(@Body() createDto: CreateSettingsDto) {
    return this.settingsService.create(createDto);
  }

  @Get()
  async findAll() {
    return this.settingsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.settingsService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateSettingsDto) {
    return this.settingsService.update(id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.settingsService.remove(id);
  }
}
