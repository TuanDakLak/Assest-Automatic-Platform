import { Test, TestingModule } from '@nestjs/testing';
import { QualityService } from '../quality.service';
import { PrismaService } from 'src/database/prisma.service';
import { QualityRepository } from '../quality.repository';
import { NotFoundException } from '@nestjs/common';
import * as fs from 'fs';

// Mock fs module
jest.mock('fs', () => {
  const actualFs = jest.requireActual('fs');
  return {
    ...actualFs,
    existsSync: jest.fn().mockImplementation((path) => {
      if (path.endsWith('asset.png')) {
        return true;
      }
      return actualFs.existsSync(path);
    }),
    readFileSync: jest.fn().mockReturnValue(Buffer.from('fake-image-bytes')),
  };
});

describe('QualityService', () => {
  let service: QualityService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QualityService,
        {
          provide: QualityRepository,
          useValue: {
            findAll: jest.fn().mockResolvedValue([]),
            findOne: jest.fn().mockResolvedValue({ id: '1' }),
            create: jest.fn().mockResolvedValue({ id: '1' }),
            update: jest.fn().mockResolvedValue({ id: '1' }),
            remove: jest.fn().mockResolvedValue({ id: '1' }),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            asset: {
              findUnique: jest.fn().mockImplementation(({ where }) => {
                if (where.id === 'valid-asset-id') {
                  return {
                    id: 'valid-asset-id',
                    title: 'Valid Asset',
                    url: 'path/to/asset.png',
                    status: 'PENDING',
                    metadata: {},
                  };
                }
                return null;
              }),
              update: jest.fn().mockImplementation(({ where, data }) => {
                return {
                  id: where.id,
                  ...data,
                };
              }),
            },
          },
        },
      ],
    }).compile();

    service = module.get<QualityService>(QualityService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkQuality', () => {
    it('should successfully evaluate an asset, update status to COMPLETED if score >= 90', async () => {
      const result = await service.checkQuality('valid-asset-id');

      expect(result.success).toBe(true);
      expect(result.finalScore).toBe(95);
      expect(result.passed).toBe(true);
      expect(result.status).toBe('COMPLETED');
      expect(prisma.asset.update).toHaveBeenCalledWith({
        where: { id: 'valid-asset-id' },
        data: {
          status: 'COMPLETED',
          metadata: expect.any(Object),
          description: expect.any(String),
        },
      });
    });

    it('should throw NotFoundException if asset does not exist', async () => {
      await expect(
        service.checkQuality('non-existent-id')
      ).rejects.toThrow(NotFoundException);
    });
  });
});
