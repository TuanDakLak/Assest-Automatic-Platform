import { Test, TestingModule } from '@nestjs/testing';
import { StorageService } from '../storage.service';
import { StorageRepository } from '../storage.repository';

describe('StorageService', () => {
  let service: StorageService;
  let repository: StorageRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: StorageRepository,
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

    service = module.get<StorageService>(StorageService);
    repository = module.get<StorageRepository>(StorageRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
