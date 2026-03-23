import { Test, TestingModule } from '@nestjs/testing';
import { EvaluacionFuncionalController } from './evaluacion-funcional.controller';
import { EvaluacionFuncionalService } from './evaluacion-funcional.service';
import { NivelMovilidad } from './entities/evaluacion-funcional.entity';
import { CreateEvaluacionFuncionalDto } from './dto/create-evaluacion-funcional.dto';

const mockEvaluacion = {
  id: 1,
  miembroId: 1,
  fecha: '2025-03-15',
  nivelMovilidad: NivelMovilidad.AMBULATORIO_CON_APOYO,
  puntuacionSara: 24,
  disartria: true,
  disfagia: false,
  nistagmo: false,
  tieneCuidador: false,
  nombreCuidador: null,
  observaciones: null,
  registradoPorId: 10,
  registradoPor: null,
  createdAt: new Date(),
};

describe('EvaluacionFuncionalController', () => {
  let controller: EvaluacionFuncionalController;
  let service: jest.Mocked<EvaluacionFuncionalService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EvaluacionFuncionalController],
      providers: [
        {
          provide: EvaluacionFuncionalService,
          useValue: {
            create: jest.fn().mockResolvedValue(mockEvaluacion),
            findAllByMiembro: jest.fn().mockResolvedValue([mockEvaluacion]),
            findUltimaByMiembro: jest.fn().mockResolvedValue(mockEvaluacion),
          },
        },
      ],
    }).compile();

    controller = module.get<EvaluacionFuncionalController>(
      EvaluacionFuncionalController,
    );
    service = module.get(EvaluacionFuncionalService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('debe llamar a service.create con miembroId, DTO y userId del usuario actual', async () => {
      const dto: CreateEvaluacionFuncionalDto = {
        fecha: '2025-03-15',
        nivelMovilidad: NivelMovilidad.AMBULATORIO_CON_APOYO,
        puntuacionSara: 24,
      };
      const currentUser = { id: 10 };

      await controller.create(1, dto, currentUser, '127.0.0.1');

      expect(service.create).toHaveBeenCalledWith(1, dto, 10, '127.0.0.1');
    });

    it('debe retornar la evaluación creada', async () => {
      const dto: CreateEvaluacionFuncionalDto = {
        fecha: '2025-03-15',
        nivelMovilidad: NivelMovilidad.AMBULATORIO_CON_APOYO,
      };

      const result = await controller.create(1, dto, { id: 10 }, '127.0.0.1');

      expect(result).toEqual(mockEvaluacion);
    });
  });

  describe('findAll', () => {
    it('debe llamar a service.findAllByMiembro con el miembroId', async () => {
      await controller.findAll(1);

      expect(service.findAllByMiembro).toHaveBeenCalledWith(1);
    });

    it('debe retornar la lista de evaluaciones', async () => {
      const result = await controller.findAll(1);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockEvaluacion);
    });
  });

  describe('findUltima', () => {
    it('debe llamar a service.findUltimaByMiembro con el miembroId', async () => {
      await controller.findUltima(1);

      expect(service.findUltimaByMiembro).toHaveBeenCalledWith(1);
    });

    it('debe retornar la evaluación más reciente', async () => {
      const result = await controller.findUltima(1);

      expect(result).toEqual(mockEvaluacion);
      expect(result.nivelMovilidad).toBe(NivelMovilidad.AMBULATORIO_CON_APOYO);
    });
  });
});
