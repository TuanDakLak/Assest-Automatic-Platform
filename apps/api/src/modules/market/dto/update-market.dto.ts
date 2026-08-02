import { PartialType } from '@nestjs/swagger';
import { CreateCategoryDto, CreateStyleDto, CreateMarketTopicDto } from './create-market.dto';

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}

export class UpdateStyleDto extends PartialType(CreateStyleDto) {}

export class UpdateMarketTopicDto extends PartialType(CreateMarketTopicDto) {}
