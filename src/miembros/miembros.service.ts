import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { DataSource, Repository } from 'typeorm'
import { Miembro, EstadoSocio } from './entities/miembro.entity'
import { CreateMiembroDto } from './dto/create-miembro.dto'
import { UpdateMiembroDto } from './dto/update-miembro.dto'
import { UpdateEstadoDto } from './dto/update-estado.dto'
import { PaginatedResult } from '../common/types/response.types'

@Injectable()
export class MiembrosService {
  constructor(
    @InjectRepository(Miembro)
    private readonly miembrosRepository: Repository<Miembro>,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateMiembroDto): Promise<Miembro> {
    const existe = await this.miembrosRepository.findOneBy({ rut: dto.rut })
    if (existe) throw new ConflictException('Ya existe un miembro con este RUT')

    const miembro = this.miembrosRepository.create({
      ...dto,
      estado: EstadoSocio.ACTIVO,
      fechaCambioEstado: null,
    })
    return this.miembrosRepository.save(miembro)
  }

  async findAll(
    estado?: EstadoSocio,
    pagination: { page?: number; limit?: number } = {},
  ): Promise<PaginatedResult<Miembro>> {
    const page = pagination.page ?? 1
    const limit = pagination.limit ?? 20
    const where = estado ? { estado } : {}

    const [data, total] = await this.miembrosRepository.findAndCount({
      where,
      relations: ['region', 'comuna', 'tipoAtaxia'],
      order: { nombre: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    })

    return { data, total, page, limit }
  }

  async findOne(id: number): Promise<Miembro> {
    const miembro = await this.miembrosRepository.findOne({
      where: { id },
      relations: ['region', 'comuna', 'tipoAtaxia', 'user'],
    })
    if (!miembro) throw new NotFoundException('Miembro no encontrado')
    return miembro
  }

  async update(id: number, dto: UpdateMiembroDto): Promise<Miembro> {
    const miembro = await this.miembrosRepository.findOneBy({ id })
    if (!miembro) throw new NotFoundException('Miembro no encontrado')
    Object.assign(miembro, dto)
    return this.miembrosRepository.save(miembro)
  }

  async updateEstado(id: number, dto: UpdateEstadoDto): Promise<Miembro> {
    const miembro = await this.miembrosRepository.findOneBy({ id })
    if (!miembro) throw new NotFoundException('Miembro no encontrado')
    miembro.estado = dto.estado
    miembro.fechaCambioEstado = new Date().toISOString().split('T')[0]
    return this.miembrosRepository.save(miembro)
  }

  async vincularUsuario(id: number, userId: number): Promise<Miembro> {
    return this.dataSource.transaction(async (manager) => {
      const miembro = await manager.findOneBy(Miembro, { id })
      if (!miembro) throw new NotFoundException('Miembro no encontrado')

      const yaVinculado = await manager.findOneBy(Miembro, { userId })
      if (yaVinculado && yaVinculado.id !== id)
        throw new ConflictException('Este usuario ya está vinculado a otro miembro')

      miembro.userId = userId
      return manager.save(miembro)
    })
  }
}
