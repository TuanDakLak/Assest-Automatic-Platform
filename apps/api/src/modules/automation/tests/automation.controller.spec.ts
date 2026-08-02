import { Test, TestingModule } from '@nestjs/testing';
import { AutomationController } from '../automation.controller';
import { AutomationService } from '../automation.service';

describe('AutomationController', () => {
  let controller: AutomationController;
  let service: AutomationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AutomationController],
      providers: [
        {
          provide: AutomationService,
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

    controller = module.get<AutomationController>(AutomationController);
    service = module.get<AutomationService>(AutomationService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
