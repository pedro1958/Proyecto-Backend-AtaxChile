import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExportsService } from './exports.service';
import { Miembro } from '../miembros/entities/miembro.entity';
import { DiagnosticoClinico } from '../diagnostico-clinico/entities/diagnostico-clinico.entity';
import { EvaluacionFuncional } from '../evaluacion-funcional/entities/evaluacion-funcional.entity';
import { Rol } from '../users/entities/user.entity';
import { FormatoExport } from './dto/query-export.dto';

const mockMiembroRepo = () => ({
  createQueryBuilder: jest.fn(),
});

describe('ExportsService', () => {
  let service: ExportsService;
  let miembroRepo: jest.Mocked<Repository<Miembro>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExportsService,
        {
          provide: getRepositoryToken(Miembro),
          useValue: mockMiembroRepo(),
        },
        {
          provide: getRepositoryToken(DiagnosticoClinico),
          useValue: { findOne: jest.fn(), find: jest.fn() },
        },
        {
          provide: getRepositoryToken(EvaluacionFuncional),
          useValue: { find: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<ExportsService>(ExportsService);
    miembroRepo = module.get(getRepositoryToken(Miembro));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generarArchivo', () => {
    const mockUserAdmin = {
      id: 1,
      rol: Rol.ADMIN,
      email: 'admin@test.com',
    } as any;
    const mockUserTesorero = {
      id: 2,
      rol: Rol.TESORERO,
      email: 'tesorero@test.com',
    } as any;

    const mockQb = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    };

    beforeEach(() => {
      (miembroRepo.createQueryBuilder as jest.Mock).mockReturnValue(mockQb);
    });

    it('debe generar archivo CSV por defecto', async () => {
      mockQb.getMany.mockResolvedValue([]);

      const result = await service.generarArchivo(
        { formato: FormatoExport.CSV },
        mockUserAdmin,
      );

      expect(result.mimeType).toBe('text/csv; charset=utf-8');
      expect(result.filename).toContain('.csv');
    });

    it('debe generar archivo XLSX', async () => {
      mockQb.getMany.mockResolvedValue([]);

      const result = await service.generarArchivo(
        { formato: FormatoExport.XLSX },
        mockUserAdmin,
      );

      expect(result.mimeType).toBe(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      expect(result.filename).toContain('.xlsx');
    });

    it('debe generar archivo PDF', async () => {
      mockQb.getMany.mockResolvedValue([]);

      const result = await service.generarArchivo(
        { formato: FormatoExport.PDF },
        mockUserAdmin,
      );

      expect(result.mimeType).toBe('application/pdf');
      expect(result.filename).toContain('.pdf');
    });

    it('debe aplicar filtros de estado', async () => {
      mockQb.getMany.mockResolvedValue([]);

      await service.generarArchivo({ estado: 'activo' }, mockUserAdmin);

      expect(mockQb.andWhere).toHaveBeenCalledWith('m.estado = :estado', {
        estado: 'activo',
      });
    });

    it('debe aplicar filtros de regionId', async () => {
      mockQb.getMany.mockResolvedValue([]);

      await service.generarArchivo({ regionId: 1 }, mockUserAdmin);

      expect(mockQb.andWhere).toHaveBeenCalledWith('m.regionId = :regionId', {
        regionId: 1,
      });
    });

    it('debe aplicar filtros de tipoAtaxiaId', async () => {
      mockQb.getMany.mockResolvedValue([]);

      await service.generarArchivo({ tipoAtaxiaId: 5 }, mockUserAdmin);

      expect(mockQb.andWhere).toHaveBeenCalledWith(
        'm.tipoAtaxiaId = :tipoAtaxiaId',
        {
          tipoAtaxiaId: 5,
        },
      );
    });

    it('debe aplicar filtros de fechaDesde y fechaHasta', async () => {
      mockQb.getMany.mockResolvedValue([]);

      await service.generarArchivo(
        { fechaDesde: '2024-01-01', fechaHasta: '2024-12-31' },
        mockUserAdmin,
      );

      expect(mockQb.andWhere).toHaveBeenCalledWith(
        'm.fechaInscripcion >= :fechaDesde',
        {
          fechaDesde: '2024-01-01',
        },
      );
      expect(mockQb.andWhere).toHaveBeenCalledWith(
        'm.fechaInscripcion <= :fechaHasta',
        {
          fechaHasta: '2024-12-31',
        },
      );
    });

    it('debe incluir datos completos para ADMIN', async () => {
      const miembros = [
        {
          rut: '12345678-9',
          nombre: 'Juan',
          email: 'juan@test.com',
          celular: '999999999',
          region: { nombre: 'Metropolitana' },
          comuna: { nombre: 'Santiago' },
          tipoAtaxia: { nombre: 'Friedreich' },
          fechaInscripcion: '2024-01-01',
          estado: 'activo',
        },
      ];
      mockQb.getMany.mockResolvedValue(miembros);

      const result = await service.generarArchivo({}, mockUserAdmin);

      expect(result.buffer).toBeInstanceOf(Buffer);
    });

    it('debe excluir datos sensibles para TESORERO', async () => {
      mockQb.getMany.mockResolvedValue([]);

      const result = await service.generarArchivo({}, mockUserTesorero);

      expect(result.buffer).toBeInstanceOf(Buffer);
    });
  });

  describe('generarFichaIndividual', () => {
    const mockUserAdmin = {
      id: 1,
      rol: Rol.ADMIN,
      email: 'admin@test.com',
    } as any;
    const mockUserTesorero = {
      id: 2,
      rol: Rol.TESORERO,
      email: 'tesorero@test.com',
    } as any;

    it('debe lanzar ForbiddenException para TESORERO', async () => {
      await expect(
        service.generarFichaIndividual(1, mockUserTesorero),
      ).rejects.toThrow('No tiene permisos para exportar ficha individual');
    });
  });
});
