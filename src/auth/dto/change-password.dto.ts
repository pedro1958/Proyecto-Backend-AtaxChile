import { IsNotEmpty, IsString, MinLength } from 'class-validator'

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  passwordActual: string

  @IsString()
  @MinLength(8)
  nuevaPassword: string
}
