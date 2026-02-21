import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import * as bcrypt from 'bcrypt'
import { Repository } from 'typeorm'
import { CreateUserDto } from './dto/create-user.dto'
import { User, Rol } from './entities/user.entity'
import { UsersService } from './users.service'
import { MailerService } from '../mailer/mailer.service'

const mockUser: User = {
  id: 1,
  nombre: 'Admin Test',
  email: 'admin@test.cl',
  password: 'hashed_password',
  rol: Rol.ADMIN,
  activo: true,
  cuentaActivada: false,
  tokenActivacion: 'token-uuid-123',
  tokenExpiracion: new Date(Date.now() + 24 * 60 * 60 * 1000),
  resetPasswordToken: null,
  resetPasswordExpires: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const createDto: CreateUserDto = {
  nombre: 'Admin Test',
  email: 'admin@test.cl',
  password: 'password123',
  rol: Rol.ADMIN,
}

describe('UsersService', () => {
  let service: UsersService
  let repo: jest.Mocked<Repository<User>>
  let mailerService: jest.Mocked<MailerService>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOneBy: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: MailerService,
          useValue: {
            enviarActivacion: jest.fn().mockResolvedValue(undefined),
            enviarRecuperacion: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile()

    service = module.get<UsersService>(UsersService)
    repo = module.get(getRepositoryToken(User))
    mailerService = module.get(MailerService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('create', () => {
    it('debe crear usuario con cuentaActivada false y enviar correo', async () => {
      repo.findOneBy.mockResolvedValue(null)
      repo.create.mockReturnValue(mockUser)
      repo.save.mockResolvedValue(mockUser)
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed' as never)

      const result = await service.create(createDto)

      expect(result).not.toHaveProperty('password')
      expect(result).toHaveProperty('cuentaActivada', false)
      expect(repo.save).toHaveBeenCalled()
      expect(mailerService.enviarActivacion).toHaveBeenCalledWith(
        createDto.email,
        expect.any(String),
      )
    })

    it('debe lanzar ConflictException con mensaje de activación pendiente si la cuenta no está activada', async () => {
      repo.findOneBy.mockResolvedValue({ ...mockUser, cuentaActivada: false })

      await expect(service.create(createDto)).rejects.toThrow(ConflictException)
      await expect(service.create(createDto)).rejects.toThrow(
        'pendiente de activación',
      )
      expect(mailerService.enviarActivacion).not.toHaveBeenCalled()
    })

    it('debe lanzar ConflictException si el email ya está registrado y activado', async () => {
      repo.findOneBy.mockResolvedValue({ ...mockUser, cuentaActivada: true })

      await expect(service.create(createDto)).rejects.toThrow(ConflictException)
      await expect(service.create(createDto)).rejects.toThrow(
        'El email ya está registrado',
      )
      expect(mailerService.enviarActivacion).not.toHaveBeenCalled()
    })
  })

  describe('findAll', () => {
    it('debe retornar lista de usuarios sin password', async () => {
      repo.find.mockResolvedValue([mockUser])

      const result = await service.findAll()

      expect(result).toHaveLength(1)
      expect(result[0]).not.toHaveProperty('password')
    })

    it('debe retornar lista vacía si no hay usuarios', async () => {
      repo.find.mockResolvedValue([])

      const result = await service.findAll()

      expect(result).toHaveLength(0)
    })
  })

  describe('findOne', () => {
    it('debe retornar usuario sin password', async () => {
      repo.findOneBy.mockResolvedValue(mockUser)

      const result = await service.findOne(1)

      expect(result).not.toHaveProperty('password')
      expect(result.id).toBe(1)
    })

    it('debe lanzar NotFoundException si el usuario no existe', async () => {
      repo.findOneBy.mockResolvedValue(null)

      await expect(service.findOne(99)).rejects.toThrow(NotFoundException)
    })
  })

  describe('findPerfil', () => {
    it('debe retornar solo nombre, email y rol', async () => {
      repo.findOneBy.mockResolvedValue(mockUser)
      repo.find.mockResolvedValue([mockUser])

      const mockFindOne = jest.fn().mockResolvedValue(mockUser)
      ;(repo as any).findOne = mockFindOne

      const result = await service.findPerfil(1)

      expect(result).toEqual({
        nombre: mockUser.nombre,
        email: mockUser.email,
        rol: mockUser.rol,
      })
      expect(result).not.toHaveProperty('password')
      expect(result).not.toHaveProperty('activo')
      expect(result).not.toHaveProperty('cuentaActivada')
      expect(result).not.toHaveProperty('createdAt')
    })

    it('debe lanzar NotFoundException si el usuario no existe', async () => {
      const mockFindOne = jest.fn().mockResolvedValue(null)
      ;(repo as any).findOne = mockFindOne

      await expect(service.findPerfil(99)).rejects.toThrow(NotFoundException)
    })
  })

  describe('update', () => {
    it('debe actualizar usuario y retornarlo sin password', async () => {
      repo.findOneBy.mockResolvedValue({ ...mockUser })
      repo.save.mockResolvedValue({ ...mockUser, nombre: 'Nuevo Nombre' })

      const result = await service.update(1, { nombre: 'Nuevo Nombre' })

      expect(result).not.toHaveProperty('password')
      expect(result.nombre).toBe('Nuevo Nombre')
    })

    it('debe lanzar NotFoundException si el usuario no existe', async () => {
      repo.findOneBy.mockResolvedValue(null)

      await expect(service.update(99, { nombre: 'X' })).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('updateRol', () => {
    it('debe actualizar el rol y retornar usuario sin password', async () => {
      repo.findOneBy.mockResolvedValue({ ...mockUser })
      repo.save.mockResolvedValue({ ...mockUser, rol: Rol.SECRETARIO })

      const result = await service.updateRol(1, { rol: Rol.SECRETARIO })

      expect(result).not.toHaveProperty('password')
      expect(result.rol).toBe(Rol.SECRETARIO)
      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ rol: Rol.SECRETARIO }),
      )
    })

    it('debe lanzar NotFoundException si el usuario no existe', async () => {
      repo.findOneBy.mockResolvedValue(null)

      await expect(
        service.updateRol(99, { rol: Rol.SECRETARIO }),
      ).rejects.toThrow(NotFoundException)
    })
  })

  describe('toggleStatus', () => {
    it('debe invertir el campo activo', async () => {
      repo.findOneBy.mockResolvedValue({ ...mockUser, activo: true })
      repo.save.mockResolvedValue({ ...mockUser, activo: false })

      await service.toggleStatus(1)

      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ activo: false }),
      )
    })

    it('debe lanzar NotFoundException si el usuario no existe', async () => {
      repo.findOneBy.mockResolvedValue(null)

      await expect(service.toggleStatus(99)).rejects.toThrow(NotFoundException)
    })
  })

  describe('remove', () => {
    it('debe hacer soft delete seteando activo en false', async () => {
      repo.findOneBy.mockResolvedValue({ ...mockUser, activo: true })
      repo.save.mockResolvedValue({ ...mockUser, activo: false })

      await service.remove(1)

      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ activo: false }),
      )
    })

    it('debe lanzar NotFoundException si el usuario no existe', async () => {
      repo.findOneBy.mockResolvedValue(null)

      await expect(service.remove(99)).rejects.toThrow(NotFoundException)
    })
  })

  describe('solicitarRecuperacion', () => {
    it('debe guardar token y enviar correo si el usuario existe y está activo', async () => {
      const usuarioActivo = { ...mockUser, cuentaActivada: true }
      repo.findOneBy.mockResolvedValue(usuarioActivo)
      repo.save.mockResolvedValue(usuarioActivo)

      await service.solicitarRecuperacion('admin@test.cl')

      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          resetPasswordToken: expect.any(String),
          resetPasswordExpires: expect.any(Date),
        }),
      )
      expect(mailerService.enviarRecuperacion).toHaveBeenCalledWith(
        'admin@test.cl',
        expect.any(String),
      )
    })

    it('debe retornar sin hacer nada si el usuario no existe', async () => {
      repo.findOneBy.mockResolvedValue(null)

      await service.solicitarRecuperacion('noexiste@test.cl')

      expect(repo.save).not.toHaveBeenCalled()
      expect(mailerService.enviarRecuperacion).not.toHaveBeenCalled()
    })

    it('debe retornar sin hacer nada si la cuenta no está activada', async () => {
      repo.findOneBy.mockResolvedValue({ ...mockUser, cuentaActivada: false })

      await service.solicitarRecuperacion('admin@test.cl')

      expect(repo.save).not.toHaveBeenCalled()
      expect(mailerService.enviarRecuperacion).not.toHaveBeenCalled()
    })

    it('debe retornar sin hacer nada si la cuenta está inactiva', async () => {
      repo.findOneBy.mockResolvedValue({ ...mockUser, activo: false })

      await service.solicitarRecuperacion('admin@test.cl')

      expect(repo.save).not.toHaveBeenCalled()
      expect(mailerService.enviarRecuperacion).not.toHaveBeenCalled()
    })
  })

  describe('restablecerPassword', () => {
    it('debe actualizar el password y limpiar el token', async () => {
      const usuarioConToken = {
        ...mockUser,
        resetPasswordToken: 'token-reset-123',
        resetPasswordExpires: new Date(Date.now() + 3600000),
      }
      repo.findOneBy.mockResolvedValue(usuarioConToken)
      repo.save.mockResolvedValue(usuarioConToken)
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('nueva-hash' as never)

      await service.restablecerPassword('token-reset-123', 'nuevaPassword123')

      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          password: 'nueva-hash',
          resetPasswordToken: null,
          resetPasswordExpires: null,
        }),
      )
    })

    it('debe lanzar BadRequestException si el token no existe', async () => {
      repo.findOneBy.mockResolvedValue(null)

      await expect(
        service.restablecerPassword('token-invalido', 'nuevaPassword123'),
      ).rejects.toThrow(BadRequestException)
    })

    it('debe lanzar BadRequestException si el token ha expirado', async () => {
      repo.findOneBy.mockResolvedValue({
        ...mockUser,
        resetPasswordToken: 'token-reset-123',
        resetPasswordExpires: new Date(Date.now() - 3600000),
      })

      await expect(
        service.restablecerPassword('token-reset-123', 'nuevaPassword123'),
      ).rejects.toThrow(BadRequestException)
    })

    it('debe usar el mismo mensaje de error para token inválido y expirado', async () => {
      repo.findOneBy.mockResolvedValue(null)
      await expect(
        service.restablecerPassword('token-invalido', 'pass'),
      ).rejects.toThrow('Token inválido o expirado')

      repo.findOneBy.mockResolvedValue({
        ...mockUser,
        resetPasswordToken: 'token-reset-123',
        resetPasswordExpires: new Date(Date.now() - 3600000),
      })
      await expect(
        service.restablecerPassword('token-reset-123', 'pass'),
      ).rejects.toThrow('Token inválido o expirado')
    })
  })

  describe('activarCuenta', () => {
    it('debe activar cuenta con token válido', async () => {
      const usuarioConToken = {
        ...mockUser,
        tokenExpiracion: new Date(Date.now() + 3600000),
      }
      repo.findOneBy.mockResolvedValue(usuarioConToken)
      repo.save.mockResolvedValue({
        ...usuarioConToken,
        cuentaActivada: true,
        tokenActivacion: null,
        tokenExpiracion: null,
      })

      await service.activarCuenta('token-uuid-123')

      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          cuentaActivada: true,
          tokenActivacion: null,
          tokenExpiracion: null,
        }),
      )
    })

    it('debe lanzar NotFoundException si el token no existe', async () => {
      repo.findOneBy.mockResolvedValue(null)

      await expect(service.activarCuenta('token-invalido')).rejects.toThrow(
        NotFoundException,
      )
    })

    it('debe lanzar BadRequestException si el token ha expirado', async () => {
      const usuarioExpirado = {
        ...mockUser,
        tokenExpiracion: new Date(Date.now() - 3600000),
      }
      repo.findOneBy.mockResolvedValue(usuarioExpirado)

      await expect(service.activarCuenta('token-uuid-123')).rejects.toThrow(
        BadRequestException,
      )
    })
  })
})
