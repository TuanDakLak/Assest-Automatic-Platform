import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { ResearchService } from './research.service';
import { CreateResearchDto, GenerateResearchDto } from './dto/create-research.dto';
import { UpdateResearchDto } from './dto/update-research.dto';

@Controller('research')
export class ResearchController {
  constructor(private readonly researchService: ResearchService) {}

  @Post('generate')
  async generate(@Body() body: GenerateResearchDto) {
    const markdown = await this.researchService.generateResearch(body.topic);
    return { markdown };
  }

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
