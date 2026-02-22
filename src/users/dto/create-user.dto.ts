import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator'
import { Rol } from '../entities/user.entity'

export class CreateUserDto {
  @ApiProperty({ example: 'María González', description: 'Nombre completo del usuario administrativo' })
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

  @ApiProperty({ enum: Rol, example: Rol.SECRETARIO, description: 'Rol del usuario en el sistema' })
  @IsEnum(Rol)
  rol: Rol
}
