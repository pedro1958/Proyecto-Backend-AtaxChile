import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { DiagnosticoClinico } from './entities/diagnostico-clinico.entity'
import { Miembro } from '../miembros/entities/miembro.entity'
import { CreateDiagnosticoClinicoDto } from './dto/create-diagnostico-clinico.dto'
import { UpdateDiagnosticoClinicoDto } from './dto/update-diagnostico-clinico.dto'

@Injectable()
export class DiagnosticoClinicoService {
  constructor(
    @InjectRepository(DiagnosticoClinico)
    private readonly diagnosticoRepo: Repository<DiagnosticoClinico>,
    @InjectRepository(Miembro)
    private readonly miembrosRepo: Repository<Miembro>,
  ) {}

  async create(
    miembroId: number,
    dto: CreateDiagnosticoClinicoDto,
  ): Promise<DiagnosticoClinico> {
    const miembro = await this.miembrosRepo.findOneBy({ id: miembroId })
    if (!miembro) throw new NotFoundException('Miembro no encontrado')

    const existe = await this.diagnosticoRepo.findOneBy({ miembroId })
    if (existe)
      throw new ConflictException(
        'Este miembro ya tiene un diagnóstico registrado. Use PATCH para actualizarlo.',
      )

    const diagnostico = this.diagnosticoRepo.create({ ...dto, miembroId })
    return this.diagnosticoRepo.save(diagnostico)
  }

  async findByMiembro(miembroId: number): Promise<DiagnosticoClinico> {
    const diagnostico = await this.diagnosticoRepo.findOne({
      where: { miembroId },
      relations: ['tipoAtaxia'],
    })
    if (!diagnostico)
      throw new NotFoundException('Diagnóstico no encontrado para este miembro')
    return diagnostico
  }

  async update(
    miembroId: number,
    dto: UpdateDiagnosticoClinicoDto,
  ): Promise<DiagnosticoClinico> {
    const diagnostico = await this.diagnosticoRepo.findOneBy({ miembroId })
    if (!diagnostico)
      throw new NotFoundException('Diagnóstico no encontrado para este miembro')
    Object.assign(diagnostico, dto)
    return this.diagnosticoRepo.save(diagnostico)
  }
}
