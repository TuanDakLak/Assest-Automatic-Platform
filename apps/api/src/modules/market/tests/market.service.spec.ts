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
            findAll: jest.fn().mockResolvedValue([]),
            findOne: jest.fn().mockResolvedValue({ id: '1' }),
            create: jest.fn().mockResolvedValue({ id: '1' }),
            update: jest.fn().mockResolvedValue({ id: '1' }),
            remove: jest.fn().mockResolvedValue({ id: '1' }),
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
