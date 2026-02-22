import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator'

export class CreateUserDto {
  @ApiProperty({ example: 'María González', description: 'Nombre completo del usuario' })
  @IsString()
  @IsNotEmpty()
  nombre: string

  @ApiProperty({ example: 'maria@ataxchile.cl', description: 'Correo electrónico único del usuario' })
  @IsEmail()
  email: string

  @ApiProperty({ example: 'MiPassword123', minLength: 8, description: 'Contraseña (mínimo 8 caracteres)' })
  @IsString()
  @MinLength(8)
  password: string
}
