import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { QualityService } from './quality.service';
import { CreateQualityDto } from './dto/create-quality.dto';
import { UpdateQualityDto } from './dto/update-quality.dto';

@Controller('quality')
export class QualityController {
  constructor(private readonly qualityService: QualityService) {}

  @Post()
  async create(@Body() createDto: CreateQualityDto) {
    return this.qualityService.create(createDto);
  }

  @Get()
  async findAll() {
    return this.qualityService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.qualityService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateQualityDto) {
    return this.qualityService.update(id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.qualityService.remove(id);
  }
}
