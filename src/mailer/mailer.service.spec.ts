import { Logger } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { MailerService } from './mailer.service'

describe('MailerService', () => {
  describe('sin RESEND_API_KEY (desarrollo)', () => {
    let service: MailerService

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          MailerService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn().mockReturnValue(undefined),
            },
          },
        ],
      }).compile()

      service = module.get<MailerService>(MailerService)
    })

    it('should be defined', () => {
      expect(service).toBeDefined()
    })

    it('debe loguear el enlace en consola en lugar de enviar email', async () => {
      const logSpy = jest
        .spyOn(Logger.prototype, 'log')
        .mockImplementation(() => {})

      await service.enviarActivacion('test@ataxchile.cl', 'token-uuid-123')

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('token-uuid-123'),
      )
      logSpy.mockRestore()
    })
  })

  describe('con RESEND_API_KEY (producción)', () => {
    let service: MailerService
    let mockResendSend: jest.Mock

    beforeEach(async () => {
      mockResendSend = jest.fn().mockResolvedValue({ id: 'email-id-123' })

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          MailerService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string) => {
                const config: Record<string, string> = {
                  RESEND_API_KEY: 're_test_key',
                  RESEND_FROM: 'onboarding@resend.dev',
                  APP_URL: 'http://localhost:5000',
                }
                return config[key]
              }),
            },
          },
        ],
      }).compile()

      service = module.get<MailerService>(MailerService)
      // Reemplaza la instancia de Resend por el mock
      ;(service as any).resend = { emails: { send: mockResendSend } }
    })

    it('should be defined', () => {
      expect(service).toBeDefined()
    })

    it('debe enviar correo con los datos correctos', async () => {
      await service.enviarActivacion('socio@ataxchile.cl', 'token-uuid-123')

      expect(mockResendSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'socio@ataxchile.cl',
          subject: 'Activa tu cuenta — AtaxChile',
          html: expect.stringContaining('token-uuid-123'),
        }),
      )
    })

    it('debe incluir el enlace de activación en el HTML', async () => {
      await service.enviarActivacion('socio@ataxchile.cl', 'mi-token')

      const llamada = mockResendSend.mock.calls[0][0]
      expect(llamada.html).toContain(
        'http://localhost:5000/api/v1/users/activar/mi-token',
      )
    })
  })
})
