import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { StatsService } from './stats.service'
import { Miembro, EstadoSocio } from '../miembros/entities/miembro.entity'
import { DiagnosticoClinico } from '../diagnostico-clinico/entities/diagnostico-clinico.entity'
import { EvaluacionFuncional } from '../evaluacion-funcional/entities/evaluacion-funcional.entity'

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Crea un mock reutilizable del QueryBuilder con métodos encadenables */
const makeQbMock = () => {
  const qb: any = {
    select:      jest.fn().mockReturnThis(),
    addSelect:   jest.fn().mockReturnThis(),
    innerJoin:   jest.fn().mockReturnThis(),
    where:       jest.fn().mockReturnThis(),
    andWhere:    jest.fn().mockReturnThis(),
    groupBy:     jest.fn().mockReturnThis(),
    addGroupBy:  jest.fn().mockReturnThis(),
    orderBy:     jest.fn().mockReturnThis(),
    subQuery:    jest.fn().mockReturnThis(),
    from:        jest.fn().mockReturnThis(),
    getQuery:    jest.fn().mockReturnValue('(SELECT MAX(e2.id) FROM e2 WHERE e2.miembroId = e.miembroId)'),
    getRawMany:  jest.fn(),
    getCount:    jest.fn(),
  }
  return qb
}

// ── Datos de prueba ───────────────────────────────────────────────────────────

const estadoRows = [
  { estado: 'activo',     total: '4' },
  { estado: 'renunciado', total: '1' },
  { estado: 'fallecido',  total: '1' },
]

const diagnosticoRows = [
  { tipoAtaxia: 'Ataxia de Friedreich', confirmacion: 'genetico',  total: '2' },
  { tipoAtaxia: 'SCA2',                 confirmacion: 'clinico',   total: '1' },
  { tipoAtaxia: 'SCA3 (Machado-Joseph)', confirmacion: 'probable', total: '1' },
]

const movilidadRows = [
  { nivelMovilidad: 'ambulatorio_con_apoyo', total: '2' },
  { nivelMovilidad: 'silla_parcial',         total: '1' },
  { nivelMovilidad: 'silla_total',           total: '1' },
]

