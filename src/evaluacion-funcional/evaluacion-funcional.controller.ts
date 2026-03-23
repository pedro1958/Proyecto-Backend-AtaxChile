import {
  Body,
  Controller,
  Get,
  Ip,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { EvaluacionFuncionalService } from './evaluacion-funcional.service';
import { CreateEvaluacionFuncionalDto } from './dto/create-evaluacion-funcional.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Rol } from '../users/entities/user.entity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Evaluaciones Funcionales')
@ApiBearerAuth()
@Controller('miembros/:miembroId/evaluaciones')
export class EvaluacionFuncionalController {
  constructor(private readonly service: EvaluacionFuncionalService) {}

  @Post()
  @Roles(Rol.ADMIN, Rol.SECRETARIO)
  @ApiOperation({
    summary: 'Registrar nueva evaluación funcional (append-only)',
    description:
      'Crea un registro inmutable del estado funcional del socio en esta fecha. ' +
      'No se puede modificar ni eliminar. Para corregir un error, registre una nueva evaluación.',
  })
  @ApiParam({ name: 'miembroId', description: 'ID del miembro' })
  @ApiResponse({ status: 201, description: 'Evaluación registrada' })
  @ApiResponse({ status: 404, description: 'Miembro no encontrado' })
  create(
    @Param('miembroId', ParseIntPipe) miembroId: number,
    @Body() dto: CreateEvaluacionFuncionalDto,
    @CurrentUser() user: { id: number },
    @Ip() ip: string,
  ) {
    return this.service.create(miembroId, dto, user.id, ip);
  }

  @Get()
  @Roles(Rol.ADMIN, Rol.SECRETARIO, Rol.TESORERO)
  @ApiOperation({
    summary:
      'Historial completo de evaluaciones funcionales (ordenado por fecha desc)',
  })
  @ApiParam({ name: 'miembroId', description: 'ID del miembro' })
  @ApiResponse({ status: 200, description: 'Lista de evaluaciones' })
  findAll(@Param('miembroId', ParseIntPipe) miembroId: number) {
    return this.service.findAllByMiembro(miembroId);
  }

  @Get('ultima')
  @Roles(Rol.ADMIN, Rol.SECRETARIO, Rol.TESORERO)
  @ApiOperation({
    summary: 'Última evaluación funcional (estado funcional actual del socio)',
  })
  @ApiParam({ name: 'miembroId', description: 'ID del miembro' })
  @ApiResponse({ status: 200, description: 'Evaluación más reciente' })
  @ApiResponse({
    status: 404,
    description: 'No hay evaluaciones para este miembro',
  })
  findUltima(@Param('miembroId', ParseIntPipe) miembroId: number) {
    return this.service.findUltimaByMiembro(miembroId);
  }
}
