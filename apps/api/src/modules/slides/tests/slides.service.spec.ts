import { Test, TestingModule } from '@nestjs/testing';
import { SlidesService } from '../slides.service';
import { SlidesRepository } from '../slides.repository';

describe('SlidesService', () => {
  let service: SlidesService;
  let repository: SlidesRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SlidesService,
        {
          provide: SlidesRepository,
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

    service = module.get<SlidesService>(SlidesService);
    repository = module.get<SlidesRepository>(SlidesRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
