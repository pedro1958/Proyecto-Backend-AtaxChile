import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { EstadoSocio } from '../entities/miembro.entity';

export class UpdateEstadoDto {
  @ApiProperty({ enum: EstadoSocio, description: 'Nuevo estado del socio' })
  @IsEnum(EstadoSocio)
  estado: EstadoSocio;
}
