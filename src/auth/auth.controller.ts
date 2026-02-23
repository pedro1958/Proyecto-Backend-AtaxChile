import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { Throttle } from '@nestjs/throttler'
import { AuthService } from './auth.service'
import { UsersService } from '../users/users.service'
import { LoginDto } from './dto/login.dto'
import { ForgotPasswordDto } from '../users/dto/forgot-password.dto'
import { ResetPasswordDto } from '../users/dto/reset-password.dto'
import { ChangePasswordDto } from './dto/change-password.dto'
import { RefreshDto } from './dto/refresh.dto'
import { Public } from './decorators/public.decorator'
import { CurrentUser } from './decorators/current-user.decorator'

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ global: { ttl: 60_000, limit: 5 } }) // 5 intentos por minuto (brute force)
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiResponse({ status: 200, description: 'Retorna access_token (15 min) y refresh_token (7 días)' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas o cuenta inactiva' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto)
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ global: { ttl: 60_000, limit: 10 } }) // 10 renovaciones por minuto
  @ApiOperation({ summary: 'Renovar access token' })
  @ApiResponse({ status: 200, description: 'Retorna nuevo access_token' })
  @ApiResponse({ status: 401, description: 'Refresh token inválido o expirado' })
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refresh_token)
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cerrar sesión' })
  @ApiResponse({ status: 204, description: 'Sesión cerrada — refresh token invalidado' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  logout(@CurrentUser() user: { id: number }) {
    return this.authService.logout(user.id)
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ global: { ttl: 900_000, limit: 3 } }) // 3 solicitudes cada 15 minutos (evita flooding de emails)
  @ApiOperation({ summary: 'Solicitar recuperación de contraseña' })
  @ApiResponse({ status: 200, description: 'Respuesta genérica (no confirma si el email existe)' })
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
  @Throttle({ global: { ttl: 900_000, limit: 5 } }) // 5 intentos cada 15 minutos
  @ApiOperation({ summary: 'Restablecer contraseña con token de correo' })
  @ApiResponse({ status: 200, description: 'Contraseña restablecida correctamente' })
  @ApiResponse({ status: 400, description: 'Token inválido o expirado' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.usersService.restablecerPassword(dto.token, dto.nuevaPassword)
    return { message: 'Contraseña restablecida correctamente' }
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cambiar contraseña conociendo la actual' })
  @ApiResponse({ status: 200, description: 'Contraseña cambiada correctamente' })
  @ApiResponse({ status: 400, description: 'Contraseña actual incorrecta' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  async changePassword(
    @CurrentUser() user: { id: number },
    @Body() dto: ChangePasswordDto,
  ) {
    await this.usersService.cambiarPassword(
      user.id,
      dto.passwordActual,
      dto.nuevaPassword,
    )
    return { message: 'Contraseña cambiada correctamente' }
  }
}
