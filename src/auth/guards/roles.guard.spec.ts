import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Rol } from '../../users/entities/user.entity';
import { RolesGuard } from './roles.guard';

const buildContext = (rol: Rol) =>
  ({
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue({ user: { rol } }),
    }),
  }) as unknown as ExecutionContext;

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('debe permitir acceso si la ruta no tiene roles requeridos', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      expect(guard.canActivate(buildContext(Rol.SECRETARIO))).toBe(true);
    });

    it('debe permitir acceso si el usuario tiene el rol requerido', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Rol.ADMIN]);

      expect(guard.canActivate(buildContext(Rol.ADMIN))).toBe(true);
    });

    it('debe denegar acceso si el usuario no tiene el rol requerido', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([Rol.SUPERADMIN]);

      expect(guard.canActivate(buildContext(Rol.SECRETARIO))).toBe(false);
    });

    it('debe permitir acceso a SUPERADMIN sin importar los roles requeridos', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Rol.ADMIN]);

      expect(guard.canActivate(buildContext(Rol.SUPERADMIN))).toBe(true);
    });

    it('debe permitir acceso si el usuario tiene uno de los roles permitidos', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([Rol.SUPERADMIN, Rol.ADMIN]);

      expect(guard.canActivate(buildContext(Rol.ADMIN))).toBe(true);
    });
  });
});
