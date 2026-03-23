import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { GeoService } from './geo.service';
import { CreateRegionDto } from './dto/create-region.dto';
import { UpdateRegionDto } from './dto/update-region.dto';
import { CreateComunaDto } from './dto/create-comuna.dto';
import { UpdateComunaDto } from './dto/update-comuna.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Rol } from '../users/entities/user.entity';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Geografía')
@Controller('geo')
export class GeoController {
  constructor(private readonly geoService: GeoService) {}

  // ── Regiones ─────────────────────────────────────────────────────────────

  @Public()
  @Get('regiones')
  @ApiOperation({ summary: 'Listar todas las regiones de Chile' })
  @ApiResponse({ status: 200, description: 'Lista de regiones' })
  findAllRegiones() {
    return this.geoService.findAllRegiones();
  }

  @Public()
  @Get('regiones/:id')
  @ApiOperation({ summary: 'Obtener una región por ID' })
  @ApiParam({ name: 'id', description: 'ID de la región' })
  @ApiResponse({ status: 200, description: 'Datos de la región' })
  @ApiResponse({ status: 404, description: 'Región no encontrada' })
  findOneRegion(@Param('id', ParseIntPipe) id: number) {
    return this.geoService.findOneRegion(id);
  }

  @Roles(Rol.SUPERADMIN, Rol.ADMIN)
  @Post('regiones')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear una nueva región' })
  @ApiResponse({ status: 201, description: 'Región creada' })
  @ApiResponse({
    status: 403,
    description: 'Sin permisos (requiere superadmin o admin)',
  })
  @ApiResponse({
    status: 409,
    description: 'Ya existe una región con ese nombre',
  })
  createRegion(@Body() dto: CreateRegionDto) {
    return this.geoService.createRegion(dto);
  }

  @Roles(Rol.SUPERADMIN, Rol.ADMIN)
  @Patch('regiones/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Modificar el nombre de una región' })
  @ApiParam({ name: 'id', description: 'ID de la región' })
  @ApiResponse({ status: 200, description: 'Región actualizada' })
  @ApiResponse({
    status: 403,
    description: 'Sin permisos (requiere superadmin o admin)',
  })
  @ApiResponse({ status: 404, description: 'Región no encontrada' })
  updateRegion(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRegionDto,
  ) {
    return this.geoService.updateRegion(id, dto);
  }

  // ── Comunas ───────────────────────────────────────────────────────────────

  @Public()
  @Get('regiones/:regionId/comunas')
  @ApiOperation({ summary: 'Listar comunas de una región' })
  @ApiParam({ name: 'regionId', description: 'ID de la región' })
  @ApiResponse({ status: 200, description: 'Lista de comunas de la región' })
  @ApiResponse({ status: 404, description: 'Región no encontrada' })
  findComunasByRegion(@Param('regionId', ParseIntPipe) regionId: number) {
    return this.geoService.findComunasByRegion(regionId);
  }

  @Public()
  @Get('comunas/:id')
  @ApiOperation({ summary: 'Obtener una comuna por ID' })
  @ApiParam({ name: 'id', description: 'ID de la comuna' })
  @ApiResponse({ status: 200, description: 'Datos de la comuna' })
  @ApiResponse({ status: 404, description: 'Comuna no encontrada' })
  findOneComuna(@Param('id', ParseIntPipe) id: number) {
    return this.geoService.findOneComuna(id);
  }

  @Roles(Rol.SUPERADMIN, Rol.ADMIN)
  @Post('comunas')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear una nueva comuna' })
  @ApiResponse({ status: 201, description: 'Comuna creada' })
  @ApiResponse({
    status: 403,
    description: 'Sin permisos (requiere superadmin o admin)',
  })
  @ApiResponse({ status: 404, description: 'Región asociada no encontrada' })
  createComuna(@Body() dto: CreateComunaDto) {
    return this.geoService.createComuna(dto);
  }

  @Roles(Rol.SUPERADMIN, Rol.ADMIN)
  @Patch('comunas/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Modificar nombre o región de una comuna' })
  @ApiParam({ name: 'id', description: 'ID de la comuna' })
  @ApiResponse({ status: 200, description: 'Comuna actualizada' })
  @ApiResponse({
    status: 403,
    description: 'Sin permisos (requiere superadmin o admin)',
  })
  @ApiResponse({ status: 404, description: 'Comuna no encontrada' })
  updateComuna(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateComunaDto,
  ) {
    return this.geoService.updateComuna(id, dto);
  }
}
