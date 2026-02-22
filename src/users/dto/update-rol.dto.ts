import { ApiProperty } from '@nestjs/swagger'
import { IsEnum } from 'class-validator'
import { Rol } from '../entities/user.entity'

export class UpdateRolDto {
  @ApiProperty({ enum: Rol, example: Rol.ADMIN, description: 'Nuevo rol a asignar al usuario' })
  @IsEnum(Rol)
  rol: Rol
}
