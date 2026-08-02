import { Test, TestingModule } from '@nestjs/testing';
import { AssetService } from '../asset.service';
import { AssetRepository } from '../asset.repository';

describe('AssetService', () => {
  let service: AssetService;
  let repository: AssetRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssetService,
        {
          provide: AssetRepository,
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

    service = module.get<AssetService>(AssetService);
    repository = module.get<AssetRepository>(AssetRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
