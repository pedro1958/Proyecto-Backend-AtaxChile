import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { MiembrosService } from './miembros.service'
import { CreateMiembroDto } from './dto/create-miembro.dto'
import { UpdateMiembroDto } from './dto/update-miembro.dto'
import { UpdateEstadoDto } from './dto/update-estado.dto'
import { VincularUsuarioDto } from './dto/vincular-usuario.dto'
import { EstadoSocio } from './entities/miembro.entity'
import { Roles } from '../auth/decorators/roles.decorator'
import { Rol } from '../users/entities/user.entity'
import { PaginationDto } from '../common/dto/pagination.dto'

@ApiTags('Miembros')
@ApiBearerAuth()
@Controller('miembros')
export class MiembrosController {
  constructor(private readonly miembrosService: MiembrosService) {}

  @Post()
  @Roles(Rol.ADMIN, Rol.SECRETARIO)
  @ApiOperation({ summary: 'Registrar nuevo socio' })
  @ApiResponse({ status: 201, description: 'Socio registrado correctamente' })
  @ApiResponse({ status: 409, description: 'Ya existe un miembro con este RUT' })
  create(@Body() dto: CreateMiembroDto) {
    return this.miembrosService.create(dto)
  }

  @Get()
  @Roles(Rol.ADMIN, Rol.SECRETARIO, Rol.TESORERO)
  @ApiOperation({ summary: 'Listar socios' })
  @ApiQuery({ name: 'estado', enum: EstadoSocio, required: false, description: 'Filtrar por estado del socio' })
  @ApiQuery({ name: 'page', required: false, description: 'Número de página (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Registros por página (default: 20, máx: 100)' })
  @ApiResponse({ status: 200, description: 'Lista paginada de socios' })
  findAll(
    @Query('estado') estado?: EstadoSocio,
    @Query() pagination?: PaginationDto,
  ) {
    return this.miembrosService.findAll(estado, pagination)
  }

  @Get(':id')
  @Roles(Rol.ADMIN, Rol.SECRETARIO)
  @ApiOperation({ summary: 'Obtener detalle de un socio' })
  @ApiParam({ name: 'id', description: 'ID del miembro' })
  @ApiResponse({ status: 200, description: 'Datos del socio' })
  @ApiResponse({ status: 404, description: 'Miembro no encontrado' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.miembrosService.findOne(id)
  }

  @Patch(':id')
  @Roles(Rol.ADMIN, Rol.SECRETARIO)
  @ApiOperation({ summary: 'Actualizar datos del socio' })
  @ApiParam({ name: 'id', description: 'ID del miembro' })
  @ApiResponse({ status: 200, description: 'Datos actualizados' })
  @ApiResponse({ status: 404, description: 'Miembro no encontrado' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMiembroDto,
  ) {
    return this.miembrosService.update(id, dto)
  }

  @Patch(':id/estado')
  @Roles(Rol.ADMIN)
  @ApiOperation({ summary: 'Cambiar estado del socio (baja, suspensión, fallecimiento)' })
  @ApiParam({ name: 'id', description: 'ID del miembro' })
  @ApiResponse({ status: 200, description: 'Estado actualizado' })
  @ApiResponse({ status: 404, description: 'Miembro no encontrado' })
  updateEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEstadoDto,
  ) {
    return this.miembrosService.updateEstado(id, dto)
  }

  @Patch(':id/vincular-usuario')
  @HttpCode(HttpStatus.OK)
  @Roles(Rol.ADMIN)
  @ApiOperation({ summary: 'Vincular cuenta de sistema a un socio' })
  @ApiParam({ name: 'id', description: 'ID del miembro' })
  @ApiResponse({ status: 200, description: 'Usuario vinculado correctamente' })
  @ApiResponse({ status: 404, description: 'Miembro no encontrado' })
  @ApiResponse({ status: 409, description: 'El usuario ya está vinculado a otro miembro' })
  vincularUsuario(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: VincularUsuarioDto,
  ) {
    return this.miembrosService.vincularUsuario(id, dto.userId)
  }
}
