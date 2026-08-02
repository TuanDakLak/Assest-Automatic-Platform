import { Test, TestingModule } from '@nestjs/testing';
import { MarketController } from '../market.controller';
import { MarketService } from '../market.service';

describe('MarketController', () => {
  let controller: MarketController;
  let service: MarketService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MarketController],
      providers: [
        {
          provide: MarketService,
          useValue: {
            createCategory: jest.fn(),
            findAllCategories: jest.fn().mockResolvedValue([]),
            findCategory: jest.fn(),
            updateCategory: jest.fn(),
            removeCategory: jest.fn(),
            createStyle: jest.fn(),
            findAllStyles: jest.fn().mockResolvedValue([]),
            findStyle: jest.fn(),
            updateStyle: jest.fn(),
            removeStyle: jest.fn(),
            createTopic: jest.fn(),
            findAllTopics: jest.fn().mockResolvedValue([]),
            findTopic: jest.fn(),
            updateTopic: jest.fn(),
            removeTopic: jest.fn(),
            recalculateTopicScore: jest.fn(),
            discoverCommercialTopics: jest.fn().mockResolvedValue({ count: 0, topics: [] }),
          },
        },
      ],
    }).compile();

    controller = module.get<MarketController>(MarketController);
    service = module.get<MarketService>(MarketService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
