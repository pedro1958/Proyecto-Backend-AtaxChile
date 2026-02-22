import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsString, MinLength } from 'class-validator'

export class LoginDto {
  @ApiProperty({ example: 'admin@ataxchile.cl', description: 'Correo electrónico del usuario' })
  @IsEmail()
  email: string

  @ApiProperty({ example: 'MiPassword123', minLength: 8, description: 'Contraseña del usuario' })
  @IsString()
  @MinLength(8)
  password: string
}
