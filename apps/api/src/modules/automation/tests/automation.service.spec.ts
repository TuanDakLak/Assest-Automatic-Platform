import { Test, TestingModule } from '@nestjs/testing';
import { AutomationService } from '../automation.service';
import { AutomationRepository } from '../automation.repository';

describe('AutomationService', () => {
  let service: AutomationService;
  let repository: AutomationRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AutomationService,
        {
          provide: AutomationRepository,
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

    service = module.get<AutomationService>(AutomationService);
    repository = module.get<AutomationRepository>(AutomationRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
