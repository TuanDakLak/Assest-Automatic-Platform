import { PipeTransform, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { z, ZodSchema } from 'zod';

// Zod Validation Pipe
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown, metadata: ArgumentMetadata) {
    if (metadata.type !== 'body') {
      return value;
    }
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: result.error.format(),
      });
    }
    return result.data;
  }
}

// Category Schemas
export const CreateCategorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long').max(50),
  description: z.string().max(200).optional(),
  // Seed subject keywords sent to the GDELT DOC 2.0 API during discovery.
  keywords: z
    .array(
      z
        .string()
        .min(3, 'Each keyword must be at least 3 characters long')
        .max(60, 'GDELT phrase queries longer than 60 characters rarely match')
    )
    .max(25, 'Keep to 25 keywords per category — each one costs 3 throttled GDELT requests')
    .optional(),
});

export const UpdateCategorySchema = CreateCategorySchema.partial();

// Style Schemas
export const CreateStyleSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long').max(50),
  description: z.string().max(200).optional(),
});

export const UpdateStyleSchema = CreateStyleSchema.partial();

// MarketTopic Schemas
export const CreateMarketTopicSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters long').max(100),
  categoryId: z.string().uuid('Invalid category ID format'),
  styleId: z.string().uuid('Invalid style ID format'),
  trendScore: z.number().min(0).max(100).default(0),
  marketScore: z.number().min(0).max(100).default(0),
  searchVolume: z.number().int().min(0).default(0),
  competitionScore: z.number().min(0).max(100).default(0),
  status: z.enum(['DISCOVERED', 'ANALYZING', 'VALIDATED', 'ARCHIVED']).default('DISCOVERED'),
});

export const UpdateMarketTopicSchema = CreateMarketTopicSchema.partial();
