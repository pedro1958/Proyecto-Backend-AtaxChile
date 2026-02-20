import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Resend } from 'resend'
import { activacionTemplate } from './templates/activacion.template'
import { recuperacionTemplate } from './templates/recuperacion.template'

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name)
  private resend: Resend | null = null

  constructor(private readonly config: ConfigService) {
    const apiKey = config.get<string>('RESEND_API_KEY')
    if (apiKey) {
      this.resend = new Resend(apiKey)
    }
  }

  async enviarActivacion(email: string, token: string): Promise<void> {
    const appUrl = this.config.get<string>('APP_URL') ?? 'http://localhost:5000'
    const url = `${appUrl}/api/v1/users/activar/${token}`

    if (!this.resend) {
      this.logger.log(`[DEV] Enlace de activación para ${email}: ${url}`)
      return
    }

    await this.resend.emails.send({
      from: this.config.get<string>('RESEND_FROM') ?? 'onboarding@resend.dev',
      to: email,
      subject: 'Activa tu cuenta — AtaxChile',
      html: activacionTemplate(url),
    })
  }

  async enviarRecuperacion(email: string, token: string): Promise<void> {
    const appUrl = this.config.get<string>('APP_URL') ?? 'http://localhost:5000'
    const url = `${appUrl}/api/v1/auth/reset-password?token=${token}`

    if (!this.resend) {
      this.logger.log(`[DEV] Enlace de recuperación para ${email}: ${url}`)
      return
    }

    await this.resend.emails.send({
      from: this.config.get<string>('RESEND_FROM') ?? 'onboarding@resend.dev',
      to: email,
      subject: 'Recupera tu contraseña — AtaxChile',
      html: recuperacionTemplate(url),
    })
  }
}
