import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Region } from './entities/region.entity';
import { Comuna } from './entities/comuna.entity';
import { CreateRegionDto } from './dto/create-region.dto';
import { UpdateRegionDto } from './dto/update-region.dto';
import { CreateComunaDto } from './dto/create-comuna.dto';
import { UpdateComunaDto } from './dto/update-comuna.dto';

@Injectable()
export class GeoService {
  constructor(
    @InjectRepository(Region)
    private readonly regionesRepository: Repository<Region>,
    @InjectRepository(Comuna)
    private readonly comunasRepository: Repository<Comuna>,
  ) {}

  // ── Regiones ─────────────────────────────────────────────────────────────

  findAllRegiones(): Promise<Region[]> {
    return this.regionesRepository.find({ order: { nombre: 'ASC' } });
  }

  async findOneRegion(id: number): Promise<Region> {
    const region = await this.regionesRepository.findOne({
      where: { id },
      relations: ['comunas'],
      order: { comunas: { nombre: 'ASC' } },
    });
    if (!region) throw new NotFoundException('Región no encontrada');
    return region;
  }

  async createRegion(dto: CreateRegionDto): Promise<Region> {
    const region = this.regionesRepository.create(dto);
    return this.regionesRepository.save(region);
  }

  async updateRegion(id: number, dto: UpdateRegionDto): Promise<Region> {
    const region = await this.regionesRepository.findOneBy({ id });
    if (!region) throw new NotFoundException('Región no encontrada');
    Object.assign(region, dto);
    return this.regionesRepository.save(region);
  }

  // ── Comunas ───────────────────────────────────────────────────────────────

  async findComunasByRegion(regionId: number): Promise<Comuna[]> {
    const region = await this.regionesRepository.findOneBy({ id: regionId });
    if (!region) throw new NotFoundException('Región no encontrada');
    return this.comunasRepository.find({
      where: { regionId },
      order: { nombre: 'ASC' },
    });
  }

  async findOneComuna(id: number): Promise<Comuna> {
    const comuna = await this.comunasRepository.findOne({
      where: { id },
      relations: ['region'],
    });
    if (!comuna) throw new NotFoundException('Comuna no encontrada');
    return comuna;
  }

  async createComuna(dto: CreateComunaDto): Promise<Comuna> {
    const region = await this.regionesRepository.findOneBy({
      id: dto.regionId,
    });
    if (!region) throw new NotFoundException('Región no encontrada');
    const comuna = this.comunasRepository.create(dto);
    return this.comunasRepository.save(comuna);
  }

  async updateComuna(id: number, dto: UpdateComunaDto): Promise<Comuna> {
    const comuna = await this.comunasRepository.findOneBy({ id });
    if (!comuna) throw new NotFoundException('Comuna no encontrada');
    if (dto.regionId !== undefined) {
      const region = await this.regionesRepository.findOneBy({
        id: dto.regionId,
      });
      if (!region) throw new NotFoundException('Región no encontrada');
    }
    Object.assign(comuna, dto);
    return this.comunasRepository.save(comuna);
  }
}
