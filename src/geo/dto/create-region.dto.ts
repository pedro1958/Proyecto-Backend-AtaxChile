import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateRegionDto {
  @ApiProperty({
    example: 'Región Metropolitana de Santiago',
    description: 'Nombre oficial de la región',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre: string;
}
