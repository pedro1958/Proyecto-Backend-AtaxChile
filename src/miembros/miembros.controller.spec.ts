import { Test, TestingModule } from '@nestjs/testing';
import { MiembrosController } from './miembros.controller';
import { MiembrosService } from './miembros.service';
import { CreateMiembroDto } from './dto/create-miembro.dto';
import { UpdateMiembroDto } from './dto/update-miembro.dto';
import { UpdateEstadoDto } from './dto/update-estado.dto';
import { VincularUsuarioDto } from './dto/vincular-usuario.dto';
import {
  Miembro,
  EstadoSocio,
  EstadoCivil,
  TipoRepresentacion,
} from './entities/miembro.entity';

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

const mockPaginatedResult = {
  data: [mockMiembro],
  total: 1,
  page: 1,
  limit: 20,
};

describe('MiembrosController', () => {
  let controller: MiembrosController;
  let service: jest.Mocked<MiembrosService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MiembrosController],
      providers: [
        {
          provide: MiembrosService,
          useValue: {
            create: jest.fn().mockResolvedValue(mockMiembro),
            findAll: jest.fn().mockResolvedValue(mockPaginatedResult),
            findOne: jest.fn().mockResolvedValue(mockMiembro),
            update: jest.fn().mockResolvedValue(mockMiembro),
            updateEstado: jest.fn().mockResolvedValue({
              ...mockMiembro,
              estado: EstadoSocio.SUSPENDIDO,
              fechaCambioEstado: '2024-06-01',
            }),
            vincularUsuario: jest.fn().mockResolvedValue({
              ...mockMiembro,
              userId: 5,
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<MiembrosController>(MiembrosController);
    service = module.get(MiembrosService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('debe llamar a service.create con el DTO recibido', async () => {
      const dto: CreateMiembroDto = {
        rut: '12345678-9',
        nombre: 'María González',
        fechaInscripcion: '2024-01-15',
      };

      await controller.create(dto, { id: 99 }, '127.0.0.1');

      expect(service.create).toHaveBeenCalledWith(dto, 99, '127.0.0.1');
    });

    it('debe retornar el miembro creado', async () => {
      const dto: CreateMiembroDto = {
        rut: '12345678-9',
        nombre: 'María González',
        fechaInscripcion: '2024-01-15',
      };

      const result = await controller.create(dto, { id: 99 }, '127.0.0.1');

      expect(result).toEqual(mockMiembro);
    });
  });

  describe('findAll', () => {
    it('debe llamar a service.findAll sin filtro cuando no hay query', async () => {
      await controller.findAll();

      expect(service.findAll).toHaveBeenCalledWith(undefined, undefined);
    });

    it('debe llamar a service.findAll con el estado filtrado', async () => {
      await controller.findAll(EstadoSocio.ACTIVO);

      expect(service.findAll).toHaveBeenCalledWith(
        EstadoSocio.ACTIVO,
        undefined,
      );
    });

    it('debe retornar resultado paginado con data de miembros', async () => {
      const result = await controller.findAll();

      expect(result.data).toEqual([mockMiembro]);
      expect(result.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('debe llamar a service.findOne con el id parseado', async () => {
      await controller.findOne(1);

      expect(service.findOne).toHaveBeenCalledWith(1);
    });

    it('debe retornar el miembro encontrado', async () => {
      const result = await controller.findOne(1);

      expect(result).toEqual(mockMiembro);
    });
  });

  describe('update', () => {
    it('debe llamar a service.update con id y DTO', async () => {
      const dto: UpdateMiembroDto = { nombre: 'Nuevo Nombre' };

      await controller.update(1, dto, { id: 99 }, '127.0.0.1');

      expect(service.update).toHaveBeenCalledWith(1, dto, 99, '127.0.0.1');
    });

    it('debe retornar el miembro actualizado', async () => {
      const result = await controller.update(1, { nombre: 'X' }, { id: 99 }, '127.0.0.1');

      expect(result).toEqual(mockMiembro);
    });
  });

  describe('updateEstado', () => {
    it('debe llamar a service.updateEstado con id y DTO', async () => {
      const dto: UpdateEstadoDto = { estado: EstadoSocio.SUSPENDIDO };

      await controller.updateEstado(1, dto, { id: 99 }, '127.0.0.1');

      expect(service.updateEstado).toHaveBeenCalledWith(1, dto, 99, '127.0.0.1');
    });

    it('debe retornar el miembro con el nuevo estado', async () => {
      const dto: UpdateEstadoDto = { estado: EstadoSocio.SUSPENDIDO };

      const result = await controller.updateEstado(1, dto, { id: 99 }, '127.0.0.1');

      expect(result.estado).toBe(EstadoSocio.SUSPENDIDO);
    });
  });

  describe('vincularUsuario', () => {
    it('debe llamar a service.vincularUsuario con id y userId del DTO', async () => {
      const dto: VincularUsuarioDto = { userId: 5 };

      await controller.vincularUsuario(1, dto);

      expect(service.vincularUsuario).toHaveBeenCalledWith(1, 5);
    });

    it('debe retornar el miembro con el userId vinculado', async () => {
      const dto: VincularUsuarioDto = { userId: 5 };

      const result = await controller.vincularUsuario(1, dto);

      expect(result.userId).toBe(5);
    });
  });
});
