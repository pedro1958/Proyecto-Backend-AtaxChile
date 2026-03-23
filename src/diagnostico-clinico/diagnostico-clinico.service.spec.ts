import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  DiagnosticoClinico,
  ConfirmacionDiagnostico,
} from './entities/diagnostico-clinico.entity';
import { DiagnosticoClinicoService } from './diagnostico-clinico.service';
import { Miembro, EstadoSocio } from '../miembros/entities/miembro.entity';

const mockMiembro = {
  id: 1,
  nombre: 'María González',
  rut: '12345678-9',
  estado: EstadoSocio.ACTIVO,
  fechaInscripcion: '2024-01-15',
} as Miembro;

const mockDiagnostico: DiagnosticoClinico = {
  id: 1,
  miembroId: 1,
  miembro: mockMiembro,
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

const createDto = {
  tipoAtaxiaId: 2,
  subtipo: 'SCA2',
  confirmacion: ConfirmacionDiagnostico.GENETICO,
  fechaDiagnostico: '2018-06-15',
  institucion: 'Hospital del Salvador',
  medico: 'Dr. Juan Pérez',
};

describe('DiagnosticoClinicoService', () => {
  let service: DiagnosticoClinicoService;
  let diagnosticoRepo: jest.Mocked<Repository<DiagnosticoClinico>>;
  let miembrosRepo: jest.Mocked<Repository<Miembro>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiagnosticoClinicoService,
        {
          provide: getRepositoryToken(DiagnosticoClinico),
          useValue: {
            findOneBy: jest.fn(),
            findOne: jest.fn(),
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

    service = module.get<DiagnosticoClinicoService>(DiagnosticoClinicoService);
    diagnosticoRepo = module.get(getRepositoryToken(DiagnosticoClinico));
    miembrosRepo = module.get(getRepositoryToken(Miembro));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('debe crear el diagnóstico si el miembro existe y no tiene uno previo', async () => {
      miembrosRepo.findOneBy.mockResolvedValue(mockMiembro);
      diagnosticoRepo.findOneBy.mockResolvedValue(null);
      diagnosticoRepo.create.mockReturnValue(mockDiagnostico);
      diagnosticoRepo.save.mockResolvedValue(mockDiagnostico);

      const result = await service.create(1, createDto);

      expect(result).toEqual(mockDiagnostico);
      expect(diagnosticoRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ miembroId: 1 }),
      );
      expect(diagnosticoRepo.save).toHaveBeenCalled();
    });

    it('debe lanzar NotFoundException si el miembro no existe', async () => {
      miembrosRepo.findOneBy.mockResolvedValue(null);

      await expect(service.create(99, createDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.create(99, createDto)).rejects.toThrow(
        'Miembro no encontrado',
      );
      expect(diagnosticoRepo.save).not.toHaveBeenCalled();
    });

    it('debe lanzar ConflictException si ya existe un diagnóstico para el miembro', async () => {
      miembrosRepo.findOneBy.mockResolvedValue(mockMiembro);
      diagnosticoRepo.findOneBy.mockResolvedValue(mockDiagnostico);

      await expect(service.create(1, createDto)).rejects.toThrow(
        ConflictException,
      );
      expect(diagnosticoRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('findByMiembro', () => {
    it('debe retornar el diagnóstico con relaciones', async () => {
      diagnosticoRepo.findOne.mockResolvedValue(mockDiagnostico);

      const result = await service.findByMiembro(1);

      expect(result).toEqual(mockDiagnostico);
      expect(diagnosticoRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { miembroId: 1 },
          relations: ['tipoAtaxia'],
        }),
      );
    });

    it('debe lanzar NotFoundException si no existe diagnóstico para el miembro', async () => {
      diagnosticoRepo.findOne.mockResolvedValue(null);

      await expect(service.findByMiembro(99)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findByMiembro(99)).rejects.toThrow(
        'Diagnóstico no encontrado para este miembro',
      );
    });
  });

  describe('update', () => {
    it('debe actualizar el diagnóstico existente', async () => {
      diagnosticoRepo.findOneBy.mockResolvedValue({ ...mockDiagnostico });
      diagnosticoRepo.save.mockResolvedValue({
        ...mockDiagnostico,
        subtipo: 'SCA3',
      });

      const result = await service.update(1, { subtipo: 'SCA3' });

      expect(result.subtipo).toBe('SCA3');
      expect(diagnosticoRepo.save).toHaveBeenCalled();
    });

    it('debe lanzar NotFoundException si no existe diagnóstico para el miembro', async () => {
      diagnosticoRepo.findOneBy.mockResolvedValue(null);

      await expect(service.update(99, { subtipo: 'SCA3' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
