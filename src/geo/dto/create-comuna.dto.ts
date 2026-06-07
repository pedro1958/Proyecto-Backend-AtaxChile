import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsPositive, IsString, MaxLength } from 'class-validator';

export class CreateComunaDto {
  @ApiProperty({
    example: 'Providencia',
    description: 'Nombre oficial de la comuna',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre: string;

  @ApiProperty({
    example: 13,
    description: 'ID de la región a la que pertenece la comuna',
  })
  @IsInt()
  @IsPositive()
  regionId: number;
}
