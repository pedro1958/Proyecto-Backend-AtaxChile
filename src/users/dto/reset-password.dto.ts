import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString, MinLength } from 'class-validator'

export class ResetPasswordDto {
  @ApiProperty({ description: 'Token recibido por correo electrónico para restablecer contraseña' })
  @IsString()
  @IsNotEmpty()
  token: string

  @ApiProperty({ example: 'NuevoPassword123', minLength: 8, description: 'Nueva contraseña' })
  @IsString()
  @MinLength(8)
  nuevaPassword: string
}
