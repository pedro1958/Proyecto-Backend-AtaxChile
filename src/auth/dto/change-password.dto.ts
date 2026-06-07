import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ description: 'Contraseña actual del usuario' })
  @IsString()
  @IsNotEmpty()
  passwordActual: string;

  @ApiProperty({
    example: 'NuevoPassword123',
    minLength: 8,
    description: 'Nueva contraseña (mínimo 8 caracteres, una mayúscula, una minúscula y un número)',
  })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, {
    message: 'La contraseña debe tener al menos una mayúscula, una minúscula y un número',
  })
  nuevaPassword: string;
}
