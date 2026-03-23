import { Test, TestingModule } from '@nestjs/testing';
import { CreateUserDto } from './dto/create-user.dto';
import { Rol } from './entities/user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { SelfGuard } from '../auth/guards/self.guard';

const mockUser = {
  id: 1,
  nombre: 'Admin Test',
  email: 'admin@test.cl',
  rol: Rol.ADMIN,
  activo: true,
  cuentaActivada: false,
  tokenActivacion: null,
  tokenExpiracion: null,
  resetPasswordToken: null,
  resetPasswordExpires: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('UsersController', () => {
  let controller: UsersController;
  let service: jest.Mocked<UsersService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            findAll: jest.fn().mockResolvedValue({
              data: [mockUser],
              total: 1,
              page: 1,
              limit: 20,
            }),
            findPerfil: jest.fn().mockResolvedValue({
              nombre: mockUser.nombre,
              email: mockUser.email,
              rol: mockUser.rol,
            }),
            create: jest.fn().mockResolvedValue(mockUser),
            update: jest.fn().mockResolvedValue(mockUser),
            updateRol: jest
              .fn()
              .mockResolvedValue({ ...mockUser, rol: Rol.SECRETARIO }),
            toggleStatus: jest
              .fn()
              .mockResolvedValue({ ...mockUser, activo: false }),
            remove: jest.fn().mockResolvedValue(undefined),
            activarCuenta: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    })
      .overrideGuard(SelfGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('debe llamar a service.findAll y retornar resultado paginado', async () => {
      const result = await controller.findAll();
      expect(service.findAll).toHaveBeenCalled();
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('debe llamar a service.findPerfil con el id correcto', async () => {
      const result = await controller.findOne(1);
      expect(service.findPerfil).toHaveBeenCalledWith(1);
      expect(result).toEqual({
        nombre: mockUser.nombre,
        email: mockUser.email,
        rol: mockUser.rol,
      });
    });
  });

  describe('create', () => {
    it('debe llamar a service.create con el DTO y retornar mensaje de confirmación', async () => {
      const dto: CreateUserDto = {
        nombre: 'Admin',
        email: 'admin@test.cl',
        password: 'password123',
      };
      const result = await controller.create(dto);
      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toHaveProperty('message');
      expect(result.message).toContain('admin@test.cl');
    });
  });

  describe('update', () => {
    it('debe llamar a service.update con id y DTO', async () => {
      await controller.update(1, { nombre: 'Nuevo Nombre' });
      expect(service.update).toHaveBeenCalledWith(1, {
        nombre: 'Nuevo Nombre',
      });
    });
  });

  describe('updateRol', () => {
    it('debe llamar a service.updateRol con id y DTO', async () => {
      await controller.updateRol(1, { rol: Rol.SECRETARIO }, { id: 99 }, '127.0.0.1');
      expect(service.updateRol).toHaveBeenCalledWith(1, {
        rol: Rol.SECRETARIO,
      }, 99, '127.0.0.1');
    });

    it('debe retornar el usuario con el rol actualizado', async () => {
      const result = await controller.updateRol(1, { rol: Rol.SECRETARIO }, { id: 99 }, '127.0.0.1');
      expect(result.rol).toBe(Rol.SECRETARIO);
    });
  });

  describe('toggleStatus', () => {
    it('debe llamar a service.toggleStatus con el id correcto', async () => {
      await controller.toggleStatus(1);
      expect(service.toggleStatus).toHaveBeenCalledWith(1);
    });
  });

  describe('remove', () => {
    it('debe llamar a service.remove con el id correcto', async () => {
      await controller.remove(1);
      expect(service.remove).toHaveBeenCalledWith(1);
    });
  });

  describe('activarCuenta', () => {
    it('debe llamar a service.activarCuenta con el token', async () => {
      await controller.activarCuenta('token-uuid-123');
      expect(service.activarCuenta).toHaveBeenCalledWith('token-uuid-123');
    });
  });
});
