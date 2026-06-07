import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as request from 'supertest';
import { User, Rol } from '../src/users/entities/user.entity';
import { UsersModule } from '../src/users/users.module';
import { MailerService } from '../src/mailer/mailer.service';
import { AuditService } from '../src/audit/audit.service';
import { AuditLog } from '../src/audit/entities/audit-log.entity';
import { SelfGuard } from '../src/auth/guards/self.guard';

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
  emailPendiente: null,
  tokenEmailCambio: null,
  tokenEmailCambioExpires: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockRepo = {
  findOneBy: jest.fn(),
  findOne: jest.fn().mockResolvedValue(mockUser),
  find: jest.fn().mockResolvedValue([mockUser]),
  findAndCount: jest.fn().mockResolvedValue([[mockUser], 1]),
  count: jest.fn().mockResolvedValue(1),
  create: jest.fn().mockReturnValue(mockUser),
  save: jest.fn().mockResolvedValue(mockUser),
};

const mockMailer = {
  enviarActivacion: jest.fn().mockResolvedValue(undefined),
};

const mockAudit = {
  registrar: jest.fn().mockResolvedValue(undefined),
};

describe('Users (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [UsersModule],
    })
      .overrideProvider(getRepositoryToken(User))
      .useValue(mockRepo)
      .overrideProvider(MailerService)
      .useValue(mockMailer)
      .overrideProvider(AuditService)
      .useValue(mockAudit)
      .overrideProvider(getRepositoryToken(AuditLog))
      .useValue({ save: jest.fn(), find: jest.fn(), findOneBy: jest.fn() })
      .overrideGuard(SelfGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepo.findOneBy.mockResolvedValue(mockUser);
    mockRepo.findOne.mockResolvedValue(mockUser);
    mockRepo.find.mockResolvedValue([mockUser]);
    mockRepo.findAndCount.mockResolvedValue([[mockUser], 1]);
    mockRepo.count.mockResolvedValue(1);
    mockRepo.create.mockReturnValue(mockUser);
    mockRepo.save.mockResolvedValue(mockUser);
    mockMailer.enviarActivacion.mockResolvedValue(undefined);
  });

  describe('GET /api/v1/users', () => {
    it('debe retornar lista paginada de usuarios sin password', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/users')
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0]).not.toHaveProperty('password');
      expect(res.body.data[0]).not.toHaveProperty('tokenActivacion');
      expect(res.body.data[0]).not.toHaveProperty('refreshToken');
      expect(res.body).toHaveProperty('total');
    });
  });

  describe('GET /api/v1/users/:id', () => {
    it('debe retornar perfil del usuario (nombre, email, rol)', async () => {
      mockRepo.findOneBy.mockResolvedValue(mockUser);

      const res = await request(app.getHttpServer())
        .get('/api/v1/users/1')
        .expect(200);

      expect(res.body).toHaveProperty('nombre');
      expect(res.body).toHaveProperty('email');
      expect(res.body).toHaveProperty('rol');
      expect(res.body).not.toHaveProperty('password');
    });

    it('debe retornar 404 si el usuario no existe', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await request(app.getHttpServer()).get('/api/v1/users/999').expect(404);
    });

    it('debe retornar 400 si el id no es un número', async () => {
      await request(app.getHttpServer()).get('/api/v1/users/abc').expect(400);
    });
  });

  describe('POST /api/v1/users/register', () => {
    it('debe crear usuario, enviar correo y retornar mensaje de confirmación', async () => {
      mockRepo.findOneBy.mockResolvedValue(null);

      const res = await request(app.getHttpServer())
        .post('/api/v1/users/register')
        .send({
          nombre: 'Admin',
          email: 'admin@test.cl',
          password: 'Password123',
        })
        .expect(201);

      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('admin@test.cl');
      expect(res.body).not.toHaveProperty('password');
      expect(mockMailer.enviarActivacion).toHaveBeenCalledWith(
        'admin@test.cl',
        expect.any(String),
      );
    });

    it('debe retornar 400 si faltan campos obligatorios', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/users/register')
        .send({ nombre: 'Admin' })
        .expect(400);
    });

    it('debe retornar 400 si el password es menor a 8 caracteres', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/users/register')
        .send({
          nombre: 'Admin',
          email: 'admin@test.cl',
          password: '123',
        })
        .expect(400);
    });

    it('debe retornar 400 si el password no cumple la política (sin mayúscula)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/users/register')
        .send({
          nombre: 'Admin',
          email: 'admin@test.cl',
          password: 'password123',
        })
        .expect(400);
    });

    it('debe retornar 409 con mensaje de activación pendiente si la cuenta no está activada', async () => {
      mockRepo.findOneBy.mockResolvedValue({
        ...mockUser,
        cuentaActivada: false,
      });

      const res = await request(app.getHttpServer())
        .post('/api/v1/users/register')
        .send({
          nombre: 'Admin',
          email: 'admin@test.cl',
          password: 'Password123',
        })
        .expect(409);

      expect(res.body.message).toContain('pendiente de activación');
    });

    it('debe retornar 409 si el email ya está registrado y activado', async () => {
      mockRepo.findOneBy.mockResolvedValue({
        ...mockUser,
        cuentaActivada: true,
      });

      const res = await request(app.getHttpServer())
        .post('/api/v1/users/register')
        .send({
          nombre: 'Admin',
          email: 'admin@test.cl',
          password: 'Password123',
        })
        .expect(409);

      expect(res.body.message).toContain('El email ya está registrado');
    });
  });

  describe('PUT /api/v1/users/:id', () => {
    it('debe actualizar usuario y retornar mensaje de confirmación', async () => {
      mockRepo.findOneBy.mockResolvedValue(mockUser);
      mockRepo.save.mockResolvedValue({ ...mockUser, nombre: 'Nuevo Nombre' });

      const res = await request(app.getHttpServer())
        .put('/api/v1/users/1')
        .send({ nombre: 'Nuevo Nombre' })
        .expect(200);

      expect(res.body).toHaveProperty('message');
    });

    it('debe retornar 404 si el usuario no existe', async () => {
      mockRepo.findOneBy.mockResolvedValue(null);

      await request(app.getHttpServer())
        .put('/api/v1/users/999')
        .send({ nombre: 'X' })
        .expect(404);
    });
  });

  describe('PATCH /api/v1/users/:id/status', () => {
    it('debe cambiar el estado activo del usuario', async () => {
      mockRepo.findOneBy.mockResolvedValue(mockUser);
      mockRepo.save.mockResolvedValue({ ...mockUser, activo: false });

      const res = await request(app.getHttpServer())
        .patch('/api/v1/users/1/status')
        .expect(200);

      expect(res.body.activo).toBe(false);
    });

    it('debe retornar 404 si el usuario no existe', async () => {
      mockRepo.findOneBy.mockResolvedValue(null);

      await request(app.getHttpServer())
        .patch('/api/v1/users/999/status')
        .expect(404);
    });
  });

  describe('DELETE /api/v1/users/:id', () => {
    it('debe hacer soft delete y retornar 204', async () => {
      mockRepo.findOneBy.mockResolvedValue(mockUser);

      await request(app.getHttpServer()).delete('/api/v1/users/1').expect(204);
    });

    it('debe retornar 404 si el usuario no existe', async () => {
      mockRepo.findOneBy.mockResolvedValue(null);

      await request(app.getHttpServer())
        .delete('/api/v1/users/999')
        .expect(404);
    });
  });

  describe('GET /api/v1/users/activar/:token', () => {
    it('debe activar cuenta con token válido', async () => {
      mockRepo.findOneBy.mockResolvedValue({
        ...mockUser,
        tokenExpiracion: new Date(Date.now() + 3600000),
      });
      mockRepo.save.mockResolvedValue({
        ...mockUser,
        cuentaActivada: true,
        tokenActivacion: null,
        tokenExpiracion: null,
      });

      await request(app.getHttpServer())
        .get('/api/v1/users/activar/token-uuid-123')
        .expect(200);
    });

    it('debe retornar 404 si el token no existe', async () => {
      mockRepo.findOneBy.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get('/api/v1/users/activar/token-invalido')
        .expect(404);
    });

    it('debe retornar 400 si el token ha expirado', async () => {
      mockRepo.findOneBy.mockResolvedValue({
        ...mockUser,
        tokenExpiracion: new Date(Date.now() - 3600000),
      });

      await request(app.getHttpServer())
        .get('/api/v1/users/activar/token-expirado')
        .expect(400);
    });
  });
});
