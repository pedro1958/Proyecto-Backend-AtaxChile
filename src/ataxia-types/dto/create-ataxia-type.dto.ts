import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator'
import { GrupoAtaxia } from '../entities/ataxia-type.entity'

export class CreateAtaxiaTypeDto {
  @ApiProperty({ example: 'SCA1 (Ataxia Espinocerebelosa tipo 1)', description: 'Nombre clínico del tipo de ataxia' })
  @IsString()
  @IsNotEmpty()
  nombre: string

  @ApiProperty({ enum: GrupoAtaxia, example: GrupoAtaxia.HEREDITARIA, description: 'Grupo de clasificación del tipo de ataxia' })
  @IsEnum(GrupoAtaxia)
  grupo: GrupoAtaxia

  @ApiPropertyOptional({ example: 'Ataxia autosómica dominante por expansión CAG en el gen ATXN1.', description: 'Descripción clínica opcional' })
  @IsString()
  @IsOptional()
  descripcion?: string
}
