import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ConfirmacionDiagnostico } from '../entities/diagnostico-clinico.entity';

export class CreateDiagnosticoClinicoDto {
  @ApiPropertyOptional({
    description: 'ID del tipo de ataxia (ver GET /ataxia-types)',
  })
  @IsOptional()
  @IsInt()
  tipoAtaxiaId?: number;

  @ApiPropertyOptional({
    example: 'SCA2',
    description: 'Subtipo específico (ej: SCA1, SCA2, Friedreich, ARSACS)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  subtipo?: string;

  @ApiPropertyOptional({
    enum: ConfirmacionDiagnostico,
    default: ConfirmacionDiagnostico.CLINICO,
  })
  @IsOptional()
  @IsEnum(ConfirmacionDiagnostico)
  confirmacion?: ConfirmacionDiagnostico;

  @ApiPropertyOptional({
    example: '2018-06-15',
    description: 'Fecha del diagnóstico (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString()
  fechaDiagnostico?: string;

  @ApiPropertyOptional({ example: 'Hospital del Salvador' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  institucion?: string;

  @ApiPropertyOptional({ example: 'Dr. Juan Pérez' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  medico?: string;

  @ApiPropertyOptional({
    example:
      'Diagnóstico genético confirmado SCA2, estudio familiar en proceso',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observaciones?: string;
}
