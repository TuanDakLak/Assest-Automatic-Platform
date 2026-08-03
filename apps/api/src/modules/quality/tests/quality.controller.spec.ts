import { Test, TestingModule } from '@nestjs/testing';
import { QualityController } from '../quality.controller';
import { QualityService } from '../quality.service';

describe('QualityController', () => {
  let controller: QualityController;
  let service: QualityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QualityController],
      providers: [
        {
          provide: QualityService,
          useValue: {
            findAll: jest.fn().mockResolvedValue([]),
            findOne: jest.fn().mockResolvedValue({ id: '1' }),
            create: jest.fn().mockResolvedValue({ id: '1' }),
            update: jest.fn().mockResolvedValue({ id: '1' }),
            remove: jest.fn().mockResolvedValue({ id: '1' }),
            checkQuality: jest.fn().mockResolvedValue({ success: true, finalScore: 95, passed: true }),
          },
        },
      ],
    }).compile();

    controller = module.get<QualityController>(QualityController);
    service = module.get<QualityService>(QualityService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('checkQuality', () => {
    it('should invoke service.checkQuality with assetId payload', async () => {
      const dto = { assetId: 'asset-1' };
      const result = await controller.checkQuality(dto);

      expect(service.checkQuality).toHaveBeenCalledWith(dto.assetId);
      expect(result).toEqual({ success: true, finalScore: 95, passed: true });
    });
  });
});
