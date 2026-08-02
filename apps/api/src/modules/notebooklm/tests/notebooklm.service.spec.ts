import { Test, TestingModule } from '@nestjs/testing';
import { NotebooklmService } from '../notebooklm.service';
import { NotebooklmRepository } from '../notebooklm.repository';

// Mock BullMQ Queue
jest.mock('bullmq', () => {
  return {
    Queue: jest.fn().mockImplementation(() => {
      return {
        add: jest.fn().mockResolvedValue({
          id: 'job_123',
          name: 'generate-slides',
          timestamp: 1627848600000,
        }),
        getJob: jest.fn().mockImplementation((id) => {
          if (id === 'job_123') {
            return {
              id: 'job_123',
              getState: jest.fn().mockResolvedValue('completed'),
              progress: 100,
              returnvalue: { success: true, downloadedFilePath: '/downloads/presentation.pptx' },
              failedReason: null,
              timestamp: 1627848600000,
            };
          }
          return null;
        }),
      };
    }),
  };
});

describe('NotebooklmService', () => {
  let service: NotebooklmService;

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
    // Explicitly call onModuleInit to initialize mock queue
    service.onModuleInit();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('triggerNotebookLMAutomation', () => {
    it('should queue a slide generation job and return details', async () => {
      const result = await service.triggerNotebookLMAutomation('Test Topic', '# Test Content');
      expect(result).toEqual({
        jobId: 'job_123',
        name: 'generate-slides',
        status: 'QUEUED',
        timestamp: 1627848600000,
      });
    });
  });

  describe('getJobStatus', () => {
    it('should return job status details for a valid job ID', async () => {
      const result = await service.getJobStatus('job_123');
      expect(result).toEqual({
        jobId: 'job_123',
        state: 'completed',
        progress: 100,
        result: { success: true, downloadedFilePath: '/downloads/presentation.pptx' },
        failedReason: null,
        timestamp: 1627848600000,
      });
    });

    it('should throw NotFoundException for an invalid job ID', async () => {
      await expect(service.getJobStatus('invalid_job')).rejects.toThrow();
    });
  });
});
