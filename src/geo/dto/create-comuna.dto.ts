import { IsInt, IsNotEmpty, IsPositive, IsString } from 'class-validator'

export class CreateComunaDto {
  @IsString()
  @IsNotEmpty()
  nombre: string

  @IsInt()
  @IsPositive()
  regionId: number
}
