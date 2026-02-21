import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { AtaxiaType, GrupoAtaxia } from './entities/ataxia-type.entity'
import { CreateAtaxiaTypeDto } from './dto/create-ataxia-type.dto'
import { UpdateAtaxiaTypeDto } from './dto/update-ataxia-type.dto'

@Injectable()
export class AtaxiaTypesService {
  constructor(
    @InjectRepository(AtaxiaType)
    private readonly ataxiaTypesRepository: Repository<AtaxiaType>,
  ) {}

  findAll(grupo?: GrupoAtaxia): Promise<AtaxiaType[]> {
    const where = grupo ? { activo: true, grupo } : { activo: true }
    return this.ataxiaTypesRepository.find({
      where,
      order: { grupo: 'ASC', nombre: 'ASC' },
    })
  }

  async findOne(id: number): Promise<AtaxiaType> {
    const tipo = await this.ataxiaTypesRepository.findOneBy({ id })
    if (!tipo) throw new NotFoundException('Tipo de ataxia no encontrado')
    return tipo
  }

  async create(dto: CreateAtaxiaTypeDto): Promise<AtaxiaType> {
    const tipo = this.ataxiaTypesRepository.create(dto)
    return this.ataxiaTypesRepository.save(tipo)
  }

  async update(id: number, dto: UpdateAtaxiaTypeDto): Promise<AtaxiaType> {
    const tipo = await this.ataxiaTypesRepository.findOneBy({ id })
    if (!tipo) throw new NotFoundException('Tipo de ataxia no encontrado')
    Object.assign(tipo, dto)
    return this.ataxiaTypesRepository.save(tipo)
  }

  async toggleStatus(id: number): Promise<AtaxiaType> {
    const tipo = await this.ataxiaTypesRepository.findOneBy({ id })
    if (!tipo) throw new NotFoundException('Tipo de ataxia no encontrado')
    tipo.activo = !tipo.activo
    return this.ataxiaTypesRepository.save(tipo)
  }
}
