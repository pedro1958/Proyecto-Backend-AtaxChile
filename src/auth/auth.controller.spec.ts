import { Test, TestingModule } from '@nestjs/testing'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { LoginDto } from './dto/login.dto'

describe('AuthController', () => {
  let controller: AuthController
  let service: jest.Mocked<AuthService>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn().mockResolvedValue({ access_token: 'fake-jwt-token' }),
          },
        },
      ],
    }).compile()

    controller = module.get<AuthController>(AuthController)
    service = module.get(AuthService)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('login', () => {
    it('debe llamar a authService.login con el DTO recibido', async () => {
      const dto: LoginDto = { email: 'admin@test.cl', password: 'password123' }

      await controller.login(dto)

      expect(service.login).toHaveBeenCalledWith(dto)
    })

    it('debe retornar el access_token generado por el service', async () => {
      const dto: LoginDto = { email: 'admin@test.cl', password: 'password123' }

      const result = await controller.login(dto)

      expect(result).toEqual({ access_token: 'fake-jwt-token' })
    })
  })
})
