import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DiagnosticoClinico } from './entities/diagnostico-clinico.entity';
import { Miembro } from '../miembros/entities/miembro.entity';
import { CreateDiagnosticoClinicoDto } from './dto/create-diagnostico-clinico.dto';
import { UpdateDiagnosticoClinicoDto } from './dto/update-diagnostico-clinico.dto';
import { AuditService } from '../audit/audit.service';
import { AccionAudit } from '../audit/entities/audit-log.entity';

@Injectable()
export class DiagnosticoClinicoService {
  constructor(
    @InjectRepository(DiagnosticoClinico)
    private readonly diagnosticoRepo: Repository<DiagnosticoClinico>,
    @InjectRepository(Miembro)
    private readonly miembrosRepo: Repository<Miembro>,
    private readonly auditService: AuditService,
  ) {}

  async create(
    miembroId: number,
    dto: CreateDiagnosticoClinicoDto,
    usuarioId?: number,
    ip?: string,
  ): Promise<DiagnosticoClinico> {
    const miembro = await this.miembrosRepo.findOneBy({ id: miembroId });
    if (!miembro) throw new NotFoundException('Miembro no encontrado');

    const existe = await this.diagnosticoRepo.findOneBy({ miembroId });
    if (existe)
      throw new ConflictException(
        'Este miembro ya tiene un diagnóstico registrado. Use PATCH para actualizarlo.',
      );

    const diagnostico = this.diagnosticoRepo.create({ ...dto, miembroId });
    const guardado = await this.diagnosticoRepo.save(diagnostico);

    this.auditService
      .registrar({
        accion: AccionAudit.CREAR_DIAGNOSTICO,
        entidad: 'miembro',
        entidadId: miembroId,
        usuarioId,
        ip,
      })
      .catch(() => {});

    return guardado;
  }

  async findByMiembro(miembroId: number): Promise<DiagnosticoClinico> {
    const diagnostico = await this.diagnosticoRepo.findOne({
      where: { miembroId },
      relations: ['tipoAtaxia'],
    });
    if (!diagnostico)
      throw new NotFoundException(
        'Diagnóstico no encontrado para este miembro',
      );
    return diagnostico;
  }

  async update(
    miembroId: number,
    dto: UpdateDiagnosticoClinicoDto,
    usuarioId?: number,
    ip?: string,
  ): Promise<DiagnosticoClinico> {
    const diagnostico = await this.diagnosticoRepo.findOneBy({ miembroId });
    if (!diagnostico)
      throw new NotFoundException(
        'Diagnóstico no encontrado para este miembro',
      );
    Object.assign(diagnostico, dto);
    const guardado = await this.diagnosticoRepo.save(diagnostico);

    this.auditService
      .registrar({
        accion: AccionAudit.MODIFICAR_DIAGNOSTICO,
        entidad: 'miembro',
        entidadId: miembroId,
        usuarioId,
        ip,
      })
      .catch(() => {});

    return guardado;
  }
}
