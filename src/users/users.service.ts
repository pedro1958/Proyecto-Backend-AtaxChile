import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { MailerService } from '../mailer/mailer.service';

type UserSinPassword = Omit<User, 'password'>;

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

    const hash = await bcrypt.hash(dto.password, 10);
    const token = randomUUID();
    const expiracion = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const usuario = this.usersRepository.create({
      ...dto,
      password: hash,
      cuentaActivada: false,
      tokenActivacion: token,
      tokenExpiracion: expiracion,
    });

    const guardado = await this.usersRepository.save(usuario);
    await this.mailerService.enviarActivacion(dto.email, token);
    return this.sinPassword(guardado);
  }

  async findAll(): Promise<UserSinPassword[]> {
    const usuarios = await this.usersRepository.find();
    return usuarios.map((u) => this.sinPassword(u));
  }

  async findOne(id: number): Promise<UserSinPassword> {
    const usuario = await this.usersRepository.findOneBy({ id });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    return this.sinPassword(usuario);
  }

  async update(id: number, dto: UpdateUserDto): Promise<UserSinPassword> {
    const usuario = await this.usersRepository.findOneBy({ id });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    Object.assign(usuario, dto);
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
