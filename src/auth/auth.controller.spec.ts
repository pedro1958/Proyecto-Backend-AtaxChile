import { Test, TestingModule } from '@nestjs/testing'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { UsersService } from '../users/users.service'
import { LoginDto } from './dto/login.dto'
import { ForgotPasswordDto } from '../users/dto/forgot-password.dto'
import { ResetPasswordDto } from '../users/dto/reset-password.dto'
import { ChangePasswordDto } from './dto/change-password.dto'
import { RefreshDto } from './dto/refresh.dto'

describe('AuthController', () => {
  let controller: AuthController
  let authService: jest.Mocked<AuthService>
  let usersService: jest.Mocked<UsersService>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn().mockResolvedValue({
              access_token: 'fake-access-token',
              refresh_token: 'fake-refresh-token',
            }),
            refresh: jest
              .fn()
              .mockResolvedValue({ access_token: 'nuevo-access-token' }),
            logout: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: UsersService,
          useValue: {
            solicitarRecuperacion: jest.fn().mockResolvedValue(undefined),
            restablecerPassword: jest.fn().mockResolvedValue(undefined),
            cambiarPassword: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile()

    controller = module.get<AuthController>(AuthController)
    authService = module.get(AuthService)
    usersService = module.get(UsersService)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('login', () => {
    it('debe llamar a authService.login con el DTO recibido', async () => {
      const dto: LoginDto = { email: 'admin@test.cl', password: 'password123' }

      await controller.login(dto)

      expect(authService.login).toHaveBeenCalledWith(dto)
    })

    it('debe retornar access_token y refresh_token generados por el service', async () => {
      const dto: LoginDto = { email: 'admin@test.cl', password: 'password123' }

      const result = await controller.login(dto)

      expect(result).toEqual({
        access_token: 'fake-access-token',
        refresh_token: 'fake-refresh-token',
      })
    })
  })

  describe('refresh', () => {
    const dto: RefreshDto = { refresh_token: 'valid-refresh-token' }

    it('debe llamar a authService.refresh con el token del DTO', async () => {
      await controller.refresh(dto)

      expect(authService.refresh).toHaveBeenCalledWith(dto.refresh_token)
    })

    it('debe retornar el nuevo access_token', async () => {
      const result = await controller.refresh(dto)

      expect(result).toEqual({ access_token: 'nuevo-access-token' })
    })
  })

  describe('logout', () => {
    it('debe llamar a authService.logout con el id del usuario', async () => {
      await controller.logout({ id: 1 })

      expect(authService.logout).toHaveBeenCalledWith(1)
    })
  })

  describe('changePassword', () => {
    const mockUser = { id: 1 }
    const dto: ChangePasswordDto = {
      passwordActual: 'password123',
      nuevaPassword: 'nuevaPassword123',
    }

    it('debe llamar a usersService.cambiarPassword con el id del usuario y el DTO', async () => {
      await controller.changePassword(mockUser, dto)

      expect(usersService.cambiarPassword).toHaveBeenCalledWith(
        mockUser.id,
        dto.passwordActual,
        dto.nuevaPassword,
      )
    })

    it('debe retornar mensaje de confirmación', async () => {
      const result = await controller.changePassword(mockUser, dto)

      expect(result).toEqual({ message: 'Contraseña cambiada correctamente' })
    })
  })

  describe('forgotPassword', () => {
    it('debe llamar a usersService.solicitarRecuperacion con el email', async () => {
      const dto: ForgotPasswordDto = { email: 'admin@test.cl' }

      await controller.forgotPassword(dto)

      expect(usersService.solicitarRecuperacion).toHaveBeenCalledWith(dto.email)
    })

    it('debe retornar mensaje genérico sin importar si el email existe', async () => {
      const dto: ForgotPasswordDto = { email: 'noexiste@test.cl' }

      const result = await controller.forgotPassword(dto)

      expect(result).toHaveProperty('message')
      expect(result.message).toContain('Si el correo existe')
    })
  })

  describe('resetPassword', () => {
    it('debe llamar a usersService.restablecerPassword con token y nueva password', async () => {
      const dto: ResetPasswordDto = {
        token: 'token-uuid-123',
        nuevaPassword: 'nuevaPassword123',
      }

      await controller.resetPassword(dto)

      expect(usersService.restablecerPassword).toHaveBeenCalledWith(
        dto.token,
        dto.nuevaPassword,
      )
    })

    it('debe retornar mensaje de confirmación al restablecer correctamente', async () => {
      const dto: ResetPasswordDto = {
        token: 'token-uuid-123',
        nuevaPassword: 'nuevaPassword123',
      }

      const result = await controller.resetPassword(dto)

      expect(result).toEqual({ message: 'Contraseña restablecida correctamente' })
    })
  })
})
