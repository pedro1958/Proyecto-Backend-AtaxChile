import { UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import * as bcrypt from 'bcrypt'
import { User, Rol } from '../users/entities/user.entity'
import { AuthService } from './auth.service'
import { LoginDto } from './dto/login.dto'

const mockUser: User = {
  id: 1,
  nombre: 'Admin Test',
  email: 'admin@test.cl',
  password: 'hashed_password',
  rol: Rol.ADMIN,
  activo: true,
  cuentaActivada: true,
  tokenActivacion: null,
  tokenExpiracion: null,
  resetPasswordToken: null,
  resetPasswordExpires: null,
  refreshToken: null,
  refreshTokenExpires: null,
  emailPendiente: null,
  tokenEmailCambio: null,
  tokenEmailCambioExpires: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const loginDto: LoginDto = {
  email: 'admin@test.cl',
  password: 'password123',
}

describe('AuthService', () => {
  let service: AuthService
  let repo: { findOneBy: jest.Mock; save: jest.Mock }
  let jwtService: jest.Mocked<JwtService>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: { findOneBy: jest.fn(), save: jest.fn() },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('fake-jwt-token'),
            verify: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockReturnValue('test-secret'),
          },
        },
      ],
    }).compile()

    service = module.get<AuthService>(AuthService)
    repo = module.get(getRepositoryToken(User))
    jwtService = module.get(JwtService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('login', () => {
    it('debe retornar access_token y refresh_token con credenciales válidas', async () => {
      repo.findOneBy.mockResolvedValue({ ...mockUser })
      repo.save.mockResolvedValue({ ...mockUser })
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never)
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('refresh-hash' as never)
      jwtService.sign
        .mockReturnValueOnce('fake-access-token')
        .mockReturnValueOnce('fake-refresh-token')

      const result = await service.login(loginDto)

      expect(result).toHaveProperty('access_token', 'fake-access-token')
      expect(result).toHaveProperty('refresh_token', 'fake-refresh-token')
      expect(jwtService.sign).toHaveBeenCalledTimes(2)
      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ refreshToken: 'refresh-hash' }),
      )
    })

    it('debe lanzar UnauthorizedException si el usuario no existe', async () => {
      repo.findOneBy.mockResolvedValue(null)

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException)
    })

    it('debe lanzar UnauthorizedException si la cuenta no está activa', async () => {
      repo.findOneBy.mockResolvedValue({ ...mockUser, activo: false })

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException)
    })

    it('debe lanzar UnauthorizedException si la cuenta no está activada', async () => {
      repo.findOneBy.mockResolvedValue({ ...mockUser, cuentaActivada: false })

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException)
    })

    it('debe lanzar UnauthorizedException si el password es incorrecto', async () => {
      repo.findOneBy.mockResolvedValue({ ...mockUser })
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never)

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException)
    })

    it('debe usar el mismo mensaje de error sin revelar la causa', async () => {
      repo.findOneBy.mockResolvedValue(null)
      await expect(service.login(loginDto)).rejects.toThrow('Credenciales inválidas')

      repo.findOneBy.mockResolvedValue({ ...mockUser })
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never)
      await expect(service.login(loginDto)).rejects.toThrow('Credenciales inválidas')
    })
  })

  describe('refresh', () => {
    const usuarioConToken = { ...mockUser, refreshToken: 'hashed-refresh-token' }

    it('debe emitir un nuevo access_token con refresh_token válido', async () => {
      jwtService.verify.mockReturnValue({ sub: 1 })
      repo.findOneBy.mockResolvedValue({ ...usuarioConToken })
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never)
      jwtService.sign.mockReturnValueOnce('nuevo-access-token')

      const result = await service.refresh('valid-refresh-token')

      expect(result).toEqual({ access_token: 'nuevo-access-token' })
    })

    it('debe lanzar UnauthorizedException si el JWT no es válido', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('jwt malformed')
      })

      await expect(service.refresh('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      )
    })

    it('debe lanzar UnauthorizedException si el usuario no existe', async () => {
      jwtService.verify.mockReturnValue({ sub: 99 })
      repo.findOneBy.mockResolvedValue(null)

      await expect(service.refresh('valid-token')).rejects.toThrow(
        UnauthorizedException,
      )
    })

    it('debe lanzar UnauthorizedException si el usuario no tiene refresh token guardado', async () => {
      jwtService.verify.mockReturnValue({ sub: 1 })
      repo.findOneBy.mockResolvedValue({ ...mockUser, refreshToken: null })

      await expect(service.refresh('valid-token')).rejects.toThrow(
        UnauthorizedException,
      )
    })

    it('debe lanzar UnauthorizedException si el hash no coincide', async () => {
      jwtService.verify.mockReturnValue({ sub: 1 })
      repo.findOneBy.mockResolvedValue({ ...usuarioConToken })
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never)

      await expect(service.refresh('token-incorrecto')).rejects.toThrow(
        UnauthorizedException,
      )
    })

    it('debe usar el mismo mensaje de error para no revelar el motivo', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error()
      })

      await expect(service.refresh('invalid')).rejects.toThrow(
        'Refresh token inválido o expirado',
      )
    })
  })

  describe('logout', () => {
    it('debe limpiar el refresh token del usuario', async () => {
      repo.findOneBy.mockResolvedValue({ ...mockUser, refreshToken: 'hashed' })
      repo.save.mockResolvedValue({
        ...mockUser,
        refreshToken: null,
        refreshTokenExpires: null,
      })

      await service.logout(1)

      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          refreshToken: null,
          refreshTokenExpires: null,
        }),
      )
    })

    it('debe retornar sin error si el usuario no existe', async () => {
      repo.findOneBy.mockResolvedValue(null)

      await expect(service.logout(99)).resolves.toBeUndefined()
      expect(repo.save).not.toHaveBeenCalled()
    })
  })
})
