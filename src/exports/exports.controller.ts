import {
  Controller,
  Get,
  Query,
  Param,
  ParseIntPipe,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Rol } from '../users/entities/user.entity';
import { ExportsService } from './exports.service';
import { QueryExportDto } from './dto/query-export.dto';

@ApiTags('Exportaciones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('exports')
export class ExportsController {
  constructor(private readonly exportsService: ExportsService) {}

  @Get('miembros')
  @Roles(Rol.ADMIN, Rol.SECRETARIO, Rol.TESORERO)
  @ApiOperation({ summary: 'Exportar lista de miembros (CSV/XLSX/PDF)' })
  @ApiResponse({ status: 200, description: 'Archivo de exportación' })
  async exportMiembros(
    @Query() query: QueryExportDto,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    const archivo = await this.exportsService.generarArchivo(query, user);

    res.set({
      'Content-Type': archivo.mimeType,
      'Content-Disposition': `attachment; filename="${archivo.filename}"`,
    });

    res.end(archivo.buffer);
  }

  @Get('miembros/:id/evaluaciones')
  @Roles(Rol.ADMIN, Rol.SECRETARIO)
  @ApiOperation({
    summary: 'Exportar ficha individual con historial de evaluaciones (PDF)',
  })
  @ApiResponse({ status: 200, description: 'Archivo PDF' })
  @ApiResponse({
    status: 403,
    description: 'Sin permisos (tesorero no tiene acceso)',
  })
  async exportFichaIndividual(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    const archivo = await this.exportsService.generarFichaIndividual(id, user);

    res.set({
      'Content-Type': archivo.mimeType,
      'Content-Disposition': `attachment; filename="${archivo.filename}"`,
    });

    res.end(archivo.buffer);
  }
}
