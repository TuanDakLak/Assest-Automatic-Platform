export class CategoryEntity {
  id: string;
  name: string;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class StyleEntity {
  id: string;
  name: string;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class MarketTopicEntity {
  id: string;
  title: string;
  categoryId: string;
  category?: CategoryEntity;
  styleId: string;
  style?: StyleEntity;
  trendScore: number;
  marketScore: number;
  searchVolume: number;
  competitionScore: number;
  score: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}
