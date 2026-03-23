import { Controller, Get } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Roles } from '../auth/decorators/roles.decorator'
import { Rol } from '../users/entities/user.entity'
import { StatsService } from './stats.service'

@ApiTags('Estadísticas')
@ApiBearerAuth()
@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('resumen')
  @Roles(Rol.ADMIN, Rol.SECRETARIO, Rol.TESORERO)
  @ApiOperation({ summary: 'Panel principal: totales y variaciones recientes' })
  resumen() {
    return this.statsService.resumen()
  }

  @Get('miembros')
  @Roles(Rol.ADMIN, Rol.SECRETARIO)
  @ApiOperation({ summary: 'Distribución de miembros por estado' })
  miembros() {
    return this.statsService.porEstado()
  }

  @Get('diagnosticos')
  @Roles(Rol.ADMIN, Rol.SECRETARIO)
  @ApiOperation({ summary: 'Distribución por tipo de ataxia y confirmación diagnóstica (excluye representantes)' })
  diagnosticos() {
    return this.statsService.porDiagnostico()
  }

  @Get('funcional')
  @Roles(Rol.ADMIN, Rol.SECRETARIO)
  @ApiOperation({ summary: 'Distribución por nivel de movilidad — última evaluación por miembro (excluye representantes)' })
  funcional() {
    return this.statsService.porMovilidad()
  }

  @Get('geografico')
  @Roles(Rol.ADMIN, Rol.SECRETARIO)
  @ApiOperation({ summary: 'Distribución de miembros por región' })
  geografico() {
    return this.statsService.porRegion()
  }
}
