import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import * as request from 'supertest'
import { User, Rol } from '../src/users/entities/user.entity'
import { UsersModule } from '../src/users/users.module'
import { MailerService } from '../src/mailer/mailer.service'

const mockUser: User = {
  id: 1,
  nombre: 'Admin Test',
  email: 'admin@test.cl',
  password: 'hashed_password',
  rol: Rol.ADMIN,
  activo: true,
  cuentaActivada: false,
  tokenActivacion: 'token-uuid-123',
  tokenExpiracion: new Date(Date.now() + 24 * 60 * 60 * 1000),
  resetPasswordToken: null,
  resetPasswordExpires: null,
  refreshToken: null,
  refreshTokenExpires: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockRepo = {
  findOneBy: jest.fn(),
  find: jest.fn().mockResolvedValue([mockUser]),
  create: jest.fn().mockReturnValue(mockUser),
  save: jest.fn().mockResolvedValue(mockUser),
}

const mockMailer = {
  enviarActivacion: jest.fn().mockResolvedValue(undefined),
}

describe('Users (e2e)', () => {
  let app: INestApplication

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [UsersModule],
    })
      .overrideProvider(getRepositoryToken(User))
      .useValue(mockRepo)
      .overrideProvider(MailerService)
      .useValue(mockMailer)
      .compile()

    app = moduleFixture.createNestApplication()
    app.setGlobalPrefix('api/v1')
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    )
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    jest.clearAllMocks()
    mockRepo.find.mockResolvedValue([mockUser])
    mockRepo.create.mockReturnValue(mockUser)
    mockRepo.save.mockResolvedValue(mockUser)
    mockMailer.enviarActivacion.mockResolvedValue(undefined)
  })

  describe('GET /api/v1/users', () => {
    it('debe retornar lista de usuarios sin password', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/users')
        .expect(200)

      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body[0]).not.toHaveProperty('password')
    })
  })

  describe('GET /api/v1/users/:id', () => {
    it('debe retornar usuario sin password', async () => {
      mockRepo.findOneBy.mockResolvedValue(mockUser)

      const res = await request(app.getHttpServer())
        .get('/api/v1/users/1')
        .expect(200)

      expect(res.body).not.toHaveProperty('password')
      expect(res.body.id).toBe(1)
    })

    it('debe retornar 404 si el usuario no existe', async () => {
      mockRepo.findOneBy.mockResolvedValue(null)

      await request(app.getHttpServer()).get('/api/v1/users/999').expect(404)
    })

    it('debe retornar 400 si el id no es un número', async () => {
      await request(app.getHttpServer()).get('/api/v1/users/abc').expect(400)
    })
  })

  describe('POST /api/v1/users', () => {
    it('debe crear usuario, enviar correo y retornar mensaje de confirmación', async () => {
      mockRepo.findOneBy.mockResolvedValue(null)

      const res = await request(app.getHttpServer())
        .post('/api/v1/users')
        .send({
          nombre: 'Admin',
          email: 'admin@test.cl',
          password: 'password123',
          rol: Rol.ADMIN,
        })
        .expect(201)

      expect(res.body).toHaveProperty('message')
      expect(res.body.message).toContain('admin@test.cl')
      expect(res.body).not.toHaveProperty('password')
      expect(mockMailer.enviarActivacion).toHaveBeenCalledWith(
        'admin@test.cl',
        expect.any(String),
      )
    })

    it('debe retornar 400 si faltan campos obligatorios', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/users')
        .send({ nombre: 'Admin' })
        .expect(400)
    })

    it('debe retornar 400 si el password es menor a 8 caracteres', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/users')
        .send({
          nombre: 'Admin',
          email: 'admin@test.cl',
          password: '123',
          rol: Rol.ADMIN,
        })
        .expect(400)
    })

    it('debe retornar 400 si el rol no es válido', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/users')
        .send({
          nombre: 'Admin',
          email: 'admin@test.cl',
          password: 'password123',
          rol: 'gestor',
        })
        .expect(400)
    })

    it('debe retornar 409 con mensaje de activación pendiente si la cuenta no está activada', async () => {
      mockRepo.findOneBy.mockResolvedValue({ ...mockUser, cuentaActivada: false })

      const res = await request(app.getHttpServer())
        .post('/api/v1/users')
        .send({
          nombre: 'Admin',
          email: 'admin@test.cl',
          password: 'password123',
          rol: Rol.ADMIN,
        })
        .expect(409)

      expect(res.body.message).toContain('pendiente de activación')
    })

    it('debe retornar 409 si el email ya está registrado y activado', async () => {
      mockRepo.findOneBy.mockResolvedValue({ ...mockUser, cuentaActivada: true })

      const res = await request(app.getHttpServer())
        .post('/api/v1/users')
        .send({
          nombre: 'Admin',
          email: 'admin@test.cl',
          password: 'password123',
          rol: Rol.ADMIN,
        })
        .expect(409)

      expect(res.body.message).toContain('El email ya está registrado')
    })
  })

  describe('PUT /api/v1/users/:id', () => {
    it('debe actualizar usuario', async () => {
      mockRepo.findOneBy.mockResolvedValue(mockUser)
      mockRepo.save.mockResolvedValue({ ...mockUser, nombre: 'Nuevo Nombre' })

      const res = await request(app.getHttpServer())
        .put('/api/v1/users/1')
        .send({ nombre: 'Nuevo Nombre', rol: Rol.SECRETARIO })
        .expect(200)

      expect(res.body).not.toHaveProperty('password')
    })

    it('debe retornar 404 si el usuario no existe', async () => {
      mockRepo.findOneBy.mockResolvedValue(null)

      await request(app.getHttpServer())
        .put('/api/v1/users/999')
        .send({ nombre: 'X' })
        .expect(404)
    })
  })

  describe('PATCH /api/v1/users/:id/status', () => {
    it('debe cambiar el estado activo del usuario', async () => {
      mockRepo.findOneBy.mockResolvedValue(mockUser)
      mockRepo.save.mockResolvedValue({ ...mockUser, activo: false })

      const res = await request(app.getHttpServer())
        .patch('/api/v1/users/1/status')
        .expect(200)

      expect(res.body.activo).toBe(false)
    })

    it('debe retornar 404 si el usuario no existe', async () => {
      mockRepo.findOneBy.mockResolvedValue(null)

      await request(app.getHttpServer())
        .patch('/api/v1/users/999/status')
        .expect(404)
    })
  })

  describe('DELETE /api/v1/users/:id', () => {
    it('debe hacer soft delete y retornar 204', async () => {
      mockRepo.findOneBy.mockResolvedValue(mockUser)

      await request(app.getHttpServer()).delete('/api/v1/users/1').expect(204)
    })

    it('debe retornar 404 si el usuario no existe', async () => {
      mockRepo.findOneBy.mockResolvedValue(null)

      await request(app.getHttpServer()).delete('/api/v1/users/999').expect(404)
    })
  })

  describe('GET /api/v1/users/activar/:token', () => {
    it('debe activar cuenta con token válido', async () => {
      mockRepo.findOneBy.mockResolvedValue({
        ...mockUser,
        tokenExpiracion: new Date(Date.now() + 3600000),
      })
      mockRepo.save.mockResolvedValue({
        ...mockUser,
        cuentaActivada: true,
        tokenActivacion: null,
        tokenExpiracion: null,
      })

      await request(app.getHttpServer())
        .get('/api/v1/users/activar/token-uuid-123')
        .expect(200)
    })

    it('debe retornar 404 si el token no existe', async () => {
      mockRepo.findOneBy.mockResolvedValue(null)

      await request(app.getHttpServer())
        .get('/api/v1/users/activar/token-invalido')
        .expect(404)
    })

    it('debe retornar 400 si el token ha expirado', async () => {
      mockRepo.findOneBy.mockResolvedValue({
        ...mockUser,
        tokenExpiracion: new Date(Date.now() - 3600000),
      })

      await request(app.getHttpServer())
        .get('/api/v1/users/activar/token-expirado')
        .expect(400)
    })
  })
})
