import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { NotebooklmService } from './notebooklm.service';
import { CreateNotebooklmDto } from './dto/create-notebooklm.dto';
import { UpdateNotebooklmDto } from './dto/update-notebooklm.dto';

@Controller('notebooklm')
export class NotebooklmController {
  constructor(private readonly notebooklmService: NotebooklmService) {}

  @Post()
  async create(@Body() createDto: CreateNotebooklmDto) {
    return this.notebooklmService.create(createDto);
  }

  @Get()
  async findAll() {
    return this.notebooklmService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.notebooklmService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateNotebooklmDto) {
    return this.notebooklmService.update(id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.notebooklmService.remove(id);
  }
}
