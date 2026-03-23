import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { QueryAuditDto } from './dto/query-audit.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Rol } from '../users/entities/user.entity';

@ApiTags('Auditoría')
@ApiBearerAuth()
@Controller('audit-logs')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles(Rol.SUPERADMIN)
  @ApiOperation({ summary: 'Listar registros de auditoría (solo SUPERADMIN)' })
  @ApiResponse({
    status: 200,
    description: 'Lista paginada de eventos de auditoría',
  })
  @ApiResponse({
    status: 403,
    description: 'Sin permisos (requiere superadmin)',
  })
  findAll(@Query() query: QueryAuditDto) {
    return this.auditService.findAll(query);
  }

  @Get(':id')
  @Roles(Rol.SUPERADMIN)
  @ApiOperation({
    summary: 'Obtener detalle de un evento de auditoría (solo SUPERADMIN)',
  })
  @ApiResponse({ status: 200, description: 'Evento de auditoría' })
  @ApiResponse({ status: 404, description: 'Registro no encontrado' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.auditService.findOne(id);
  }
}
