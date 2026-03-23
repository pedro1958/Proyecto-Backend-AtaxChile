import { Test, TestingModule } from '@nestjs/testing';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';

const mockResumen = { total: 6, activos: 4, nuevosUltimos30Dias: 1 };
const mockEstados = [
  { estado: 'activo', total: '4' },
  { estado: 'fallecido', total: '1' },
];
const mockDiag = [
  { tipoAtaxia: 'Ataxia de Friedreich', confirmacion: 'genetico', total: '2' },
];
const mockMovilidad = [{ nivelMovilidad: 'ambulatorio_con_apoyo', total: '2' }];
const mockRegiones = [{ region: 'Región de Arica y Parinacota', total: '3' }];

describe('StatsController', () => {
  let controller: StatsController;
  let service: jest.Mocked<StatsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StatsController],
      providers: [
        {
          provide: StatsService,
          useValue: {
            resumen: jest.fn().mockResolvedValue(mockResumen),
            porEstado: jest.fn().mockResolvedValue(mockEstados),
            porDiagnostico: jest.fn().mockResolvedValue(mockDiag),
            porMovilidad: jest.fn().mockResolvedValue(mockMovilidad),
            porRegion: jest.fn().mockResolvedValue(mockRegiones),
          },
        },
      ],
    }).compile();

    controller = module.get<StatsController>(StatsController);
    service = module.get(StatsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('resumen', () => {
    it('debe llamar a service.resumen', async () => {
      await controller.resumen();
      expect(service.resumen).toHaveBeenCalled();
    });

    it('debe retornar el resultado del service', async () => {
      const result = await controller.resumen();
      expect(result).toEqual(mockResumen);
    });
  });

  describe('miembros', () => {
    it('debe llamar a service.porEstado', async () => {
      await controller.miembros();
      expect(service.porEstado).toHaveBeenCalled();
    });

    it('debe retornar el resultado del service', async () => {
      const result = await controller.miembros();
      expect(result).toEqual(mockEstados);
    });
  });

  describe('diagnosticos', () => {
    it('debe llamar a service.porDiagnostico', async () => {
      await controller.diagnosticos();
      expect(service.porDiagnostico).toHaveBeenCalled();
    });

    it('debe retornar el resultado del service', async () => {
      const result = await controller.diagnosticos();
      expect(result).toEqual(mockDiag);
    });
  });

  describe('funcional', () => {
    it('debe llamar a service.porMovilidad', async () => {
      await controller.funcional();
      expect(service.porMovilidad).toHaveBeenCalled();
    });

    it('debe retornar el resultado del service', async () => {
      const result = await controller.funcional();
      expect(result).toEqual(mockMovilidad);
    });
  });

  describe('geografico', () => {
    it('debe llamar a service.porRegion', async () => {
      await controller.geografico();
      expect(service.porRegion).toHaveBeenCalled();
    });

    it('debe retornar el resultado del service', async () => {
      const result = await controller.geografico();
      expect(result).toEqual(mockRegiones);
    });
  });
});
