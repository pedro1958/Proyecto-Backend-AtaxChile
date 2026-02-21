import { Test, TestingModule } from '@nestjs/testing'
import { GeoController } from './geo.controller'
import { GeoService } from './geo.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'

const mockRegion = { id: 1, nombre: 'Región Metropolitana de Santiago', comunas: [] }
const mockComuna = { id: 1, nombre: 'Santiago', regionId: 1, region: mockRegion }

describe('GeoController', () => {
  let controller: GeoController
  let service: jest.Mocked<GeoService>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GeoController],
      providers: [
        {
          provide: GeoService,
          useValue: {
            findAllRegiones: jest.fn().mockResolvedValue([mockRegion]),
            findOneRegion: jest.fn().mockResolvedValue(mockRegion),
            createRegion: jest.fn().mockResolvedValue(mockRegion),
            updateRegion: jest.fn().mockResolvedValue({ ...mockRegion, nombre: 'Modificada' }),
            findComunasByRegion: jest.fn().mockResolvedValue([mockComuna]),
            findOneComuna: jest.fn().mockResolvedValue(mockComuna),
            createComuna: jest.fn().mockResolvedValue(mockComuna),
            updateComuna: jest.fn().mockResolvedValue({ ...mockComuna, nombre: 'Modificada' }),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile()

    controller = module.get<GeoController>(GeoController)
    service = module.get(GeoService)
  })

  // ── Regiones ──────────────────────────────────────────────────────────────

  describe('findAllRegiones', () => {
    it('retorna lista de regiones', async () => {
      const result = await controller.findAllRegiones()
      expect(result).toEqual([mockRegion])
      expect(service.findAllRegiones).toHaveBeenCalled()
    })
  })

  describe('findOneRegion', () => {
    it('retorna una región por id', async () => {
      const result = await controller.findOneRegion(1)
      expect(result).toEqual(mockRegion)
      expect(service.findOneRegion).toHaveBeenCalledWith(1)
    })
  })

  describe('createRegion', () => {
    it('crea una región', async () => {
      const dto = { nombre: 'Región Metropolitana de Santiago' }
      const result = await controller.createRegion(dto)
      expect(result).toEqual(mockRegion)
      expect(service.createRegion).toHaveBeenCalledWith(dto)
    })
  })

  describe('updateRegion', () => {
    it('actualiza una región', async () => {
      const dto = { nombre: 'Modificada' }
      const result = await controller.updateRegion(1, dto)
      expect(result.nombre).toBe('Modificada')
      expect(service.updateRegion).toHaveBeenCalledWith(1, dto)
    })
  })

  // ── Comunas ───────────────────────────────────────────────────────────────

  describe('findComunasByRegion', () => {
    it('retorna comunas de una región', async () => {
      const result = await controller.findComunasByRegion(1)
      expect(result).toEqual([mockComuna])
      expect(service.findComunasByRegion).toHaveBeenCalledWith(1)
    })
  })

  describe('findOneComuna', () => {
    it('retorna una comuna por id', async () => {
      const result = await controller.findOneComuna(1)
      expect(result).toEqual(mockComuna)
      expect(service.findOneComuna).toHaveBeenCalledWith(1)
    })
  })

  describe('createComuna', () => {
    it('crea una comuna', async () => {
      const dto = { nombre: 'Santiago', regionId: 1 }
      const result = await controller.createComuna(dto)
      expect(result).toEqual(mockComuna)
      expect(service.createComuna).toHaveBeenCalledWith(dto)
    })
  })

  describe('updateComuna', () => {
    it('actualiza una comuna', async () => {
      const dto = { nombre: 'Modificada' }
      const result = await controller.updateComuna(1, dto)
      expect(result.nombre).toBe('Modificada')
      expect(service.updateComuna).toHaveBeenCalledWith(1, dto)
    })
  })
})
