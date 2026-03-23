import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AccionAudit } from '../entities/audit-log.entity';

export class QueryAuditDto {
  @ApiPropertyOptional({
    enum: AccionAudit,
    description: 'Filtrar por tipo de acción',
  })
  @IsOptional()
  @IsEnum(AccionAudit)
  accion?: AccionAudit;

  @ApiPropertyOptional({
    description: 'Filtrar por nombre de entidad (miembro, usuario, etc.)',
  })
  @IsOptional()
  entidad?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por ID de usuario que realizó la acción',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  usuarioId?: number;

  @ApiPropertyOptional({ description: 'Fecha de inicio del rango (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  desde?: string;

  @ApiPropertyOptional({ description: 'Fecha de fin del rango (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  hasta?: string;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
