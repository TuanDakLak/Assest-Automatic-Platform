import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { PromptService } from './prompt.service';
import { CreatePromptDto } from './dto/create-prompt.dto';
import { UpdatePromptDto } from './dto/update-prompt.dto';

@Controller('prompt')
export class PromptController {
  constructor(private readonly promptService: PromptService) {}

  @Post()
  async create(@Body() createDto: CreatePromptDto) {
    return this.promptService.create(createDto);
  }

  @Get()
  async findAll() {
    return this.promptService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.promptService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdatePromptDto) {
    return this.promptService.update(id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.promptService.remove(id);
  }
}
