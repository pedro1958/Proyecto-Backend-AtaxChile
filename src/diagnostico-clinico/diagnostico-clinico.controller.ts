import {
  Body,
  Controller,
  Get,
  Ip,
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
import { DiagnosticoClinicoService } from './diagnostico-clinico.service';
import { CreateDiagnosticoClinicoDto } from './dto/create-diagnostico-clinico.dto';
import { UpdateDiagnosticoClinicoDto } from './dto/update-diagnostico-clinico.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Rol } from '../users/entities/user.entity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Diagnóstico Clínico')
@ApiBearerAuth()
@Controller('miembros/:miembroId/diagnostico')
export class DiagnosticoClinicoController {
  constructor(private readonly service: DiagnosticoClinicoService) {}

  @Post()
  @Roles(Rol.ADMIN, Rol.SECRETARIO)
  @ApiOperation({ summary: 'Registrar diagnóstico clínico del socio' })
  @ApiParam({ name: 'miembroId', description: 'ID del miembro' })
  @ApiResponse({ status: 201, description: 'Diagnóstico registrado' })
  @ApiResponse({ status: 404, description: 'Miembro no encontrado' })
  @ApiResponse({
    status: 409,
    description: 'Ya existe un diagnóstico — use PATCH para actualizar',
  })
  create(
    @Param('miembroId', ParseIntPipe) miembroId: number,
    @Body() dto: CreateDiagnosticoClinicoDto,
    @CurrentUser() user: { id: number },
    @Ip() ip: string,
  ) {
    return this.service.create(miembroId, dto, user.id, ip);
  }

  @Get()
  @Roles(Rol.ADMIN, Rol.SECRETARIO, Rol.TESORERO)
  @ApiOperation({ summary: 'Obtener diagnóstico clínico del socio' })
  @ApiParam({ name: 'miembroId', description: 'ID del miembro' })
  @ApiResponse({ status: 200, description: 'Diagnóstico del socio' })
  @ApiResponse({ status: 404, description: 'Diagnóstico no encontrado' })
  findByMiembro(@Param('miembroId', ParseIntPipe) miembroId: number) {
    return this.service.findByMiembro(miembroId);
  }

  @Patch()
  @Roles(Rol.ADMIN, Rol.SECRETARIO)
  @ApiOperation({ summary: 'Actualizar diagnóstico clínico del socio' })
  @ApiParam({ name: 'miembroId', description: 'ID del miembro' })
  @ApiResponse({ status: 200, description: 'Diagnóstico actualizado' })
  @ApiResponse({ status: 404, description: 'Diagnóstico no encontrado' })
  update(
    @Param('miembroId', ParseIntPipe) miembroId: number,
    @Body() dto: UpdateDiagnosticoClinicoDto,
    @CurrentUser() user: { id: number },
    @Ip() ip: string,
  ) {
    return this.service.update(miembroId, dto, user.id, ip);
  }
}
