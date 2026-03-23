import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  EvaluacionFuncional,
  NivelMovilidad,
} from './entities/evaluacion-funcional.entity';
import { EvaluacionFuncionalService } from './evaluacion-funcional.service';
import { Miembro, EstadoSocio } from '../miembros/entities/miembro.entity';

const mockMiembro = {
  id: 1,
  nombre: 'María González',
  rut: '12345678-9',
  estado: EstadoSocio.ACTIVO,
  fechaInscripcion: '2024-01-15',
} as Miembro;

const mockEvaluacion: EvaluacionFuncional = {
  id: 1,
  miembroId: 1,
  miembro: mockMiembro,
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

const createDto = {
  fecha: '2025-03-15',
  nivelMovilidad: NivelMovilidad.AMBULATORIO_CON_APOYO,
  puntuacionSara: 24,
  disartria: true,
};

describe('EvaluacionFuncionalService', () => {
  let service: EvaluacionFuncionalService;
  let evaluacionRepo: jest.Mocked<Repository<EvaluacionFuncional>>;
  let miembrosRepo: jest.Mocked<Repository<Miembro>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EvaluacionFuncionalService,
        {
          provide: getRepositoryToken(EvaluacionFuncional),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Miembro),
          useValue: {
            findOneBy: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<EvaluacionFuncionalService>(
      EvaluacionFuncionalService,
    );
    evaluacionRepo = module.get(getRepositoryToken(EvaluacionFuncional));
    miembrosRepo = module.get(getRepositoryToken(Miembro));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('debe crear la evaluación con miembroId y registradoPorId', async () => {
      miembrosRepo.findOneBy.mockResolvedValue(mockMiembro);
      evaluacionRepo.create.mockReturnValue(mockEvaluacion);
      evaluacionRepo.save.mockResolvedValue(mockEvaluacion);

      const result = await service.create(1, createDto, 10);

      expect(result).toEqual(mockEvaluacion);
      expect(evaluacionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ miembroId: 1, registradoPorId: 10 }),
      );
      expect(evaluacionRepo.save).toHaveBeenCalled();
    });

    it('debe lanzar NotFoundException si el miembro no existe', async () => {
      miembrosRepo.findOneBy.mockResolvedValue(null);

      await expect(service.create(99, createDto, 10)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.create(99, createDto, 10)).rejects.toThrow(
        'Miembro no encontrado',
      );
      expect(evaluacionRepo.save).not.toHaveBeenCalled();
    });

    it('no debe exponer métodos de update ni delete (append-only)', () => {
      expect((service as any).update).toBeUndefined();
      expect((service as any).delete).toBeUndefined();
      expect((service as any).remove).toBeUndefined();
    });
  });

  describe('findAllByMiembro', () => {
    it('debe retornar historial ordenado por fecha desc', async () => {
      const evaluacionAnterior = {
        ...mockEvaluacion,
        id: 2,
        fecha: '2024-09-01',
      };
      evaluacionRepo.find.mockResolvedValue([
        mockEvaluacion,
        evaluacionAnterior,
      ]);

      const result = await service.findAllByMiembro(1);

      expect(result).toHaveLength(2);
      expect(evaluacionRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { miembroId: 1 },
          order: { fecha: 'DESC', createdAt: 'DESC' },
        }),
      );
    });

    it('debe retornar lista vacía si no hay evaluaciones', async () => {
      evaluacionRepo.find.mockResolvedValue([]);

      const result = await service.findAllByMiembro(1);

      expect(result).toHaveLength(0);
    });
  });

  describe('findUltimaByMiembro', () => {
    it('debe retornar la evaluación más reciente', async () => {
      evaluacionRepo.findOne.mockResolvedValue(mockEvaluacion);

      const result = await service.findUltimaByMiembro(1);

      expect(result).toEqual(mockEvaluacion);
      expect(evaluacionRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { miembroId: 1 },
          order: { fecha: 'DESC', createdAt: 'DESC' },
        }),
      );
    });

    it('debe lanzar NotFoundException si no hay evaluaciones para el miembro', async () => {
      evaluacionRepo.findOne.mockResolvedValue(null);

      await expect(service.findUltimaByMiembro(99)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findUltimaByMiembro(99)).rejects.toThrow(
        'No hay evaluaciones registradas para este miembro',
      );
    });
  });
});
