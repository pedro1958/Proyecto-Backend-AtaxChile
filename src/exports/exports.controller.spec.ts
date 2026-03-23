import { Test, TestingModule } from '@nestjs/testing'
import { ExportsController } from './exports.controller'
import { ExportsService } from './exports.service'
import { FormatoExport } from './dto/query-export.dto'
import { Rol } from '../users/entities/user.entity'

const mockExportsService = () => ({
  generarArchivo: jest.fn(),
  generarFichaIndividual: jest.fn(),
})

describe('ExportsController', () => {
  let controller: ExportsController
  let service: jest.Mocked<ExportsService>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExportsController],
      providers: [
        {
          provide: ExportsService,
          useValue: mockExportsService(),
        },
      ],
    }).compile()

    controller = module.get<ExportsController>(ExportsController)
    service = module.get(ExportsService)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('exportMiembros', () => {
    it('debe llamar a service.generarArchivo con los parametros correctos', async () => {
      const mockUser = { id: 1, rol: Rol.ADMIN } as any
      const mockRes = {
        set: jest.fn().mockReturnThis(),
        end: jest.fn(),
      } as any
      const query = { formato: FormatoExport.CSV }
      const mockArchivo = {
        buffer: Buffer.from('test'),
        filename: 'miembros_2024-01-01.csv',
        mimeType: 'text/csv; charset=utf-8',
      }

      service.generarArchivo.mockResolvedValue(mockArchivo)

      await controller.exportMiembros(query, mockUser, mockRes)

      expect(service.generarArchivo).toHaveBeenCalledWith(query, mockUser)
      expect(mockRes.set).toHaveBeenCalledWith({
        'Content-Type': mockArchivo.mimeType,
        'Content-Disposition': `attachment; filename="${mockArchivo.filename}"`,
      })
      expect(mockRes.end).toHaveBeenCalled()
    })

    it('debe manejar diferentes formatos', async () => {
      const mockUser = { id: 1, rol: Rol.ADMIN } as any
      const mockRes = {
        set: jest.fn().mockReturnThis(),
        end: jest.fn(),
      } as any

      for (const formato of Object.values(FormatoExport)) {
        const query = { formato }
        const mockArchivo = {
          buffer: Buffer.from('test'),
          filename: `miembros_2024-01-01.${formato}`,
          mimeType: formato === 'csv' ? 'text/csv' : formato === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/pdf',
        }

        service.generarArchivo.mockResolvedValue(mockArchivo)

        await controller.exportMiembros(query, mockUser, mockRes)

        expect(service.generarArchivo).toHaveBeenCalledWith(query, mockUser)
      }
    })
  })

  describe('exportFichaIndividual', () => {
    it('debe llamar a service.generarFichaIndividual con el id del miembro', async () => {
      const mockUser = { id: 1, rol: Rol.ADMIN } as any
      const mockRes = {
        set: jest.fn().mockReturnThis(),
        end: jest.fn(),
      } as any
      const mockArchivo = {
        buffer: Buffer.from('test'),
        filename: 'miembros_1.pdf',
        mimeType: 'application/pdf',
      }

      service.generarFichaIndividual.mockResolvedValue(mockArchivo)

      await controller.exportFichaIndividual(1, mockUser, mockRes)

      expect(service.generarFichaIndividual).toHaveBeenCalledWith(1, mockUser)
      expect(mockRes.set).toHaveBeenCalledWith({
        'Content-Type': mockArchivo.mimeType,
        'Content-Disposition': `attachment; filename="${mockArchivo.filename}"`,
      })
      expect(mockRes.end).toHaveBeenCalled()
    })
  })
})
