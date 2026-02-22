import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString, MinLength } from 'class-validator'

export class ChangePasswordDto {
  @ApiProperty({ description: 'Contraseña actual del usuario' })
  @IsString()
  @IsNotEmpty()
  passwordActual: string

  @ApiProperty({ example: 'NuevoPassword123', minLength: 8, description: 'Nueva contraseña' })
  @IsString()
  @MinLength(8)
  nuevaPassword: string
}
