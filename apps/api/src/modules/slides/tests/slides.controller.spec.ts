import { Test, TestingModule } from '@nestjs/testing';
import { SlidesController } from '../slides.controller';
import { SlidesService } from '../slides.service';

describe('SlidesController', () => {
  let controller: SlidesController;
  let service: SlidesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SlidesController],
      providers: [
        {
          provide: SlidesService,
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

    controller = module.get<SlidesController>(SlidesController);
    service = module.get<SlidesService>(SlidesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
