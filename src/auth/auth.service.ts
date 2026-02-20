import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import * as bcrypt from 'bcrypt'
import { User } from '../users/entities/user.entity'
import { LoginDto } from './dto/login.dto'

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto): Promise<{ access_token: string }> {
    const usuario = await this.usersRepository.findOneBy({ email: dto.email })

    if (!usuario || !usuario.activo || !usuario.cuentaActivada)
      throw new UnauthorizedException('Credenciales inválidas')

    const passwordValido = await bcrypt.compare(dto.password, usuario.password)
    if (!passwordValido)
      throw new UnauthorizedException('Credenciales inválidas')

    const payload = { sub: usuario.id, email: usuario.email, rol: usuario.rol }
    return { access_token: this.jwtService.sign(payload) }
  }
}
