import { Test, TestingModule } from '@nestjs/testing';
import { AssetController } from '../asset.controller';
import { AssetService } from '../asset.service';

describe('AssetController', () => {
  let controller: AssetController;
  let service: AssetService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssetController],
      providers: [
        {
          provide: AssetService,
          useValue: {
            findAll: jest.fn().mockResolvedValue([]),
            findOne: jest.fn().mockResolvedValue({ id: '1' }),
            create: jest.fn().mockResolvedValue({ id: '1' }),
            update: jest.fn().mockResolvedValue({ id: '1' }),
            remove: jest.fn().mockResolvedValue({ id: '1' }),
            extractAsset: jest.fn().mockResolvedValue({ success: true, assetId: 'asset-id-999' }),
          },
        },
      ],
    }).compile();

    controller = module.get<AssetController>(AssetController);
    service = module.get<AssetService>(AssetService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('extractAsset', () => {
    it('should invoke service.extractAsset with body payload', async () => {
      const dto = { slidePngPath: 'slide.png', promptTemplate: 'Extract illustration', userId: 'user-1' };
      const result = await controller.extractAsset(dto);
      
      expect(service.extractAsset).toHaveBeenCalledWith(dto.slidePngPath, {
        promptTemplate: dto.promptTemplate,
        userId: dto.userId,
      });
      expect(result).toEqual({ success: true, assetId: 'asset-id-999' });
    });
  });
});
