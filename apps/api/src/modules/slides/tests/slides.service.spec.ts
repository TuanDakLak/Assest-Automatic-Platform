import { Test, TestingModule } from '@nestjs/testing';
import { SlidesService } from '../slides.service';
import { SlidesRepository } from '../slides.repository';
import { NotFoundException } from '@nestjs/common';
import * as fs from 'fs';

// Mock node-pptx-png
jest.mock('node-pptx-png', () => {
  return {
    renderPresentation: jest.fn().mockResolvedValue({
      allSuccessful: true,
      totalSlides: 2,
      successfulSlides: 2,
      slides: [
        {
          slideNumber: 1,
          success: true,
          width: 1920,
          height: 1080,
          imageData: Buffer.from('fake-image-data-1'),
        },
        {
          slideNumber: 2,
          success: true,
          width: 1920,
          height: 1080,
          imageData: Buffer.from('fake-image-data-2'),
        },
      ],
    }),
  };
});

// Mock fs module
jest.mock('fs', () => {
  const actualFs = jest.requireActual('fs');
  return {
    ...actualFs,
    existsSync: jest.fn().mockImplementation((path) => {
      if (path.endsWith('test_presentation.pptx')) {
        return true;
      }
      return actualFs.existsSync(path);
    }),
    writeFileSync: jest.fn(),
    mkdirSync: jest.fn(),
  };
});

describe('SlidesService', () => {
  let service: SlidesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SlidesService,
        {
          provide: SlidesRepository,
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

    service = module.get<SlidesService>(SlidesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('parseSlides', () => {
    it('should successfully parse slides from a valid mock file path', async () => {
      const result = await service.parseSlides({
        filePath: 'test_presentation.pptx',
        scale: 2,
        transparent: true,
      });

      expect(result.success).toBe(true);
      expect(result.slideCount).toBe(2);
      expect(result.slides[0]).toEqual({
        slideNumber: 1,
        width: 1920,
        height: 1080,
        path: expect.any(String),
      });
      expect(fs.writeFileSync).toHaveBeenCalledTimes(2);
    });

    it('should throw NotFoundException if slide presentation file does not exist', async () => {
      await expect(
        service.parseSlides({
          filePath: 'non_existent_presentation.pptx',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
