import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog, AccionAudit } from './entities/audit-log.entity';
import { QueryAuditDto } from './dto/query-audit.dto';
import { PaginatedResult } from '../common/types/response.types';

export interface RegistrarAuditDto {
  accion: AccionAudit;
  entidad?: string;
  entidadId?: number;
  usuarioId?: number | null;
  ip?: string;
  detalle?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  async registrar(data: RegistrarAuditDto): Promise<void> {
    const log = this.auditRepo.create({
      accion: data.accion,
      entidad: data.entidad ?? null,
      entidadId: data.entidadId ?? null,
      usuarioId: data.usuarioId ?? null,
      ip: data.ip ?? null,
      detalle: data.detalle ?? null,
    });
    await this.auditRepo.save(log);
  }

  async findAll(query: QueryAuditDto): Promise<PaginatedResult<AuditLog>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.auditRepo
      .createQueryBuilder('log')
      .orderBy('log.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.accion)
      qb.andWhere('log.accion = :accion', { accion: query.accion });
    if (query.entidad)
      qb.andWhere('log.entidad = :entidad', { entidad: query.entidad });
    if (query.usuarioId)
      qb.andWhere('log.usuarioId = :usuarioId', { usuarioId: query.usuarioId });
    if (query.desde)
      qb.andWhere('log.createdAt >= :desde', { desde: new Date(query.desde) });
    if (query.hasta)
      qb.andWhere('log.createdAt <= :hasta', { hasta: new Date(query.hasta) });

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  async findOne(id: number): Promise<AuditLog> {
    const log = await this.auditRepo.findOneBy({ id });
    if (!log)
      throw new NotFoundException('Registro de auditoría no encontrado');
    return log;
  }
}
