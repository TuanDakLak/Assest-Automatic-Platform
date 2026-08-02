import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { ResearchService } from './research.service';
import { CreateResearchDto } from './dto/create-research.dto';
import { UpdateResearchDto } from './dto/update-research.dto';

@Controller('research')
export class ResearchController {
  constructor(private readonly researchService: ResearchService) {}

  @Post()
  async create(@Body() createDto: CreateResearchDto) {
    return this.researchService.create(createDto);
  }

  @Get()
  async findAll() {
    return this.researchService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.researchService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateResearchDto) {
    return this.researchService.update(id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.researchService.remove(id);
  }
}
