import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { AssetService } from './asset.service';
import { CreateAssetDto, ExtractAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';

@Controller('asset')
export class AssetController {
  constructor(private readonly assetService: AssetService) {}

  @Post('extract')
  async extractAsset(@Body() dto: ExtractAssetDto) {
    return this.assetService.extractAsset(dto.slidePngPath, {
      promptTemplate: dto.promptTemplate,
      userId: dto.userId,
    });
  }

  @Post()
  async create(@Body() createDto: CreateAssetDto) {
    return this.assetService.create(createDto);
  }

  @Get()
  async findAll() {
    return this.assetService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.assetService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateAssetDto) {
    return this.assetService.update(id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.assetService.remove(id);
  }
}
