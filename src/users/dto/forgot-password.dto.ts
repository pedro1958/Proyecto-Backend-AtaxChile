import { ApiProperty } from '@nestjs/swagger'
import { IsEmail } from 'class-validator'

export class ForgotPasswordDto {
  @ApiProperty({ example: 'usuario@ataxchile.cl', description: 'Correo electrónico registrado' })
  @IsEmail()
  email: string
}
