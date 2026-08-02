export class CreateCategoryDto {
  name: string;
  description?: string;
}

export class CreateStyleDto {
  name: string;
  description?: string;
}

export class CreateMarketTopicDto {
  title: string;
  categoryId: string;
  styleId: string;
  trendScore?: number;
  marketScore?: number;
  searchVolume?: number;
  competitionScore?: number;
  status?: string;
}