const regionRows = [
  { region: 'Región de Arica y Parinacota', total: '3' },
  { region: 'Región de Tarapacá',           total: '2' },
]

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('StatsService', () => {
  let service: StatsService
  let miembroRepo: jest.Mocked<Repository<Miembro>>
  let diagnosticoRepo: jest.Mocked<Repository<DiagnosticoClinico>>
  let evaluacionRepo: jest.Mocked<Repository<EvaluacionFuncional>>
  let qb: ReturnType<typeof makeQbMock>

  beforeEach(async () => {
    qb = makeQbMock()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatsService,
        {
          provide: getRepositoryToken(Miembro),
          useValue: {
            count: jest.fn(),
            createQueryBuilder: jest.fn().mockReturnValue(qb),
          },
        },
        {
          provide: getRepositoryToken(DiagnosticoClinico),
          useValue: { createQueryBuilder: jest.fn().mockReturnValue(qb) },
        },
        {
          provide: getRepositoryToken(EvaluacionFuncional),
          useValue: { createQueryBuilder: jest.fn().mockReturnValue(qb) },
        },
      ],
    }).compile()

    service       = module.get<StatsService>(StatsService)
    miembroRepo   = module.get(getRepositoryToken(Miembro))
    diagnosticoRepo = module.get(getRepositoryToken(DiagnosticoClinico))
    evaluacionRepo  = module.get(getRepositoryToken(EvaluacionFuncional))
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  // ── resumen ──────────────────────────────────────────────────────────────

  describe('resumen', () => {
    beforeEach(() => {
      ;(miembroRepo.count as jest.Mock)
        .mockResolvedValueOnce(6)   // total
        .mockResolvedValueOnce(4)   // activos
      qb.getCount.mockResolvedValue(1) // nuevosUltimos30Dias
    })

    it('debe retornar total, activos y nuevosUltimos30Dias', async () => {
      const result = await service.resumen()

      expect(result).toEqual({ total: 6, activos: 4, nuevosUltimos30Dias: 1 })
    })

    it('debe consultar el total sin filtro', async () => {
      await service.resumen()

      expect(miembroRepo.count).toHaveBeenNthCalledWith(1)
    })

    it('debe consultar activos filtrando por estado ACTIVO', async () => {
      await service.resumen()

      expect(miembroRepo.count).toHaveBeenNthCalledWith(2, {
        where: { estado: EstadoSocio.ACTIVO },
      })
    })

    it('debe usar createQueryBuilder para nuevos en los últimos 30 días', async () => {
      await service.resumen()

      expect(miembroRepo.createQueryBuilder).toHaveBeenCalledWith('m')
      expect(qb.getCount).toHaveBeenCalled()
    })
  })

  // ── porEstado ─────────────────────────────────────────────────────────────

  describe('porEstado', () => {
    it('debe retornar distribución agrupada por estado', async () => {
      qb.getRawMany.mockResolvedValue(estadoRows)

      const result = await service.porEstado()

      expect(result).toEqual(estadoRows)
    })

    it('debe usar createQueryBuilder sobre la tabla de miembros', async () => {
      qb.getRawMany.mockResolvedValue(estadoRows)

      await service.porEstado()

      expect(miembroRepo.createQueryBuilder).toHaveBeenCalledWith('m')
      expect(qb.groupBy).toHaveBeenCalled()
      expect(qb.getRawMany).toHaveBeenCalled()
    })

    it('debe retornar array vacío si no hay miembros', async () => {
      qb.getRawMany.mockResolvedValue([])

      const result = await service.porEstado()

      expect(result).toEqual([])
    })
  })

  // ── porDiagnostico ────────────────────────────────────────────────────────

  describe('porDiagnostico', () => {
    it('debe retornar distribución por tipo de ataxia y confirmación', async () => {
      qb.getRawMany.mockResolvedValue(diagnosticoRows)

      const result = await service.porDiagnostico()

      expect(result).toEqual(diagnosticoRows)
    })

    it('debe aplicar filtro esRepresentante = false', async () => {
      qb.getRawMany.mockResolvedValue(diagnosticoRows)

      await service.porDiagnostico()

      expect(qb.where).toHaveBeenCalledWith('m.esRepresentante = false')
    })

    it('debe usar join con tipoAtaxia y miembro', async () => {
      qb.getRawMany.mockResolvedValue(diagnosticoRows)

      await service.porDiagnostico()

      expect(diagnosticoRepo.createQueryBuilder).toHaveBeenCalledWith('d')
      expect(qb.innerJoin).toHaveBeenCalledTimes(2)
    })

    it('debe agrupar por tipo de ataxia y confirmación', async () => {
      qb.getRawMany.mockResolvedValue(diagnosticoRows)

      await service.porDiagnostico()

      expect(qb.groupBy).toHaveBeenCalled()
      expect(qb.addGroupBy).toHaveBeenCalled()
    })
  })

  // ── porMovilidad ──────────────────────────────────────────────────────────

  describe('porMovilidad', () => {
    it('debe retornar distribución por nivel de movilidad', async () => {
      qb.getRawMany.mockResolvedValue(movilidadRows)

      const result = await service.porMovilidad()

      expect(result).toEqual(movilidadRows)
    })

    it('debe excluir representantes', async () => {
      qb.getRawMany.mockResolvedValue(movilidadRows)

      await service.porMovilidad()

      expect(qb.where).toHaveBeenCalledWith('m.esRepresentante = false')
    })

    it('debe usar evaluacionRepo como base', async () => {
      qb.getRawMany.mockResolvedValue(movilidadRows)

      await service.porMovilidad()

      expect(evaluacionRepo.createQueryBuilder).toHaveBeenCalledWith('e')
    })

    it('debe aplicar andWhere para filtrar la última evaluación por miembro', async () => {
      qb.getRawMany.mockResolvedValue(movilidadRows)

      await service.porMovilidad()

      expect(qb.andWhere).toHaveBeenCalled()
    })

    it('debe retornar array vacío si no hay evaluaciones', async () => {
      qb.getRawMany.mockResolvedValue([])

      const result = await service.porMovilidad()

      expect(result).toEqual([])
    })
  })

  // ── porRegion ─────────────────────────────────────────────────────────────

  describe('porRegion', () => {
    it('debe retornar distribución por región', async () => {
      qb.getRawMany.mockResolvedValue(regionRows)

      const result = await service.porRegion()

      expect(result).toEqual(regionRows)
    })

    it('debe excluir representantes', async () => {
      qb.getRawMany.mockResolvedValue(regionRows)

      await service.porRegion()

      expect(qb.where).toHaveBeenCalledWith('m.esRepresentante = false')
    })

    it('debe hacer join con la tabla de regiones', async () => {
      qb.getRawMany.mockResolvedValue(regionRows)

      await service.porRegion()

      expect(qb.innerJoin).toHaveBeenCalled()
    })

    it('debe retornar array vacío si no hay miembros con región asignada', async () => {
      qb.getRawMany.mockResolvedValue([])

      const result = await service.porRegion()

      expect(result).toEqual([])
    })
  })
})
