import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Miembro, EstadoSocio } from './entities/miembro.entity'
import { CreateMiembroDto } from './dto/create-miembro.dto'
import { UpdateMiembroDto } from './dto/update-miembro.dto'
import { UpdateEstadoDto } from './dto/update-estado.dto'

@Injectable()
export class MiembrosService {
  constructor(
    @InjectRepository(Miembro)
    private readonly miembrosRepository: Repository<Miembro>,
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

  async findAll(estado?: EstadoSocio): Promise<Miembro[]> {
    const where = estado ? { estado } : {}
    return this.miembrosRepository.find({
      where,
      relations: ['region', 'comuna', 'tipoAtaxia'],
      order: { nombre: 'ASC' },
    })
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
    const miembro = await this.miembrosRepository.findOneBy({ id })
    if (!miembro) throw new NotFoundException('Miembro no encontrado')

    const yaVinculado = await this.miembrosRepository.findOneBy({ userId })
    if (yaVinculado && yaVinculado.id !== id)
      throw new ConflictException('Este usuario ya está vinculado a otro miembro')

    miembro.userId = userId
    return this.miembrosRepository.save(miembro)
  }
}
