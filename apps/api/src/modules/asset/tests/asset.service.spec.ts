import { Test, TestingModule } from '@nestjs/testing';
import { AssetService } from '../asset.service';
import { PrismaService } from 'src/database/prisma.service';
import { NotFoundException } from '@nestjs/common';
import * as fs from 'fs';

// Mock fs module
jest.mock('fs', () => {
  const actualFs = jest.requireActual('fs');
  return {
    ...actualFs,
    existsSync: jest.fn().mockImplementation((path) => {
      // Only match the specific valid path we use in tests
      if (path.endsWith('path/to/slide.png') || path.endsWith('path\\to\\slide.png')) {
        return true;
      }
      return actualFs.existsSync(path);
    }),
    readFileSync: jest.fn().mockReturnValue(Buffer.from('fake-image-bytes')),
  };
});

describe('AssetService', () => {
  let service: AssetService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssetService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findFirst: jest.fn().mockResolvedValue({ id: 'user-id-123' }),
              create: jest.fn(),
            },
            asset: {
              create: jest.fn().mockImplementation(({ data }) => {
                return {
                  id: 'asset-id-999',
                  ...data,
                };
              }),
            },
          },
        },
      ],
    }).compile();

    service = module.get<AssetService>(AssetService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Prompt Templates', () => {
    it('should retrieve default prompt template', () => {
      const template = service.getPromptTemplate();
      expect(template).toContain('graphic designer and asset extractor');
    });

    it('should allow modifying the prompt template', () => {
      service.setPromptTemplate('Custom prompt context');
      expect(service.getPromptTemplate()).toBe('Custom prompt context');
    });
  });

  describe('extractAsset', () => {
    it('should successfully extract asset details and save success metadata', async () => {
      const result = await service.extractAsset('path/to/slide.png');

      expect(result.success).toBe(true);
      expect(result.assetId).toBe('asset-id-999');
      expect(result.asset.status).toBe('COMPLETED');
      expect((result.asset.metadata as any).model).toBe('gpt-4o-mock');
      expect(prisma.asset.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if slide image does not exist', async () => {
      await expect(
        service.extractAsset('non_existent_slide.png')
      ).rejects.toThrow(NotFoundException);
    });
  });
});
