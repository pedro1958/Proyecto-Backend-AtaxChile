import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import * as request from 'supertest'
import { User, Rol } from '../src/users/entities/user.entity'
import { UsersModule } from '../src/users/users.module'

const mockUser: User = {
  id: 1,
  nombre: 'Admin Test',
  email: 'admin@test.cl',
  password: 'hashed_password',
  rol: Rol.ADMIN,
  activo: true,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockRepo = {
  findOneBy: jest.fn(),
  find: jest.fn().mockResolvedValue([mockUser]),
  create: jest.fn().mockReturnValue(mockUser),
  save: jest.fn().mockResolvedValue(mockUser),
}

describe('Users (e2e)', () => {
  let app: INestApplication

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [UsersModule],
    })
      .overrideProvider(getRepositoryToken(User))
      .useValue(mockRepo)
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
    it('debe crear usuario y retornarlo sin password', async () => {
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

      expect(res.body).not.toHaveProperty('password')
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

    it('debe retornar 409 si el email ya está registrado', async () => {
      mockRepo.findOneBy.mockResolvedValue(mockUser)

      await request(app.getHttpServer())
        .post('/api/v1/users')
        .send({
          nombre: 'Admin',
          email: 'admin@test.cl',
          password: 'password123',
          rol: Rol.ADMIN,
        })
        .expect(409)
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
})
