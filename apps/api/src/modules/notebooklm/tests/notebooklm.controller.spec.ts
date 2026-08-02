import { Test, TestingModule } from '@nestjs/testing';
import { NotebooklmController } from '../notebooklm.controller';
import { NotebooklmService } from '../notebooklm.service';

describe('NotebooklmController', () => {
  let controller: NotebooklmController;
  let service: NotebooklmService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotebooklmController],
      providers: [
        {
          provide: NotebooklmService,
          useValue: {
            findAll: jest.fn().mockResolvedValue([]),
            findOne: jest.fn().mockResolvedValue({ id: '1' }),
            create: jest.fn().mockResolvedValue({ id: '1' }),
            update: jest.fn().mockResolvedValue({ id: '1' }),
            remove: jest.fn().mockResolvedValue({ id: '1' }),
            triggerNotebookLMAutomation: jest.fn().mockResolvedValue({ jobId: 'job_123', status: 'QUEUED' }),
            getJobStatus: jest.fn().mockResolvedValue({ jobId: 'job_123', state: 'completed' }),
          },
        },
      ],
    }).compile();

    controller = module.get<NotebooklmController>(NotebooklmController);
    service = module.get<NotebooklmService>(NotebooklmService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('triggerAutomation', () => {
    it('should call service with body details and return job payload', async () => {
      const result = await controller.triggerAutomation({
        topic: 'Test Topic',
        markdownContent: '# Content',
      });
      expect(service.triggerNotebookLMAutomation).toHaveBeenCalledWith('Test Topic', '# Content');
      expect(result).toEqual({ jobId: 'job_123', status: 'QUEUED' });
    });
  });

  describe('getJobStatus', () => {
    it('should call service and return job status', async () => {
      const result = await controller.getJobStatus('job_123');
      expect(service.getJobStatus).toHaveBeenCalledWith('job_123');
      expect(result).toEqual({ jobId: 'job_123', state: 'completed' });
    });
  });
});
