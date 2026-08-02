import { Test, TestingModule } from '@nestjs/testing';
import { ResearchService } from '../research.service';
import { ResearchRepository } from '../research.repository';

describe('ResearchService', () => {
  let service: ResearchService;
  let repository: ResearchRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResearchService,
        {
          provide: ResearchRepository,
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

    service = module.get<ResearchService>(ResearchService);
    repository = module.get<ResearchRepository>(ResearchRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
