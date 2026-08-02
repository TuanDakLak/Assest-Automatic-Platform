import { Test, TestingModule } from '@nestjs/testing';
import { ResearchController } from '../research.controller';
import { ResearchService } from '../research.service';

describe('ResearchController', () => {
  let controller: ResearchController;
  let service: ResearchService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ResearchController],
      providers: [
        {
          provide: ResearchService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn().mockResolvedValue([]),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            generateResearch: jest.fn().mockResolvedValue('# Mock Markdown Report'),
          },
        },
      ],
    }).compile();

    controller = module.get<ResearchController>(ResearchController);
    service = module.get<ResearchService>(ResearchService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('generate', () => {
    it('should call service and return markdown object', async () => {
      const result = await controller.generate({ topic: 'Deep Learning' });
      expect(service.generateResearch).toHaveBeenCalledWith('Deep Learning');
      expect(result).toEqual({ markdown: '# Mock Markdown Report' });
    });
  });
});
