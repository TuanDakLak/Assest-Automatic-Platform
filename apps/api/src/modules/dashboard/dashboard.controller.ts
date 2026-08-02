import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { CreateDashboardDto } from './dto/create-dashboard.dto';
import { UpdateDashboardDto } from './dto/update-dashboard.dto';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Post()
  async create(@Body() createDto: CreateDashboardDto) {
    return this.dashboardService.create(createDto);
  }

  @Get()
  async findAll() {
    return this.dashboardService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.dashboardService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateDashboardDto) {
    return this.dashboardService.update(id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.dashboardService.remove(id);
  }
}
