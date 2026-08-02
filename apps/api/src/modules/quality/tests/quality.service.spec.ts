import { Test, TestingModule } from '@nestjs/testing';
import { QualityService } from '../quality.service';
import { QualityRepository } from '../quality.repository';

describe('QualityService', () => {
  let service: QualityService;
  let repository: QualityRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QualityService,
        {
          provide: QualityRepository,
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

    service = module.get<QualityService>(QualityService);
    repository = module.get<QualityRepository>(QualityRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
