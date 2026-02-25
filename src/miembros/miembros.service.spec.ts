import { ConflictException, NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Miembro, EstadoSocio, EstadoCivil } from './entities/miembro.entity'
import { MiembrosService } from './miembros.service'
import { CreateMiembroDto } from './dto/create-miembro.dto'
import { UpdateMiembroDto } from './dto/update-miembro.dto'
import { UpdateEstadoDto } from './dto/update-estado.dto'

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
  estado: EstadoSocio.ACTIVO,
  fechaInscripcion: '2024-01-15',
  fechaCambioEstado: null,
  userId: null,
  user: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const createDto: CreateMiembroDto = {
  rut: '12345678-9',
  nombre: 'María González',
  fechaInscripcion: '2024-01-15',
}

describe('MiembrosService', () => {
  let service: MiembrosService
  let repo: jest.Mocked<Repository<Miembro>>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MiembrosService,
        {
          provide: getRepositoryToken(Miembro),
          useValue: {
            findOneBy: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile()

    service = module.get<MiembrosService>(MiembrosService)
    repo = module.get(getRepositoryToken(Miembro))
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('create', () => {
    it('debe crear un miembro con estado ACTIVO por defecto', async () => {
      repo.findOneBy.mockResolvedValue(null)
      repo.create.mockReturnValue(mockMiembro)
      repo.save.mockResolvedValue(mockMiembro)

      const result = await service.create(createDto)

      expect(result).toEqual(mockMiembro)
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ estado: EstadoSocio.ACTIVO, fechaCambioEstado: null }),
      )
      expect(repo.save).toHaveBeenCalled()
    })

    it('debe lanzar ConflictException si ya existe un miembro con ese RUT', async () => {
      repo.findOneBy.mockResolvedValue(mockMiembro)

      await expect(service.create(createDto)).rejects.toThrow(ConflictException)
      await expect(service.create(createDto)).rejects.toThrow(
        'Ya existe un miembro con este RUT',
      )
      expect(repo.save).not.toHaveBeenCalled()
    })
  })

  describe('findAll', () => {
    it('debe retornar lista de miembros con relaciones', async () => {
      repo.find.mockResolvedValue([mockMiembro])

      const result = await service.findAll()

      expect(result).toHaveLength(1)
      expect(repo.find).toHaveBeenCalledWith(
        expect.objectContaining({ relations: ['region', 'comuna', 'tipoAtaxia'] }),
      )
    })

    it('debe filtrar por estado cuando se provee', async () => {
      repo.find.mockResolvedValue([mockMiembro])

      await service.findAll(EstadoSocio.ACTIVO)

      expect(repo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { estado: EstadoSocio.ACTIVO } }),
      )
    })

    it('debe retornar todos sin filtro cuando no se provee estado', async () => {
      repo.find.mockResolvedValue([mockMiembro])

      await service.findAll()

      expect(repo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      )
    })

    it('debe retornar lista vacía si no hay miembros', async () => {
      repo.find.mockResolvedValue([])

      const result = await service.findAll()

      expect(result).toHaveLength(0)
    })
  })

  describe('findOne', () => {
    it('debe retornar el miembro con todas las relaciones', async () => {
      repo.findOne.mockResolvedValue(mockMiembro)

      const result = await service.findOne(1)

      expect(result).toEqual(mockMiembro)
      expect(repo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          relations: ['region', 'comuna', 'tipoAtaxia', 'user'],
        }),
      )
    })

    it('debe lanzar NotFoundException si el miembro no existe', async () => {
      repo.findOne.mockResolvedValue(null)

      await expect(service.findOne(99)).rejects.toThrow(NotFoundException)
      await expect(service.findOne(99)).rejects.toThrow('Miembro no encontrado')
    })
  })

  describe('update', () => {
    it('debe actualizar los datos del miembro', async () => {
      const dto: UpdateMiembroDto = { nombre: 'María González Actualizada' }
      repo.findOneBy.mockResolvedValue({ ...mockMiembro })
      repo.save.mockResolvedValue({ ...mockMiembro, nombre: dto.nombre! })

      const result = await service.update(1, dto)

      expect(result.nombre).toBe('María González Actualizada')
      expect(repo.save).toHaveBeenCalled()
    })

    it('debe lanzar NotFoundException si el miembro no existe', async () => {
      repo.findOneBy.mockResolvedValue(null)

      await expect(service.update(99, { nombre: 'X' })).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('updateEstado', () => {
    it('debe actualizar el estado y registrar la fecha de cambio', async () => {
      const dto: UpdateEstadoDto = { estado: EstadoSocio.SUSPENDIDO }
      repo.findOneBy.mockResolvedValue({ ...mockMiembro })
      repo.save.mockImplementation(async (m) => m as Miembro)

      const result = await service.updateEstado(1, dto)

      expect(result.estado).toBe(EstadoSocio.SUSPENDIDO)
      expect(result.fechaCambioEstado).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          estado: EstadoSocio.SUSPENDIDO,
          fechaCambioEstado: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        }),
      )
    })

    it('debe lanzar NotFoundException si el miembro no existe', async () => {
      repo.findOneBy.mockResolvedValue(null)

      await expect(
        service.updateEstado(99, { estado: EstadoSocio.FALLECIDO }),
      ).rejects.toThrow(NotFoundException)
    })
  })

  describe('vincularUsuario', () => {
    it('debe vincular el userId al miembro', async () => {
      repo.findOneBy
        .mockResolvedValueOnce({ ...mockMiembro, userId: null }) // miembro encontrado
        .mockResolvedValueOnce(null)                              // userId no vinculado a otro
      repo.save.mockImplementation(async (m) => m as Miembro)

      const result = await service.vincularUsuario(1, 10)

      expect(result.userId).toBe(10)
      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 10 }),
      )
    })

    it('debe lanzar NotFoundException si el miembro no existe', async () => {
      repo.findOneBy.mockResolvedValue(null)

      await expect(service.vincularUsuario(99, 10)).rejects.toThrow(
        NotFoundException,
      )
    })

    it('debe lanzar ConflictException si el userId ya está vinculado a otro miembro', async () => {
      const otroMiembro: Miembro = { ...mockMiembro, id: 2, userId: 10 }
      repo.findOneBy
        .mockResolvedValueOnce({ ...mockMiembro, id: 1 }) // miembro id=1 encontrado
        .mockResolvedValueOnce(otroMiembro)               // userId ya vinculado a id=2

      await expect(service.vincularUsuario(1, 10)).rejects.toThrow(ConflictException)
    })

    it('debe usar el mensaje correcto para vinculación duplicada', async () => {
      const otroMiembro: Miembro = { ...mockMiembro, id: 2, userId: 10 }
      repo.findOneBy
        .mockResolvedValueOnce({ ...mockMiembro, id: 1 })
        .mockResolvedValueOnce(otroMiembro)

      await expect(service.vincularUsuario(1, 10)).rejects.toThrow(
        'Este usuario ya está vinculado a otro miembro',
      )
    })

    it('debe permitir re-vincular el mismo usuario al mismo miembro', async () => {
      // userId=10 ya está vinculado al miembro id=1 — se permite (idempotente)
      repo.findOneBy
        .mockResolvedValueOnce({ ...mockMiembro, id: 1, userId: 10 })
        .mockResolvedValueOnce({ ...mockMiembro, id: 1, userId: 10 }) // mismo id
      repo.save.mockImplementation(async (m) => m as Miembro)

      const result = await service.vincularUsuario(1, 10)

      expect(result.userId).toBe(10)
    })
  })
})
