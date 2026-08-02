import { Test, TestingModule } from '@nestjs/testing';
import { ResearchService } from '../research.service';
import { ResearchRepository } from '../research.repository';

describe('ResearchService', () => {
  let service: ResearchService;
  let repository: ResearchRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResearchService,
        {
          provide: ResearchRepository,
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

    service = module.get<ResearchService>(ResearchService);
    repository = module.get<ResearchRepository>(ResearchRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateResearch', () => {
    it('should generate a structured markdown report for a topic', async () => {
      const topic = 'Next.js Web App';
      const markdown = await service.generateResearch(topic);

      expect(markdown).toContain('# Research Source: Next.js Web App');
      expect(markdown).toContain('## 1. Overview');
      expect(markdown).toContain('## 2. Core Concepts');
      expect(markdown).toContain('## 3. Industry Terminology');
      expect(markdown).toContain('## 4. Latest Trends');
      expect(markdown).toContain('## 5. Real-World Examples');
      expect(markdown).toContain('## 6. Glossary of Terms');
      expect(markdown).toContain('## 7. References & Citations');
    });

    it('should throw an error if topic is empty', async () => {
      await expect(service.generateResearch('')).rejects.toThrow(
        'Research topic cannot be empty.'
      );
    });
  });
});
