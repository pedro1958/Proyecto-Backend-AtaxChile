import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateRolDto } from './dto/update-rol.dto';
import { UsersService } from './users.service';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { SelfGuard } from '../auth/guards/self.guard';
import { Rol } from './entities/user.entity';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Usuarios')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(Rol.SUPERADMIN, Rol.ADMIN)
  @ApiOperation({ summary: 'Listar todos los usuarios administrativos' })
  @ApiResponse({ status: 200, description: 'Lista paginada de usuarios' })
  @ApiResponse({
    status: 403,
    description: 'Sin permisos (requiere superadmin o admin)',
  })
  findAll(@Query() pagination?: PaginationDto) {
    return this.usersService.findAll(pagination);
  }

  @Public()
  @Get('confirmar-email/:token')
  @Throttle({ global: { ttl: 60_000, limit: 10 } })
  @ApiOperation({ summary: 'Confirmar cambio de dirección de correo' })
  @ApiParam({
    name: 'token',
    description: 'Token de confirmación recibido en el nuevo correo',
  })
  @ApiResponse({ status: 200, description: 'Email actualizado correctamente' })
  @ApiResponse({ status: 400, description: 'Token inválido o expirado' })
  @ApiResponse({ status: 409, description: 'El email ya está en uso' })
  async confirmarEmailCambio(@Param('token') token: string) {
    await this.usersService.confirmarEmailCambio(token);
    return { message: 'Correo actualizado correctamente' };
  }

  @Public()
  @Get('activar/:token')
  @Throttle({ global: { ttl: 60_000, limit: 10 } }) // 10 intentos por minuto
  @ApiOperation({ summary: 'Activar cuenta desde enlace de correo' })
  @ApiParam({
    name: 'token',
    description: 'Token de activación recibido por correo',
  })
  @ApiResponse({ status: 200, description: 'Cuenta activada correctamente' })
  @ApiResponse({ status: 400, description: 'Token inválido o expirado' })
  activarCuenta(@Param('token') token: string) {
    return this.usersService.activarCuenta(token);
  }

  @Get(':id')
  @UseGuards(SelfGuard)
  @ApiOperation({ summary: 'Obtener perfil propio' })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiResponse({
    status: 200,
    description: 'Perfil del usuario: nombre, email, rol',
  })
  @ApiResponse({ status: 403, description: 'Solo puede ver su propio perfil' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findPerfil(id);
  }

  @Public()
  @Post('register')
  @Throttle({ global: { ttl: 3_600_000, limit: 5 } }) // 5 registros por hora por IP (anti-spam)
  @ApiOperation({
    summary: 'Registrar nuevo usuario',
    description:
      'Crea un usuario con rol `usuario` por defecto. El rol puede ser elevado posteriormente por un `superadmin` vía PATCH /users/:id/rol.',
  })
  @ApiResponse({
    status: 201,
    description: 'Usuario creado — se envía correo de activación',
  })
  @ApiResponse({ status: 409, description: 'El correo ya está registrado' })
  async create(@Body() dto: CreateUserDto) {
    await this.usersService.create(dto);
    return {
      message: `Hemos enviado un correo a ${dto.email} para activar la cuenta`,
    };
  }

  @Put(':id')
  @UseGuards(SelfGuard)
  @ApiOperation({ summary: 'Actualizar nombre o email del usuario' })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiResponse({ status: 200, description: 'Usuario actualizado' })
  @ApiResponse({
    status: 403,
    description: 'Solo puede modificar su propio perfil',
  })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Patch(':id/rol')
  @Roles(Rol.SUPERADMIN)
  @ApiOperation({ summary: 'Cambiar el rol de un usuario' })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiResponse({ status: 200, description: 'Rol actualizado' })
  @ApiResponse({
    status: 403,
    description: 'Sin permisos (requiere superadmin)',
  })
  updateRol(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRolDto,
    @CurrentUser() user: { id: number },
    @Ip() ip: string,
  ) {
    return this.usersService.updateRol(id, dto, user.id, ip);
  }

  @Patch(':id/status')
  @Roles(Rol.SUPERADMIN)
  @ApiOperation({ summary: 'Activar o desactivar la cuenta de un usuario' })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiResponse({ status: 200, description: 'Estado de la cuenta actualizado' })
  @ApiResponse({
    status: 403,
    description: 'Sin permisos (requiere superadmin)',
  })
  toggleStatus(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.toggleStatus(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Rol.SUPERADMIN)
  @ApiOperation({ summary: 'Eliminación lógica de usuario' })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiResponse({
    status: 204,
    description: 'Usuario desactivado (eliminación lógica)',
  })
  @ApiResponse({
    status: 403,
    description: 'Sin permisos (requiere superadmin)',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }
}
