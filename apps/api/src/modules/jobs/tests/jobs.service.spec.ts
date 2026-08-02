import { Test, TestingModule } from '@nestjs/testing';
import { JobsService } from '../jobs.service';
import { JobsRepository } from '../jobs.repository';

describe('JobsService', () => {
  let service: JobsService;
  let repository: JobsRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsService,
        {
          provide: JobsRepository,
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

    service = module.get<JobsService>(JobsService);
    repository = module.get<JobsRepository>(JobsRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
