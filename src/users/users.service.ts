import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { Rol, User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateRolDto } from './dto/update-rol.dto';
import { MailerService } from '../mailer/mailer.service';
import { PaginatedResult } from '../common/types/response.types';

type UserSinPassword = Omit<User, 'password'>;
type PerfilUsuario = Pick<User, 'nombre' | 'email' | 'rol'>;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly mailerService: MailerService,
  ) {}

  async create(dto: CreateUserDto): Promise<UserSinPassword> {
    const existe = await this.usersRepository.findOneBy({ email: dto.email });
    if (existe) {
      if (!existe.cuentaActivada) {
        throw new ConflictException(
          'Ya existe una cuenta pendiente de activación para este correo. Revisa tu bandeja de entrada o de correo no deseado.',
        );
      }
      throw new ConflictException('El email ya está registrado');
    }

    const usersCount = await this.usersRepository.count();
    const rol = usersCount === 0 ? Rol.SUPERADMIN : Rol.USUARIO; // El primer usuario es admin

    const hash = await bcrypt.hash(dto.password, 10);
    const token = randomUUID();
    const expiracion = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const usuario = this.usersRepository.create({
      ...dto,
      password: hash,
      rol: rol,
      cuentaActivada: false,
      tokenActivacion: token,
      tokenExpiracion: expiracion,
    });

    const guardado = await this.usersRepository.save(usuario);
    await this.mailerService.enviarActivacion(dto.email, token);
    return this.sinPassword(guardado);
  }

  async findAll(
    pagination: { page?: number; limit?: number } = {},
  ): Promise<PaginatedResult<UserSinPassword>> {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 20;

    const [usuarios, total] = await this.usersRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: usuarios.map((u) => this.sinPassword(u)),
      total,
      page,
      limit,
    };
  }

  async findOne(id: number): Promise<UserSinPassword> {
    const usuario = await this.usersRepository.findOneBy({ id });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    return this.sinPassword(usuario);
  }

  async findPerfil(id: number): Promise<PerfilUsuario> {
    const usuario = await this.usersRepository.findOne({
      where: { id },
      select: { nombre: true, email: true, rol: true },
    });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    return { nombre: usuario.nombre, email: usuario.email, rol: usuario.rol };
  }

  async update(id: number, dto: UpdateUserDto): Promise<{ message: string }> {
    const usuario = await this.usersRepository.findOneBy({ id });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');

    if (dto.email && dto.email !== usuario.email) {
      const existe = await this.usersRepository.findOneBy({ email: dto.email });
      if (existe) throw new ConflictException('El email ya está registrado');

      const token = randomUUID();
      usuario.emailPendiente = dto.email;
      usuario.tokenEmailCambio = token;
      usuario.tokenEmailCambioExpires = new Date(
        Date.now() + 24 * 60 * 60 * 1000,
      );
      await this.usersRepository.save(usuario);
      await this.mailerService.enviarConfirmacionEmailCambio(dto.email, token);

      if (dto.nombre) {
        usuario.nombre = dto.nombre;
        await this.usersRepository.save(usuario);
      }

      return {
        message: `Hemos enviado un correo a ${dto.email} para confirmar el cambio de dirección`,
      };
    }

    if (dto.nombre) {
      usuario.nombre = dto.nombre;
      await this.usersRepository.save(usuario);
    }

    return { message: 'Perfil actualizado' };
  }

  async confirmarEmailCambio(token: string): Promise<void> {
    const usuario = await this.usersRepository.findOneBy({
      tokenEmailCambio: token,
    });
    if (!usuario) throw new BadRequestException('Token inválido o expirado');

    if (
      !usuario.tokenEmailCambioExpires ||
      usuario.tokenEmailCambioExpires < new Date()
    ) {
      throw new BadRequestException('Token inválido o expirado');
    }

    if (!usuario.emailPendiente)
      throw new BadRequestException('Token inválido o expirado');

    const existe = await this.usersRepository.findOneBy({
      email: usuario.emailPendiente,
    });
    if (existe) throw new ConflictException('El email ya está en uso');

    usuario.email = usuario.emailPendiente;
    usuario.emailPendiente = null;
    usuario.tokenEmailCambio = null;
    usuario.tokenEmailCambioExpires = null;
    await this.usersRepository.save(usuario);
  }

  async updateRol(id: number, dto: UpdateRolDto): Promise<UserSinPassword> {
    const usuario = await this.usersRepository.findOneBy({ id });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    usuario.rol = dto.rol;
    const actualizado = await this.usersRepository.save(usuario);
    return this.sinPassword(actualizado);
  }

  async toggleStatus(id: number): Promise<UserSinPassword> {
    const usuario = await this.usersRepository.findOneBy({ id });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    usuario.activo = !usuario.activo;
    const actualizado = await this.usersRepository.save(usuario);
    return this.sinPassword(actualizado);
  }

  async remove(id: number): Promise<void> {
    const usuario = await this.usersRepository.findOneBy({ id });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    usuario.activo = false;
    await this.usersRepository.save(usuario);
  }

  async cambiarPassword(
    id: number,
    passwordActual: string,
    nuevaPassword: string,
  ): Promise<void> {
    const usuario = await this.usersRepository.findOneBy({ id });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');

    const passwordValido = await bcrypt.compare(
      passwordActual,
      usuario.password,
    );
    if (!passwordValido)
      throw new UnauthorizedException('La contraseña actual es incorrecta');

    usuario.password = await bcrypt.hash(nuevaPassword, 10);
    await this.usersRepository.save(usuario);
  }

  async solicitarRecuperacion(email: string): Promise<void> {
    const usuario = await this.usersRepository.findOneBy({ email });
    // Respuesta silenciosa: no revelar si el email existe o no
    if (!usuario || !usuario.activo || !usuario.cuentaActivada) return;

    const token = randomUUID();
    const expiracion = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    usuario.resetPasswordToken = token;
    usuario.resetPasswordExpires = expiracion;
    await this.usersRepository.save(usuario);
    await this.mailerService.enviarRecuperacion(email, token);
  }

  async restablecerPassword(
    token: string,
    nuevaPassword: string,
  ): Promise<void> {
    const usuario = await this.usersRepository.findOneBy({
      resetPasswordToken: token,
    });
    if (!usuario) throw new BadRequestException('Token inválido o expirado');

    if (
      !usuario.resetPasswordExpires ||
      usuario.resetPasswordExpires < new Date()
    ) {
      throw new BadRequestException('Token inválido o expirado');
    }

    usuario.password = await bcrypt.hash(nuevaPassword, 10);
    usuario.resetPasswordToken = null;
    usuario.resetPasswordExpires = null;
    await this.usersRepository.save(usuario);
  }

  async activarCuenta(token: string): Promise<void> {
    const usuario = await this.usersRepository.findOneBy({
      tokenActivacion: token,
    });
    if (!usuario) throw new NotFoundException('Token inválido');

    if (!usuario.tokenExpiracion || usuario.tokenExpiracion < new Date())
      throw new BadRequestException('El token ha expirado');

    usuario.cuentaActivada = true;
    usuario.tokenActivacion = null;
    usuario.tokenExpiracion = null;
    await this.usersRepository.save(usuario);
  }

  private sinPassword(usuario: User): UserSinPassword {
    const { password, ...resto } = usuario;
    return resto;
  }
}
