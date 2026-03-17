import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { EvaluacionFuncional } from './entities/evaluacion-funcional.entity'
import { Miembro } from '../miembros/entities/miembro.entity'
import { CreateEvaluacionFuncionalDto } from './dto/create-evaluacion-funcional.dto'

@Injectable()
export class EvaluacionFuncionalService {
  constructor(
    @InjectRepository(EvaluacionFuncional)
    private readonly evaluacionRepo: Repository<EvaluacionFuncional>,
    @InjectRepository(Miembro)
    private readonly miembrosRepo: Repository<Miembro>,
  ) {}

  async create(
    miembroId: number,
    dto: CreateEvaluacionFuncionalDto,
    registradoPorId: number,
  ): Promise<EvaluacionFuncional> {
    const miembro = await this.miembrosRepo.findOneBy({ id: miembroId })
    if (!miembro) throw new NotFoundException('Miembro no encontrado')

    const evaluacion = this.evaluacionRepo.create({
      ...dto,
      miembroId,
      registradoPorId,
    })
    return this.evaluacionRepo.save(evaluacion)
  }

  async findAllByMiembro(miembroId: number): Promise<EvaluacionFuncional[]> {
    return this.evaluacionRepo.find({
      where: { miembroId },
      order: { fecha: 'DESC', createdAt: 'DESC' },
    })
  }

  async findUltimaByMiembro(miembroId: number): Promise<EvaluacionFuncional> {
    const evaluacion = await this.evaluacionRepo.findOne({
      where: { miembroId },
      order: { fecha: 'DESC', createdAt: 'DESC' },
    })
    if (!evaluacion)
      throw new NotFoundException('No hay evaluaciones registradas para este miembro')
    return evaluacion
  }
}
