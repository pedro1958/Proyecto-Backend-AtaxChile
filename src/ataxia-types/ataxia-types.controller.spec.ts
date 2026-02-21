import { Test, TestingModule } from '@nestjs/testing'
import { AtaxiaTypesController } from './ataxia-types.controller'
import { AtaxiaTypesService } from './ataxia-types.service'
import { GrupoAtaxia } from './entities/ataxia-type.entity'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'

const mockTipo = {
  id: 1,
  nombre: 'Ataxia de Friedreich',
  grupo: GrupoAtaxia.HEREDITARIA,
  descripcion: 'Ataxia hereditaria más frecuente',
  activo: true,
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('AtaxiaTypesController', () => {
  let controller: AtaxiaTypesController
  let service: jest.Mocked<AtaxiaTypesService>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AtaxiaTypesController],
      providers: [
        {
          provide: AtaxiaTypesService,
          useValue: {
            findAll: jest.fn().mockResolvedValue([mockTipo]),
            findOne: jest.fn().mockResolvedValue(mockTipo),
            create: jest.fn().mockResolvedValue(mockTipo),
            update: jest.fn().mockResolvedValue({ ...mockTipo, nombre: 'Modificado' }),
            toggleStatus: jest.fn().mockResolvedValue({ ...mockTipo, activo: false }),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile()

    controller = module.get<AtaxiaTypesController>(AtaxiaTypesController)
    service = module.get(AtaxiaTypesService)
  })

  describe('findAll', () => {
    it('retorna lista de tipos sin filtro', async () => {
      const result = await controller.findAll()
      expect(result).toEqual([mockTipo])
      expect(service.findAll).toHaveBeenCalledWith(undefined)
    })

    it('retorna lista filtrada por grupo', async () => {
      const result = await controller.findAll(GrupoAtaxia.HEREDITARIA)
      expect(result).toEqual([mockTipo])
      expect(service.findAll).toHaveBeenCalledWith(GrupoAtaxia.HEREDITARIA)
    })
  })

  describe('findOne', () => {
    it('retorna un tipo por id', async () => {
      const result = await controller.findOne(1)
      expect(result).toEqual(mockTipo)
      expect(service.findOne).toHaveBeenCalledWith(1)
    })
  })

  describe('create', () => {
    it('crea un tipo de ataxia', async () => {
      const dto = { nombre: 'Ataxia de Friedreich', grupo: GrupoAtaxia.HEREDITARIA }
      const result = await controller.create(dto)
      expect(result).toEqual(mockTipo)
      expect(service.create).toHaveBeenCalledWith(dto)
    })
  })

  describe('update', () => {
    it('actualiza un tipo de ataxia', async () => {
      const dto = { nombre: 'Modificado' }
      const result = await controller.update(1, dto)
      expect(result.nombre).toBe('Modificado')
      expect(service.update).toHaveBeenCalledWith(1, dto)
    })
  })

  describe('toggleStatus', () => {
    it('cambia el estado activo del tipo', async () => {
      const result = await controller.toggleStatus(1)
      expect(result.activo).toBe(false)
      expect(service.toggleStatus).toHaveBeenCalledWith(1)
    })
  })
})
