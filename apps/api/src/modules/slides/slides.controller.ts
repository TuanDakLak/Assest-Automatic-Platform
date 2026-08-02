import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { SlidesService } from './slides.service';
import { CreateSlidesDto } from './dto/create-slides.dto';
import { UpdateSlidesDto } from './dto/update-slides.dto';

@Controller('slides')
export class SlidesController {
  constructor(private readonly slidesService: SlidesService) {}

  @Post()
  async create(@Body() createDto: CreateSlidesDto) {
    return this.slidesService.create(createDto);
  }

  @Get()
  async findAll() {
    return this.slidesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.slidesService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateSlidesDto) {
    return this.slidesService.update(id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.slidesService.remove(id);
  }
}
