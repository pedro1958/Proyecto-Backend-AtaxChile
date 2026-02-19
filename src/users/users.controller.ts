import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
} from '@nestjs/common'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { UsersService } from './users.service'

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // superadmin, admin
  @Get()
  findAll() {
    return this.usersService.findAll()
  }

  // público — llamado desde el enlace del correo
  @Get('activar/:token')
  activarCuenta(@Param('token') token: string) {
    return this.usersService.activarCuenta(token)
  }

  // superadmin, admin
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id)
  }

  // superadmin
  @Post()
  async create(@Body() dto: CreateUserDto) {
    await this.usersService.create(dto)
    return {
      message: `Hemos enviado un correo a ${dto.email} para activar la cuenta`,
    }
  }

  // superadmin
  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto)
  }

  // superadmin
  @Patch(':id/status')
  toggleStatus(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.toggleStatus(id)
  }

  // superadmin — eliminación lógica
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id)
  }
}
