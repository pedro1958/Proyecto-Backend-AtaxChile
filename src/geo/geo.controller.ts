import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common'
import { GeoService } from './geo.service'
import { CreateRegionDto } from './dto/create-region.dto'
import { UpdateRegionDto } from './dto/update-region.dto'
import { CreateComunaDto } from './dto/create-comuna.dto'
import { UpdateComunaDto } from './dto/update-comuna.dto'
import { Roles } from '../auth/decorators/roles.decorator'
import { Rol } from '../users/entities/user.entity'
import { Public } from '../auth/decorators/public.decorator'

@Controller('geo')
export class GeoController {
  constructor(private readonly geoService: GeoService) {}

  // ── Regiones ─────────────────────────────────────────────────────────────

  @Public()
  @Get('regiones')
  findAllRegiones() {
    return this.geoService.findAllRegiones()
  }

  @Public()
  @Get('regiones/:id')
  findOneRegion(@Param('id', ParseIntPipe) id: number) {
    return this.geoService.findOneRegion(id)
  }

  @Roles(Rol.SUPERADMIN, Rol.ADMIN)
  @Post('regiones')
  createRegion(@Body() dto: CreateRegionDto) {
    return this.geoService.createRegion(dto)
  }

  @Roles(Rol.SUPERADMIN, Rol.ADMIN)
  @Patch('regiones/:id')
  updateRegion(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRegionDto) {
    return this.geoService.updateRegion(id, dto)
  }

  // ── Comunas ───────────────────────────────────────────────────────────────

  @Public()
  @Get('regiones/:regionId/comunas')
  findComunasByRegion(@Param('regionId', ParseIntPipe) regionId: number) {
    return this.geoService.findComunasByRegion(regionId)
  }

  @Public()
  @Get('comunas/:id')
  findOneComuna(@Param('id', ParseIntPipe) id: number) {
    return this.geoService.findOneComuna(id)
  }

  @Roles(Rol.SUPERADMIN, Rol.ADMIN)
  @Post('comunas')
  createComuna(@Body() dto: CreateComunaDto) {
    return this.geoService.createComuna(dto)
  }

  @Roles(Rol.SUPERADMIN, Rol.ADMIN)
  @Patch('comunas/:id')
  updateComuna(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateComunaDto) {
    return this.geoService.updateComuna(id, dto)
  }
}
