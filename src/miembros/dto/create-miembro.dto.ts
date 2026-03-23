import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import {
  IsRutValido,
  TransformRut,
} from '../../common/validators/rut.validator';
import { EstadoCivil, TipoRepresentacion } from '../entities/miembro.entity';

export class CreateMiembroDto {
  @ApiProperty({
    example: '12345678-9',
    description: 'RUT chileno (acepta 12.345.678-9, 123456789, etc.)',
  })
  @TransformRut()
  @IsRutValido()
  rut: string;

  @ApiProperty({ example: 'María González' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(150)
  nombre: string;

  @ApiPropertyOptional({
    example: '1985-03-15',
    description: 'Fecha de nacimiento (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString()
  fechaNacimiento?: string;

  @ApiPropertyOptional({ enum: EstadoCivil })
  @IsOptional()
  @IsEnum(EstadoCivil)
  estadoCivil?: EstadoCivil;

  @ApiPropertyOptional({ example: 'Profesora' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  profesion?: string;

  @ApiPropertyOptional({ example: '+56912345678' })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[\d\s\-()+]{7,20}$/, {
    message: 'Formato de teléfono inválido',
  })
  telefono?: string;

  @ApiPropertyOptional({ example: '+56987654321' })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[\d\s\-()+]{7,20}$/, {
    message: 'Formato de teléfono inválido',
  })
  celular?: string;

  @ApiPropertyOptional({ example: 'maria@correo.cl' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'Av. Providencia 1234' })
  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(255)
  direccion?: string;

  @ApiPropertyOptional({
    description: 'ID de la región (ver GET api/v1/geo/regiones)',
  })
  @IsOptional()
  @IsInt()
  regionId?: number;

  @ApiPropertyOptional({
    description: 'ID de la comuna (ver GET api/v1/geo/comunas)',
  })
  @IsOptional()
  @IsInt()
  comunaId?: number;

  @ApiPropertyOptional({
    description: 'ID del tipo de ataxia (ver GET api/v1/ataxia-types)',
  })
  @IsOptional()
  @IsInt()
  tipoAtaxiaId?: number;

  @ApiPropertyOptional({
    default: false,
    description:
      'false = paciente con ataxia, true = representante (familiar/tutor/cuidador)',
  })
  @IsOptional()
  @IsBoolean()
  esRepresentante?: boolean;

  @ApiPropertyOptional({
    enum: TipoRepresentacion,
    description: 'Obligatorio si esRepresentante = true',
  })
  @ValidateIf((o) => o.esRepresentante === true)
  @IsNotEmpty()
  @IsEnum(TipoRepresentacion)
  tipoRepresentacion?: TipoRepresentacion;

  @ApiPropertyOptional({
    description:
      'ID del miembro representado (si ya está registrado en el sistema)',
  })
  @IsOptional()
  @IsInt()
  representadoId?: number;

  @ApiPropertyOptional({
    description: 'Nombre de la persona representada (si no está registrada)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  representadoNombre?: string;

  @ApiPropertyOptional({
    example: '12345678-9',
    description: 'RUT de la persona representada (si no está registrada)',
  })
  @IsOptional()
  @IsString()
  representadoRut?: string;

  @ApiProperty({
    example: '2024-01-15',
    description: 'Fecha de inscripción como socio (YYYY-MM-DD)',
  })
  @IsDateString()
  fechaInscripcion: string;
}
