import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { MarketService } from './market.service';
import { CreateMarketDto } from './dto/create-market.dto';
import { UpdateMarketDto } from './dto/update-market.dto';

@Controller('market')
export class MarketController {
  constructor(private readonly marketService: MarketService) {}

  @Post()
  async create(@Body() createDto: CreateMarketDto) {
    return this.marketService.create(createDto);
  }

  @Get()
  async findAll() {
    return this.marketService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.marketService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateMarketDto) {
    return this.marketService.update(id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.marketService.remove(id);
  }
}
