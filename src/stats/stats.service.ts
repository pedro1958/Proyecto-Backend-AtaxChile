import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Miembro, EstadoSocio } from '../miembros/entities/miembro.entity';
import { DiagnosticoClinico } from '../diagnostico-clinico/entities/diagnostico-clinico.entity';
import { EvaluacionFuncional } from '../evaluacion-funcional/entities/evaluacion-funcional.entity';

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(Miembro)
    private readonly miembroRepo: Repository<Miembro>,
    @InjectRepository(DiagnosticoClinico)
    private readonly diagnosticoRepo: Repository<DiagnosticoClinico>,
    @InjectRepository(EvaluacionFuncional)
    private readonly evaluacionRepo: Repository<EvaluacionFuncional>,
  ) {}

  async resumen() {
    const total = await this.miembroRepo.count();
    const activos = await this.miembroRepo.count({
      where: { estado: EstadoSocio.ACTIVO },
    });
    const hace30dias = new Date();
    hace30dias.setDate(hace30dias.getDate() - 30);
    const nuevosUltimos30Dias = await this.miembroRepo
      .createQueryBuilder('m')
      .where('m.createdAt >= :fecha', { fecha: hace30dias })
      .getCount();
    return { total, activos, nuevosUltimos30Dias };
  }

  async porEstado() {
    return this.miembroRepo
      .createQueryBuilder('m')
      .select('m.estado', 'estado')
      .addSelect('COUNT(*)', 'total')
      .groupBy('m.estado')
      .orderBy('total', 'DESC')
      .getRawMany();
  }

  async porDiagnostico() {
    return this.diagnosticoRepo
      .createQueryBuilder('d')
      .innerJoin('d.tipoAtaxia', 'ta')
      .innerJoin('d.miembro', 'm')
      .select('ta.nombre', 'tipoAtaxia')
      .addSelect('d.confirmacion', 'confirmacion')
      .addSelect('COUNT(*)', 'total')
      .where('m.esRepresentante = false')
      .groupBy('ta.nombre')
      .addGroupBy('d.confirmacion')
      .orderBy('total', 'DESC')
      .getRawMany();
  }

  async porMovilidad() {
    return this.evaluacionRepo
      .createQueryBuilder('e')
      .innerJoin('e.miembro', 'm')
      .select('e.nivelMovilidad', 'nivelMovilidad')
      .addSelect('COUNT(DISTINCT e.miembroId)', 'total')
      .where('m.esRepresentante = false')
      .andWhere((qb) => {
        const sub = qb
          .subQuery()
          .select('MAX(e2.id)')
          .from(EvaluacionFuncional, 'e2')
          .where('e2.miembroId = e.miembroId')
          .getQuery();
        return `e.id IN ${sub}`;
      })
      .groupBy('e.nivelMovilidad')
      .getRawMany();
  }

  async porRegion() {
    return this.miembroRepo
      .createQueryBuilder('m')
      .innerJoin('m.region', 'r')
      .select('r.nombre', 'region')
      .addSelect('COUNT(*)', 'total')
      .where('m.esRepresentante = false')
      .groupBy('r.nombre')
      .orderBy('total', 'DESC')
      .getRawMany();
  }
}
