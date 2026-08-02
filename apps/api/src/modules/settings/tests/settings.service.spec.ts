import { Test, TestingModule } from '@nestjs/testing';
import { SettingsService } from '../settings.service';
import { SettingsRepository } from '../settings.repository';

describe('SettingsService', () => {
  let service: SettingsService;
  let repository: SettingsRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        {
          provide: SettingsRepository,
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

    service = module.get<SettingsService>(SettingsService);
    repository = module.get<SettingsRepository>(SettingsRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
