import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Miembro, EstadoSocio } from '../miembros/entities/miembro.entity'
import { DiagnosticoClinico } from '../diagnostico-clinico/entities/diagnostico-clinico.entity'
import { EvaluacionFuncional } from '../evaluacion-funcional/entities/evaluacion-funcional.entity'
import { User, Rol } from '../users/entities/user.entity'
import { QueryExportDto, FormatoExport } from './dto/query-export.dto'
import { MiembroExportRow, ExportResult } from './exporters/base.exporter'
import { CsvExporter } from './exporters/csv.exporter'
import { XlsxExporter } from './exporters/xlsx.exporter'
import { PdfExporter } from './exporters/pdf.exporter'

@Injectable()
export class ExportsService {
  private csvExporter = new CsvExporter()
  private xlsxExporter = new XlsxExporter()
  private pdfExporter = new PdfExporter()

  constructor(
    @InjectRepository(Miembro)
    private readonly miembroRepo: Repository<Miembro>,
    @InjectRepository(DiagnosticoClinico)
    private readonly diagnosticoRepo: Repository<DiagnosticoClinico>,
    @InjectRepository(EvaluacionFuncional)
    private readonly evaluacionRepo: Repository<EvaluacionFuncional>,
  ) {}

  async generarArchivo(
    query: QueryExportDto,
    user: User,
  ): Promise<ExportResult> {
    const esTesorero = user.rol === Rol.TESORERO
    const data = await this.obtenerDatos(query, esTesorero)

    switch (query.formato) {
      case FormatoExport.XLSX:
        return this.xlsxExporter.generate(data)
      case FormatoExport.PDF:
        return this.pdfExporter.generate(data)
      case FormatoExport.CSV:
      default:
        return this.csvExporter.generate(data)
    }
  }

  async generarFichaIndividual(
    miembroId: number,
    user: User,
  ): Promise<ExportResult> {
    if (user.rol === Rol.TESORERO) {
      throw new ForbiddenException('No tiene permisos para exportar ficha individual')
    }

    const miembro = await this.miembroRepo.findOne({
      where: { id: miembroId },
      relations: ['region', 'comuna', 'tipoAtaxia'],
    })

    if (!miembro) {
      throw new NotFoundException('Miembro no encontrado')
    }

    const diagnostico = await this.diagnosticoRepo.findOne({
      where: { miembroId },
      relations: ['tipoAtaxia'],
    })

    const evaluaciones = await this.evaluacionRepo.find({
      where: { miembroId },
      order: { fecha: 'DESC' },
    })

    const pdfExporter = new PdfExporter()
    return pdfExporter.generate([] as MiembroExportRow[])
  }

  private async obtenerDatos(
    query: QueryExportDto,
    esTesorero: boolean,
  ): Promise<MiembroExportRow[]> {
    const qb = this.miembroRepo
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.region', 'region')
      .leftJoinAndSelect('m.comuna', 'comuna')
      .leftJoinAndSelect('m.tipoAtaxia', 'tipoAtaxia')

    if (query.estado) {
      qb.andWhere('m.estado = :estado', { estado: query.estado })
    }

    if (query.regionId) {
      qb.andWhere('m.regionId = :regionId', { regionId: query.regionId })
    }

    if (query.tipoAtaxiaId) {
      qb.andWhere('m.tipoAtaxiaId = :tipoAtaxiaId', { tipoAtaxiaId: query.tipoAtaxiaId })
    }

    if (query.fechaDesde) {
      qb.andWhere('m.fechaInscripcion >= :fechaDesde', { fechaDesde: query.fechaDesde })
    }

    if (query.fechaHasta) {
      qb.andWhere('m.fechaInscripcion <= :fechaHasta', { fechaHasta: query.fechaHasta })
    }

    const miembros = await qb.getMany()

    const rows: MiembroExportRow[] = miembros.map((m) => {
      const base: MiembroExportRow = {
        rut: m.rut,
        nombre: `${m.nombre}`,
        email: m.email,
        celular: esTesorero ? null : m.celular,
        region: m.region?.nombre ?? null,
        comuna: m.comuna?.nombre ?? null,
        tipoAtaxia: esTesorero ? null : (m.tipoAtaxia?.nombre ?? null),
        fechaIngreso: m.fechaInscripcion,
        estado: m.estado,
      }

      if (!esTesorero) {
        base.diagnostico = null as unknown as MiembroExportRow['diagnostico']
        base.ultimaEvaluacion = null as unknown as MiembroExportRow['ultimaEvaluacion']
      }

      return base
    })

    return rows
  }
}
