import { Test, TestingModule } from '@nestjs/testing';
import { MarketService } from '../market.service';
import { MarketRepository } from '../market.repository';

describe('MarketService', () => {
  let service: MarketService;
  let repository: MarketRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarketService,
        {
          provide: MarketRepository,
          useValue: {
            createCategory: jest.fn(),
            findCategories: jest.fn().mockResolvedValue([]),
            findCategoryById: jest.fn(),
            updateCategory: jest.fn(),
            deleteCategory: jest.fn(),
            createStyle: jest.fn(),
            findStyles: jest.fn().mockResolvedValue([]),
            findStyleById: jest.fn(),
            updateStyle: jest.fn(),
            deleteStyle: jest.fn(),
            createMarketTopic: jest.fn(),
            findMarketTopics: jest.fn().mockResolvedValue([]),
            findMarketTopicById: jest.fn(),
            updateMarketTopic: jest.fn(),
            deleteMarketTopic: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<MarketService>(MarketService);
    repository = module.get<MarketRepository>(MarketRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
