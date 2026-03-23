import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { AuditService } from '../audit/audit.service';
import { AccionAudit } from '../audit/entities/audit-log.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly auditService: AuditService,
  ) {}

  async login(
    dto: LoginDto,
    ip?: string,
  ): Promise<{ access_token: string; refresh_token: string }> {
    const usuario = await this.usersRepository.findOneBy({ email: dto.email });

    if (!usuario || !usuario.activo || !usuario.cuentaActivada) {
      this.auditService
        .registrar({
          accion: AccionAudit.LOGIN_FALLIDO,
          ip,
          detalle: { email: dto.email },
        })
        .catch(() => {});
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const passwordValido = await bcrypt.compare(dto.password, usuario.password);
    if (!passwordValido) {
      this.auditService
        .registrar({
          accion: AccionAudit.LOGIN_FALLIDO,
          usuarioId: usuario.id,
          ip,
        })
        .catch(() => {});
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const access_token = this.jwtService.sign(
      { sub: usuario.id },
      { secret: this.config.getOrThrow('JWT_SECRET'), expiresIn: '15m' },
    );

    const refresh_token = this.jwtService.sign(
      { sub: usuario.id },
      { secret: this.config.getOrThrow('JWT_REFRESH_SECRET'), expiresIn: '7d' },
    );

    usuario.refreshToken = await bcrypt.hash(refresh_token, 10);
    usuario.refreshTokenExpires = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000,
    );
    await this.usersRepository.save(usuario);

    this.auditService
      .registrar({ accion: AccionAudit.LOGIN, usuarioId: usuario.id, ip })
      .catch(() => {});

    return { access_token, refresh_token };
  }

  async refresh(refreshToken: string): Promise<{ access_token: string }> {
    let payload: { sub: number };
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.config.getOrThrow('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }

    const usuario = await this.usersRepository.findOneBy({ id: payload.sub });
    if (
      !usuario ||
      !usuario.activo ||
      !usuario.cuentaActivada ||
      !usuario.refreshToken
    )
      throw new UnauthorizedException('Refresh token inválido o expirado');

    const tokenValido = await bcrypt.compare(
      refreshToken,
      usuario.refreshToken,
    );
    if (!tokenValido)
      throw new UnauthorizedException('Refresh token inválido o expirado');

    const access_token = this.jwtService.sign(
      { sub: usuario.id },
      { secret: this.config.getOrThrow('JWT_SECRET'), expiresIn: '15m' },
    );

    return { access_token };
  }

  async logout(userId: number, ip?: string): Promise<void> {
    const usuario = await this.usersRepository.findOneBy({ id: userId });
    if (!usuario) return;
    usuario.refreshToken = null;
    usuario.refreshTokenExpires = null;
    await this.usersRepository.save(usuario);
    this.auditService
      .registrar({ accion: AccionAudit.LOGOUT, usuarioId: userId, ip })
      .catch(() => {});
  }
}
