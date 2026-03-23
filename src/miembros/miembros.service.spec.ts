import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  Miembro,
  EstadoSocio,
  EstadoCivil,
  TipoRepresentacion,
} from './entities/miembro.entity';
import { MiembrosService } from './miembros.service';
import { CreateMiembroDto } from './dto/create-miembro.dto';
import { UpdateMiembroDto } from './dto/update-miembro.dto';
import { UpdateEstadoDto } from './dto/update-estado.dto';
import { AuditService } from '../audit/audit.service';

const mockMiembro: Miembro = {
  id: 1,
  rut: '12345678-9',
  nombre: 'María González',
  fechaNacimiento: '1985-03-15',
  estadoCivil: EstadoCivil.CASADO,
  profesion: 'Profesora',
  telefono: '+56912345678',
  celular: '+56987654321',
  email: 'maria@correo.cl',
  direccion: 'Av. Providencia 1234',
  regionId: 13,
  region: null,
  comunaId: 1,
  comuna: null,
  tipoAtaxiaId: 1,
  tipoAtaxia: null,
  esRepresentante: false,
  tipoRepresentacion: null,
  representadoId: null,
  representado: null,
  representadoNombre: null,
  representadoRut: null,
  estado: EstadoSocio.ACTIVO,
  fechaInscripcion: '2024-01-15',
  fechaCambioEstado: null,
  userId: null,
  user: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const createDto: CreateMiembroDto = {
  rut: '12345678-9',
  nombre: 'María González',
  fechaInscripcion: '2024-01-15',
};

describe('MiembrosService', () => {
  let service: MiembrosService;
  let repo: jest.Mocked<Repository<Miembro>>;
  let dataSource: { transaction: jest.Mock };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MiembrosService,
        {
          provide: getRepositoryToken(Miembro),
          useValue: {
            findOneBy: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            findAndCount: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            transaction: jest.fn(),
          },
        },
        {
          provide: AuditService,
          useValue: { registrar: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    service = module.get<MiembrosService>(MiembrosService);
    repo = module.get(getRepositoryToken(Miembro));
    dataSource = module.get(DataSource);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('debe crear un miembro con estado ACTIVO por defecto', async () => {
      repo.findOneBy.mockResolvedValue(null);
      repo.create.mockReturnValue(mockMiembro);
      repo.save.mockResolvedValue(mockMiembro);

      const result = await service.create(createDto);

      expect(result).toEqual(mockMiembro);
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          estado: EstadoSocio.ACTIVO,
          fechaCambioEstado: null,
        }),
      );
      expect(repo.save).toHaveBeenCalled();
    });

    it('debe lanzar ConflictException si ya existe un miembro con ese RUT', async () => {
      repo.findOneBy.mockResolvedValue(mockMiembro);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        'Ya existe un miembro con este RUT',
      );
      expect(repo.save).not.toHaveBeenCalled();
    });

    describe('representante', () => {
      const dtoRepresentante = {
        rut: '98765432-1',
        nombre: 'Pedro Aros',
        fechaInscripcion: '2024-01-15',
        esRepresentante: true,
        tipoRepresentacion: TipoRepresentacion.PADRE_MADRE,
      };

      it('debe crear representante con representadoId válido', async () => {
        const mockRepresentante = {
          ...mockMiembro,
          id: 2,
          esRepresentante: true,
          tipoAtaxiaId: null,
        };
        repo.findOneBy
          .mockResolvedValueOnce(null) // RUT no duplicado
          .mockResolvedValueOnce(mockMiembro); // representadoId existe
        repo.create.mockReturnValue(mockRepresentante);
        repo.save.mockResolvedValue(mockRepresentante);

        const result = await service.create({
          ...dtoRepresentante,
          representadoId: 1,
        });

        expect(result.esRepresentante).toBe(true);
        expect(repo.save).toHaveBeenCalled();
      });

      it('debe crear representante con nombre y RUT externo (sin representadoId)', async () => {
        const mockRepresentante = {
          ...mockMiembro,
          id: 2,
          esRepresentante: true,
          tipoAtaxiaId: null,
        };
        repo.findOneBy.mockResolvedValueOnce(null); // RUT no duplicado
        repo.create.mockReturnValue(mockRepresentante);
        repo.save.mockResolvedValue(mockRepresentante);

        const result = await service.create({
          ...dtoRepresentante,
          representadoNombre: 'Ana González',
          representadoRut: '11111111-1',
        });

        expect(result).toEqual(mockRepresentante);
        expect(repo.save).toHaveBeenCalled();
      });

      it('debe lanzar BadRequestException si representante tiene tipoAtaxiaId', async () => {
        repo.findOneBy.mockResolvedValueOnce(null);

        await expect(
          service.create({
            ...dtoRepresentante,
            tipoAtaxiaId: 1,
            representadoId: 1,
          }),
        ).rejects.toThrow(BadRequestException);
        await expect(
          service.create({
            ...dtoRepresentante,
            tipoAtaxiaId: 1,
            representadoId: 1,
          }),
        ).rejects.toThrow('Un representante no puede tener tipoAtaxiaId');
        expect(repo.save).not.toHaveBeenCalled();
      });

      it('debe lanzar BadRequestException si no se informa representado', async () => {
        repo.findOneBy.mockResolvedValueOnce(null);

        await expect(service.create(dtoRepresentante)).rejects.toThrow(
          BadRequestException,
        );
        await expect(service.create(dtoRepresentante)).rejects.toThrow(
          'Debe informar representadoId o representadoNombre y representadoRut',
        );
        expect(repo.save).not.toHaveBeenCalled();
      });

      it('debe lanzar NotFoundException si representadoId no existe', async () => {
        repo.findOneBy
          .mockResolvedValueOnce(null) // RUT no duplicado
          .mockResolvedValueOnce(null); // representadoId no encontrado

        await expect(
          service.create({ ...dtoRepresentante, representadoId: 99 }),
        ).rejects.toThrow(NotFoundException);
        await expect(
          service.create({ ...dtoRepresentante, representadoId: 99 }),
        ).rejects.toThrow('El miembro representado no existe');
        expect(repo.save).not.toHaveBeenCalled();
      });
    });
  });

  describe('findAll', () => {
    it('debe retornar lista de miembros con relaciones', async () => {
      repo.findAndCount.mockResolvedValue([[mockMiembro], 1]);

      const result = await service.findAll();

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(repo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          relations: ['region', 'comuna', 'tipoAtaxia'],
        }),
      );
    });

    it('debe filtrar por estado cuando se provee', async () => {
      repo.findAndCount.mockResolvedValue([[mockMiembro], 1]);

      await service.findAll(EstadoSocio.ACTIVO);

      expect(repo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ where: { estado: EstadoSocio.ACTIVO } }),
      );
    });

    it('debe retornar todos sin filtro cuando no se provee estado', async () => {
      repo.findAndCount.mockResolvedValue([[mockMiembro], 1]);

      await service.findAll();

      expect(repo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      );
    });

    it('debe retornar lista vacía si no hay miembros', async () => {
      repo.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.findAll();

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('debe aplicar skip y take según la paginación', async () => {
      repo.findAndCount.mockResolvedValue([[mockMiembro], 1]);

      await service.findAll(undefined, { page: 2, limit: 10 });

      expect(repo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 10 }),
      );
    });
  });

  describe('findOne', () => {
    it('debe retornar el miembro con todas las relaciones', async () => {
      repo.findOne.mockResolvedValue(mockMiembro);

      const result = await service.findOne(1);

      expect(result).toEqual(mockMiembro);
      expect(repo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          relations: ['region', 'comuna', 'tipoAtaxia', 'user'],
        }),
      );
    });

    it('debe lanzar NotFoundException si el miembro no existe', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(99)).rejects.toThrow(
        'Miembro no encontrado',
      );
    });
  });

  describe('update', () => {
    it('debe actualizar los datos del miembro', async () => {
      const dto: UpdateMiembroDto = { nombre: 'María González Actualizada' };
      repo.findOneBy.mockResolvedValue({ ...mockMiembro });
      repo.save.mockResolvedValue({ ...mockMiembro, nombre: dto.nombre! });

      const result = await service.update(1, dto);

      expect(result.nombre).toBe('María González Actualizada');
      expect(repo.save).toHaveBeenCalled();
    });

    it('debe lanzar NotFoundException si el miembro no existe', async () => {
      repo.findOneBy.mockResolvedValue(null);

      await expect(service.update(99, { nombre: 'X' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateEstado', () => {
    it('debe actualizar el estado y registrar la fecha de cambio', async () => {
      const dto: UpdateEstadoDto = { estado: EstadoSocio.SUSPENDIDO };
      repo.findOneBy.mockResolvedValue({ ...mockMiembro });
      repo.save.mockImplementation(async (m) => m as Miembro);

      const result = await service.updateEstado(1, dto);

      expect(result.estado).toBe(EstadoSocio.SUSPENDIDO);
      expect(result.fechaCambioEstado).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          estado: EstadoSocio.SUSPENDIDO,
          fechaCambioEstado: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        }),
      );
    });

    it('debe lanzar NotFoundException si el miembro no existe', async () => {
      repo.findOneBy.mockResolvedValue(null);

      await expect(
        service.updateEstado(99, { estado: EstadoSocio.FALLECIDO }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('vincularUsuario', () => {
    let mockManager: { findOneBy: jest.Mock; save: jest.Mock };

    beforeEach(() => {
      mockManager = {
        findOneBy: jest.fn(),
        save: jest.fn(),
      };
      dataSource.transaction.mockImplementation(async (cb) => cb(mockManager));
    });

    it('debe vincular el userId al miembro', async () => {
      mockManager.findOneBy
        .mockResolvedValueOnce({ ...mockMiembro, userId: null }) // miembro encontrado
        .mockResolvedValueOnce(null); // userId no vinculado a otro
      mockManager.save.mockImplementation(async (m) => m as Miembro);

      const result = await service.vincularUsuario(1, 10);

      expect(result.userId).toBe(10);
      expect(mockManager.save).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 10 }),
      );
    });

    it('debe lanzar NotFoundException si el miembro no existe', async () => {
      mockManager.findOneBy.mockResolvedValue(null);

      await expect(service.vincularUsuario(99, 10)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('debe lanzar ConflictException si el userId ya está vinculado a otro miembro', async () => {
      const otroMiembro: Miembro = { ...mockMiembro, id: 2, userId: 10 };
      mockManager.findOneBy
        .mockResolvedValueOnce({ ...mockMiembro, id: 1 }) // miembro id=1 encontrado
        .mockResolvedValueOnce(otroMiembro); // userId ya vinculado a id=2

      await expect(service.vincularUsuario(1, 10)).rejects.toThrow(
        ConflictException,
      );
    });

    it('debe usar el mensaje correcto para vinculación duplicada', async () => {
      const otroMiembro: Miembro = { ...mockMiembro, id: 2, userId: 10 };
      mockManager.findOneBy
        .mockResolvedValueOnce({ ...mockMiembro, id: 1 })
        .mockResolvedValueOnce(otroMiembro);

      await expect(service.vincularUsuario(1, 10)).rejects.toThrow(
        'Este usuario ya está vinculado a otro miembro',
      );
    });

    it('debe permitir re-vincular el mismo usuario al mismo miembro', async () => {
      // userId=10 ya está vinculado al miembro id=1 — se permite (idempotente)
      mockManager.findOneBy
        .mockResolvedValueOnce({ ...mockMiembro, id: 1, userId: 10 })
        .mockResolvedValueOnce({ ...mockMiembro, id: 1, userId: 10 }); // mismo id
      mockManager.save.mockImplementation(async (m) => m as Miembro);

      const result = await service.vincularUsuario(1, 10);

      expect(result.userId).toBe(10);
    });
  });
});
