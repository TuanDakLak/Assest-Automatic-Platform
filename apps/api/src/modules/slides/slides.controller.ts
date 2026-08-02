import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { SlidesService } from './slides.service';
import { CreateSlidesDto, ParseSlidesDto } from './dto/create-slides.dto';
import { UpdateSlidesDto } from './dto/update-slides.dto';

@Controller('slides')
export class SlidesController {
  constructor(private readonly slidesService: SlidesService) {}

  @Post('parse')
  async parseSlides(@Body() dto: ParseSlidesDto) {
    return this.slidesService.parseSlides(dto);
  }

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
