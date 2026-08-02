import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { AutomationService } from './automation.service';
import { CreateAutomationDto } from './dto/create-automation.dto';
import { UpdateAutomationDto } from './dto/update-automation.dto';

@Controller('automation')
export class AutomationController {
  constructor(private readonly automationService: AutomationService) {}

  @Post()
  async create(@Body() createDto: CreateAutomationDto) {
    return this.automationService.create(createDto);
  }

  @Get()
  async findAll() {
    return this.automationService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.automationService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateAutomationDto) {
    return this.automationService.update(id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.automationService.remove(id);
  }
}
