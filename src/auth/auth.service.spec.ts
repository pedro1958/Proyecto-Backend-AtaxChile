import { UnauthorizedException } from '@nestjs/common'
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
  createdAt: new Date(),
  updatedAt: new Date(),
}

const loginDto: LoginDto = {
  email: 'admin@test.cl',
  password: 'password123',
}

describe('AuthService', () => {
  let service: AuthService
  let repo: { findOneBy: jest.Mock }
  let jwtService: jest.Mocked<JwtService>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: { findOneBy: jest.fn() },
        },
        {
          provide: JwtService,
          useValue: { sign: jest.fn().mockReturnValue('fake-jwt-token') },
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
    it('debe retornar access_token con credenciales válidas', async () => {
      repo.findOneBy.mockResolvedValue(mockUser)
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never)

      const result = await service.login(loginDto)

      expect(result).toEqual({ access_token: 'fake-jwt-token' })
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        rol: mockUser.rol,
      })
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
      repo.findOneBy.mockResolvedValue(mockUser)
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never)

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException)
    })

    it('debe usar el mismo mensaje de error sin revelar la causa', async () => {
      repo.findOneBy.mockResolvedValue(null)
      await expect(service.login(loginDto)).rejects.toThrow('Credenciales inválidas')

      repo.findOneBy.mockResolvedValue(mockUser)
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never)
      await expect(service.login(loginDto)).rejects.toThrow('Credenciales inválidas')
    })
  })
})
