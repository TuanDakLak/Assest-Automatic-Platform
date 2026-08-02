import { Controller, Get, Post, Body, Param, Put, Delete, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { MarketService } from './market.service';
import { CreateCategoryDto, CreateStyleDto, CreateMarketTopicDto } from './dto/create-market.dto';
import { UpdateCategoryDto, UpdateStyleDto, UpdateMarketTopicDto } from './dto/update-market.dto';
import { 
  ZodValidationPipe, 
  CreateCategorySchema, 
  UpdateCategorySchema, 
  CreateStyleSchema, 
  UpdateStyleSchema, 
  CreateMarketTopicSchema, 
  UpdateMarketTopicSchema 
} from './validators';

@Controller('market')
export class MarketController {
  constructor(private readonly marketService: MarketService) {}

  // ==========================================
  // Category Endpoints
  // ==========================================
  @Post('categories')
  async createCategory(@Body(new ZodValidationPipe(CreateCategorySchema)) createCategoryDto: CreateCategoryDto) {
    return this.marketService.createCategory(createCategoryDto);
  }

  @Get('categories')
  async findAllCategories() {
    return this.marketService.findAllCategories();
  }

  @Get('categories/:id')
  async findOneCategory(@Param('id') id: string) {
    return this.marketService.findCategory(id);
  }

  @Put('categories/:id')
  async updateCategory(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateCategorySchema)) updateCategoryDto: UpdateCategoryDto
  ) {
    return this.marketService.updateCategory(id, updateCategoryDto);
  }

  @Delete('categories/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeCategory(@Param('id') id: string) {
    await this.marketService.removeCategory(id);
  }

  // ==========================================
  // Style Endpoints
  // ==========================================
  @Post('styles')
  async createStyle(@Body(new ZodValidationPipe(CreateStyleSchema)) createStyleDto: CreateStyleDto) {
    return this.marketService.createStyle(createStyleDto);
  }

  @Get('styles')
  async findAllStyles() {
    return this.marketService.findAllStyles();
  }

  @Get('styles/:id')
  async findOneStyle(@Param('id') id: string) {
    return this.marketService.findStyle(id);
  }

  @Put('styles/:id')
  async updateStyle(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateStyleSchema)) updateStyleDto: UpdateStyleDto
  ) {
    return this.marketService.updateStyle(id, updateStyleDto);
  }

  @Delete('styles/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeStyle(@Param('id') id: string) {
    await this.marketService.removeStyle(id);
  }

  // ==========================================
  // MarketTopic Endpoints
  // ==========================================
  @Post('topics')
  async createTopic(@Body(new ZodValidationPipe(CreateMarketTopicSchema)) createTopicDto: CreateMarketTopicDto) {
    return this.marketService.createTopic(createTopicDto);
  }

  @Get('topics')
  async findAllTopics(
    @Query('categoryId') categoryId?: string,
    @Query('styleId') styleId?: string,
    @Query('status') status?: string
  ) {
    return this.marketService.findAllTopics({ categoryId, styleId, status });
  }

  @Get('topics/:id')
  async findOneTopic(@Param('id') id: string) {
    return this.marketService.findTopic(id);
  }

  @Put('topics/:id')
  async updateTopic(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateMarketTopicSchema)) updateTopicDto: UpdateMarketTopicDto
  ) {
    return this.marketService.updateTopic(id, updateTopicDto);
  }

  @Delete('topics/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeTopic(@Param('id') id: string) {
    await this.marketService.removeTopic(id);
  }

  @Post('topics/:id/recalculate')
  async recalculateTopic(@Param('id') id: string) {
    return this.marketService.recalculateTopicScore(id);
  }

  @Post('discover')
  async discoverTopics() {
    return this.marketService.discoverCommercialTopics();
  }
}
