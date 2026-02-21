import { IsEnum } from 'class-validator'
import { Rol } from '../entities/user.entity'

export class UpdateRolDto {
  @IsEnum(Rol)
  rol: Rol
}
