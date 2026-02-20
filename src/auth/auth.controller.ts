import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common'
import { AuthService } from './auth.service'
import { UsersService } from '../users/users.service'
import { LoginDto } from './dto/login.dto'
import { ForgotPasswordDto } from '../users/dto/forgot-password.dto'
import { ResetPasswordDto } from '../users/dto/reset-password.dto'
import { Public } from './decorators/public.decorator'

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto)
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.usersService.solicitarRecuperacion(dto.email)
    return {
      message:
        'Si el correo existe, recibirás instrucciones para recuperar tu contraseña',
    }
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.usersService.restablecerPassword(dto.token, dto.nuevaPassword)
    return { message: 'Contraseña restablecida correctamente' }
  }
}
