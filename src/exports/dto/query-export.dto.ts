import { IsOptional, IsEnum, IsInt, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum FormatoExport {
  CSV = 'csv',
  XLSX = 'xlsx',
  PDF = 'pdf',
}

export class QueryExportDto {
  @ApiPropertyOptional({ enum: FormatoExport, default: FormatoExport.CSV })
  @IsOptional()
  @IsEnum(FormatoExport)
  formato?: FormatoExport = FormatoExport.CSV;

  @ApiPropertyOptional({ example: 'activo' })
  @IsOptional()
  estado?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  regionId?: number;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsInt()
  tipoAtaxiaId?: number;

  @ApiPropertyOptional({ example: '2024-01-01' })
  @IsOptional()
  @IsDateString()
  fechaDesde?: string;

  @ApiPropertyOptional({ example: '2024-12-31' })
  @IsOptional()
  @IsDateString()
  fechaHasta?: string;
}
