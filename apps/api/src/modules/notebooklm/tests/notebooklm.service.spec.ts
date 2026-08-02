import { Test, TestingModule } from '@nestjs/testing';
import { NotebooklmService } from '../notebooklm.service';
import { NotebooklmRepository } from '../notebooklm.repository';

describe('NotebooklmService', () => {
  let service: NotebooklmService;
  let repository: NotebooklmRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotebooklmService,
        {
          provide: NotebooklmRepository,
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

    service = module.get<NotebooklmService>(NotebooklmService);
    repository = module.get<NotebooklmRepository>(NotebooklmRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
