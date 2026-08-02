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
});
