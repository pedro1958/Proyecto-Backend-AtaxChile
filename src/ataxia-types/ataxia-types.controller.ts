import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AtaxiaTypesService } from './ataxia-types.service';
import { CreateAtaxiaTypeDto } from './dto/create-ataxia-type.dto';
import { UpdateAtaxiaTypeDto } from './dto/update-ataxia-type.dto';
import { GrupoAtaxia } from './entities/ataxia-type.entity';
import { Roles } from '../auth/decorators/roles.decorator';
import { Rol } from '../users/entities/user.entity';

@ApiTags('Tipos de Ataxia')
@ApiBearerAuth()
@Controller('ataxia-types')
export class AtaxiaTypesController {
  constructor(private readonly ataxiaTypesService: AtaxiaTypesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar tipos de ataxia activos del catálogo' })
  @ApiQuery({
    name: 'grupo',
    enum: GrupoAtaxia,
    required: false,
    description: 'Filtrar por grupo de ataxia',
  })
  @ApiResponse({ status: 200, description: 'Lista de tipos de ataxia' })
  findAll(@Query('grupo') grupo?: GrupoAtaxia) {
    return this.ataxiaTypesService.findAll(grupo);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un tipo de ataxia por ID' })
  @ApiParam({ name: 'id', description: 'ID del tipo de ataxia' })
  @ApiResponse({ status: 200, description: 'Detalle del tipo de ataxia' })
  @ApiResponse({ status: 404, description: 'Tipo de ataxia no encontrado' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ataxiaTypesService.findOne(id);
  }

  @Roles(Rol.SUPERADMIN, Rol.ADMIN)
  @Post()
  @ApiOperation({ summary: 'Agregar un tipo de ataxia al catálogo' })
  @ApiResponse({ status: 201, description: 'Tipo de ataxia creado' })
  @ApiResponse({
    status: 403,
    description: 'Sin permisos (requiere superadmin o admin)',
  })
  create(@Body() dto: CreateAtaxiaTypeDto) {
    return this.ataxiaTypesService.create(dto);
  }

  @Roles(Rol.SUPERADMIN, Rol.ADMIN)
  @Patch(':id')
  @ApiOperation({
    summary: 'Modificar nombre, grupo o descripción de un tipo de ataxia',
  })
  @ApiParam({ name: 'id', description: 'ID del tipo de ataxia' })
  @ApiResponse({ status: 200, description: 'Tipo de ataxia actualizado' })
  @ApiResponse({
    status: 403,
    description: 'Sin permisos (requiere superadmin o admin)',
  })
  @ApiResponse({ status: 404, description: 'Tipo de ataxia no encontrado' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAtaxiaTypeDto,
  ) {
    return this.ataxiaTypesService.update(id, dto);
  }

  @Roles(Rol.SUPERADMIN, Rol.ADMIN)
  @Patch(':id/status')
  @ApiOperation({
    summary: 'Activar o desactivar un tipo de ataxia (soft delete)',
  })
  @ApiParam({ name: 'id', description: 'ID del tipo de ataxia' })
  @ApiResponse({ status: 200, description: 'Estado actualizado' })
  @ApiResponse({
    status: 403,
    description: 'Sin permisos (requiere superadmin o admin)',
  })
  @ApiResponse({ status: 404, description: 'Tipo de ataxia no encontrado' })
  toggleStatus(@Param('id', ParseIntPipe) id: number) {
    return this.ataxiaTypesService.toggleStatus(id);
  }
}
