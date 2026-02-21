import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator'
import { GrupoAtaxia } from '../entities/ataxia-type.entity'

export class CreateAtaxiaTypeDto {
  @IsString()
  @IsNotEmpty()
  nombre: string

  @IsEnum(GrupoAtaxia)
  grupo: GrupoAtaxia

  @IsString()
  @IsOptional()
  descripcion?: string
}
