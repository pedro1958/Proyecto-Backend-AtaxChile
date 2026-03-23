import { Test, TestingModule } from '@nestjs/testing';
import { DiagnosticoClinicoController } from './diagnostico-clinico.controller';
import { DiagnosticoClinicoService } from './diagnostico-clinico.service';
import { ConfirmacionDiagnostico } from './entities/diagnostico-clinico.entity';

const mockDiagnostico = {
  id: 1,
  miembroId: 1,
  tipoAtaxiaId: 2,
  tipoAtaxia: null,
  subtipo: 'SCA2',
  confirmacion: ConfirmacionDiagnostico.GENETICO,
  fechaDiagnostico: '2018-06-15',
  institucion: 'Hospital del Salvador',
  medico: 'Dr. Juan Pérez',
  observaciones: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('DiagnosticoClinicoController', () => {
  let controller: DiagnosticoClinicoController;
  let service: jest.Mocked<DiagnosticoClinicoService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DiagnosticoClinicoController],
      providers: [
        {
          provide: DiagnosticoClinicoService,
          useValue: {
            create: jest.fn().mockResolvedValue(mockDiagnostico),
            findByMiembro: jest.fn().mockResolvedValue(mockDiagnostico),
            update: jest
              .fn()
              .mockResolvedValue({ ...mockDiagnostico, subtipo: 'SCA3' }),
          },
        },
      ],
    }).compile();

    controller = module.get<DiagnosticoClinicoController>(
      DiagnosticoClinicoController,
    );
    service = module.get(DiagnosticoClinicoService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('debe llamar a service.create con miembroId y DTO', async () => {
      const dto = {
        subtipo: 'SCA2',
        confirmacion: ConfirmacionDiagnostico.GENETICO,
      };

      await controller.create(1, dto, { id: 99 }, '127.0.0.1');

      expect(service.create).toHaveBeenCalledWith(1, dto, 99, '127.0.0.1');
    });

    it('debe retornar el diagnóstico creado', async () => {
      const result = await controller.create(1, {}, { id: 99 }, '127.0.0.1');

      expect(result).toEqual(mockDiagnostico);
    });
  });

  describe('findByMiembro', () => {
    it('debe llamar a service.findByMiembro con el miembroId', async () => {
      await controller.findByMiembro(1);

      expect(service.findByMiembro).toHaveBeenCalledWith(1);
    });

    it('debe retornar el diagnóstico encontrado', async () => {
      const result = await controller.findByMiembro(1);

      expect(result).toEqual(mockDiagnostico);
    });
  });

  describe('update', () => {
    it('debe llamar a service.update con miembroId y DTO', async () => {
      const dto = { subtipo: 'SCA3' };

      await controller.update(1, dto, { id: 99 }, '127.0.0.1');

      expect(service.update).toHaveBeenCalledWith(1, dto, 99, '127.0.0.1');
    });

    it('debe retornar el diagnóstico actualizado', async () => {
      const result = await controller.update(1, { subtipo: 'SCA3' }, { id: 99 }, '127.0.0.1');

      expect(result.subtipo).toBe('SCA3');
    });
  });
});
