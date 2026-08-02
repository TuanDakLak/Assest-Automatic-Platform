import { Test, TestingModule } from '@nestjs/testing';
import { PromptService } from '../prompt.service';
import { PromptRepository } from '../prompt.repository';

describe('PromptService', () => {
  let service: PromptService;
  let repository: PromptRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PromptService,
        {
          provide: PromptRepository,
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

    service = module.get<PromptService>(PromptService);
    repository = module.get<PromptRepository>(PromptRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
