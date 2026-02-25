import { ApiProperty } from '@nestjs/swagger'
import { IsInt, IsPositive } from 'class-validator'

export class VincularUsuarioDto {
  @ApiProperty({ description: 'ID del usuario a vincular con este miembro' })
  @IsInt()
  @IsPositive()
  userId: number
}
