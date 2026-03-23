import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditLog, AccionAudit } from './entities/audit-log.entity';

const mockAuditRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOneBy: jest.fn(),
  createQueryBuilder: jest.fn(),
});

describe('AuditService', () => {
  let service: AuditService;
  let repo: jest.Mocked<Repository<AuditLog>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: getRepositoryToken(AuditLog),
          useValue: mockAuditRepo(),
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    repo = module.get(getRepositoryToken(AuditLog));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('registrar', () => {
    it('debe crear y guardar un registro de auditoría', async () => {
      const dto = {
        accion: AccionAudit.LOGIN,
        entidad: 'user',
        entidadId: 1,
        usuarioId: 1,
        ip: '127.0.0.1',
        detalle: { email: 'test@test.com' },
      };

      const mockLog = { id: 1, ...dto, createdAt: new Date() };
      repo.create.mockReturnValue(mockLog as AuditLog);
      repo.save.mockResolvedValue(mockLog as AuditLog);

      await service.registrar(dto);

      expect(repo.create).toHaveBeenCalledWith({
        accion: AccionAudit.LOGIN,
        entidad: 'user',
        entidadId: 1,
        usuarioId: 1,
        ip: '127.0.0.1',
        detalle: { email: 'test@test.com' },
      });
      expect(repo.save).toHaveBeenCalledWith(mockLog);
    });

    it('debe usar null como valores por defecto cuando no se proporcionan', async () => {
      const dto = { accion: AccionAudit.LOGIN_FALLIDO };

      const mockLog = {
        id: 1,
        accion: AccionAudit.LOGIN_FALLIDO,
        createdAt: new Date(),
      };
      repo.create.mockReturnValue(mockLog as AuditLog);
      repo.save.mockResolvedValue(mockLog as AuditLog);

      await service.registrar(dto);

      expect(repo.create).toHaveBeenCalledWith({
        accion: AccionAudit.LOGIN_FALLIDO,
        entidad: null,
        entidadId: null,
        usuarioId: null,
        ip: null,
        detalle: null,
      });
    });
  });

  describe('findAll', () => {
    const mockQb = {
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
    };

    beforeEach(() => {
      repo.createQueryBuilder.mockReturnValue(mockQb as any);
    });

    it('debe retornar resultados paginados', async () => {
      const logs = [
        { id: 1, accion: AccionAudit.LOGIN, createdAt: new Date() },
        { id: 2, accion: AccionAudit.LOGOUT, createdAt: new Date() },
      ];
      mockQb.getManyAndCount.mockResolvedValue([logs, 2]);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result).toEqual({ data: logs, total: 2, page: 1, limit: 20 });
    });

    it('debe usar valores por defecto para page y limit', async () => {
      mockQb.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({});

      expect(mockQb.skip).toHaveBeenCalledWith(0);
      expect(mockQb.take).toHaveBeenCalledWith(20);
    });

    it('debe aplicar filtro por accion', async () => {
      mockQb.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ accion: AccionAudit.LOGIN });

      expect(mockQb.andWhere).toHaveBeenCalledWith('log.accion = :accion', {
        accion: AccionAudit.LOGIN,
      });
    });

    it('debe aplicar filtro por entidad', async () => {
      mockQb.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ entidad: 'miembro' });

      expect(mockQb.andWhere).toHaveBeenCalledWith('log.entidad = :entidad', {
        entidad: 'miembro',
      });
    });

    it('debe aplicar filtro por usuarioId', async () => {
      mockQb.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ usuarioId: 5 });

      expect(mockQb.andWhere).toHaveBeenCalledWith(
        'log.usuarioId = :usuarioId',
        {
          usuarioId: 5,
        },
      );
    });

    it('debe aplicar filtro por rango de fechas', async () => {
      mockQb.getManyAndCount.mockResolvedValue([[], 0]);
      const desde = '2024-01-01';
      const hasta = '2024-12-31';

      await service.findAll({ desde, hasta });

      expect(mockQb.andWhere).toHaveBeenCalledWith('log.createdAt >= :desde', {
        desde: expect.any(Date),
      });
      expect(mockQb.andWhere).toHaveBeenCalledWith('log.createdAt <= :hasta', {
        hasta: expect.any(Date),
      });
    });

    it('debe ordenar por createdAt DESC', async () => {
      mockQb.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({});

      expect(mockQb.orderBy).toHaveBeenCalledWith('log.createdAt', 'DESC');
    });
  });

  describe('findOne', () => {
    it('debe retornar un registro de auditoría por id', async () => {
      const log = {
        id: 1,
        accion: AccionAudit.CREAR_MIEMBRO,
        createdAt: new Date(),
      };
      repo.findOneBy.mockResolvedValue(log as AuditLog);

      const result = await service.findOne(1);

      expect(result).toEqual(log);
      expect(repo.findOneBy).toHaveBeenCalledWith({ id: 1 });
    });

    it('debe lanzar NotFoundException si no existe', async () => {
      repo.findOneBy.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });
});
