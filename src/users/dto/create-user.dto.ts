import { IsEmail, IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator'
import { Rol } from '../entities/user.entity'

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  nombre: string

  @IsEmail()
  email: string

  @IsString()
  @MinLength(8)
  password: string

  @IsEnum(Rol)
  rol: Rol
}
