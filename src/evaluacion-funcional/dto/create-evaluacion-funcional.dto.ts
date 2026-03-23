import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { NivelMovilidad } from '../entities/evaluacion-funcional.entity';

export class CreateEvaluacionFuncionalDto {
  @ApiProperty({
    example: '2025-03-15',
    description: 'Fecha en que se realizó la evaluación (YYYY-MM-DD)',
  })
  @IsDateString()
  fecha: string;

  @ApiProperty({
    enum: NivelMovilidad,
    description: 'Nivel de movilidad actual del socio',
  })
  @IsEnum(NivelMovilidad)
  nivelMovilidad: NivelMovilidad;

  @ApiPropertyOptional({
    example: 24,
    description:
      'Puntuación Escala SARA (0–40). 0 = sin afectación, 40 = máxima afectación',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(40)
  puntuacionSara?: number;

  @ApiPropertyOptional({
    default: false,
    description: 'Dificultad para hablar (disartria)',
  })
  @IsOptional()
  @IsBoolean()
  disartria?: boolean;

  @ApiPropertyOptional({
    default: false,
    description: 'Dificultad para tragar (disfagia)',
  })
  @IsOptional()
  @IsBoolean()
  disfagia?: boolean;

  @ApiPropertyOptional({
    default: false,
    description: 'Movimiento involuntario de ojos (nistagmo)',
  })
  @IsOptional()
  @IsBoolean()
  nistagmo?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  tieneCuidador?: boolean;

  @ApiPropertyOptional({ example: 'Ana González' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  nombreCuidador?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observaciones?: string;
}
