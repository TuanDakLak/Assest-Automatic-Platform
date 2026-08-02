import { Test, TestingModule } from '@nestjs/testing';
import { PromptController } from '../prompt.controller';
import { PromptService } from '../prompt.service';

describe('PromptController', () => {
  let controller: PromptController;
  let service: PromptService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PromptController],
      providers: [
        {
          provide: PromptService,
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

    controller = module.get<PromptController>(PromptController);
    service = module.get<PromptService>(PromptService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
