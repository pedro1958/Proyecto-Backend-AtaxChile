import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { SelfGuard } from './self.guard';

const buildContext = (userId: number, paramId: string) =>
  ({
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue({
        user: { id: userId },
        params: { id: paramId },
      }),
    }),
  }) as unknown as ExecutionContext;

describe('SelfGuard', () => {
  let guard: SelfGuard;

  beforeEach(() => {
    guard = new SelfGuard();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('debe permitir acceso si el id del token coincide con el id de la URL', () => {
      const result = guard.canActivate(buildContext(1, '1'));
      expect(result).toBe(true);
    });

    it('debe lanzar ForbiddenException si el id del token no coincide con el id de la URL', () => {
      expect(() => guard.canActivate(buildContext(1, '99'))).toThrow(
        ForbiddenException,
      );
    });

    it('debe lanzar ForbiddenException con el mensaje correcto', () => {
      expect(() => guard.canActivate(buildContext(2, '5'))).toThrow(
        'No puedes modificar datos de otro usuario',
      );
    });

    it('debe lanzar ForbiddenException si no hay usuario en el request', () => {
      const context = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            user: undefined,
            params: { id: '1' },
          }),
        }),
      } as unknown as ExecutionContext;

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });
  });
});
