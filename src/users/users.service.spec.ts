import { ConflictException, NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import * as bcrypt from 'bcrypt'
import { Repository } from 'typeorm'
import { CreateUserDto } from './dto/create-user.dto'
import { User, Rol } from './entities/user.entity'
import { UsersService } from './users.service'

const mockUser: User = {
  id: 1,
  nombre: 'Admin Test',
  email: 'admin@test.cl',
  password: 'hashed_password',
  rol: Rol.ADMIN,
  activo: true,
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
      ],
    }).compile()

    service = module.get<UsersService>(UsersService)
    repo = module.get(getRepositoryToken(User))
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('create', () => {
    it('debe crear usuario y retornarlo sin password', async () => {
      repo.findOneBy.mockResolvedValue(null)
      repo.create.mockReturnValue(mockUser)
      repo.save.mockResolvedValue(mockUser)
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed' as never)

      const result = await service.create(createDto)

      expect(result).not.toHaveProperty('password')
      expect(repo.save).toHaveBeenCalled()
    })

    it('debe lanzar ConflictException si el email ya existe', async () => {
      repo.findOneBy.mockResolvedValue(mockUser)

      await expect(service.create(createDto)).rejects.toThrow(ConflictException)
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
})
