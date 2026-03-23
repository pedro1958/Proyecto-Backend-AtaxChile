import { Test, TestingModule } from '@nestjs/testing';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { AuditLog, AccionAudit } from './entities/audit-log.entity';
import { PaginatedResult } from '../common/types/response.types';

const mockLogs: AuditLog[] = [
  {
    id: 1,
    accion: AccionAudit.LOGIN,
    entidad: null,
    entidadId: null,
    usuarioId: 1,
    ip: '127.0.0.1',
    detalle: null,
    createdAt: new Date(),
  },
  {
    id: 2,
    accion: AccionAudit.LOGOUT,
    entidad: null,
    entidadId: null,
    usuarioId: 1,
    ip: '127.0.0.1',
    detalle: null,
    createdAt: new Date(),
  },
];

describe('AuditController', () => {
  let controller: AuditController;
  let service: jest.Mocked<AuditService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditController],
      providers: [
        {
          provide: AuditService,
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuditController>(AuditController);
    service = module.get(AuditService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('debe llamar a service.findAll con los query params', async () => {
      const query = { page: 1, limit: 20, accion: AccionAudit.LOGIN };
      const paginatedResult: PaginatedResult<AuditLog> = {
        data: mockLogs,
        total: 2,
        page: 1,
        limit: 20,
      };
      service.findAll.mockResolvedValue(paginatedResult);

      const result = await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(paginatedResult);
    });

    it('debe retornar resultados vacíos si no hay registros', async () => {
      const emptyResult: PaginatedResult<AuditLog> = {
        data: [],
        total: 0,
        page: 1,
        limit: 20,
      };
      service.findAll.mockResolvedValue(emptyResult);

      const result = await controller.findAll({});

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('findOne', () => {
    it('debe llamar a service.findOne con el id', async () => {
      const log = mockLogs[0];
      service.findOne.mockResolvedValue(log);

      const result = await controller.findOne(1);

      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(log);
    });
  });
});
