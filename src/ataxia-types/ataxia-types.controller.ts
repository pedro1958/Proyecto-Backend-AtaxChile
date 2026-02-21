import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common'
import { AtaxiaTypesService } from './ataxia-types.service'
import { CreateAtaxiaTypeDto } from './dto/create-ataxia-type.dto'
import { UpdateAtaxiaTypeDto } from './dto/update-ataxia-type.dto'
import { GrupoAtaxia } from './entities/ataxia-type.entity'
import { Roles } from '../auth/decorators/roles.decorator'
import { Rol } from '../users/entities/user.entity'

@Controller('ataxia-types')
export class AtaxiaTypesController {
  constructor(private readonly ataxiaTypesService: AtaxiaTypesService) {}

  @Get()
  findAll(@Query('grupo') grupo?: GrupoAtaxia) {
    return this.ataxiaTypesService.findAll(grupo)
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ataxiaTypesService.findOne(id)
  }

  @Roles(Rol.SUPERADMIN, Rol.ADMIN)
  @Post()
  create(@Body() dto: CreateAtaxiaTypeDto) {
    return this.ataxiaTypesService.create(dto)
  }

  @Roles(Rol.SUPERADMIN, Rol.ADMIN)
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAtaxiaTypeDto) {
    return this.ataxiaTypesService.update(id, dto)
  }

  @Roles(Rol.SUPERADMIN, Rol.ADMIN)
  @Patch(':id/status')
  toggleStatus(@Param('id', ParseIntPipe) id: number) {
    return this.ataxiaTypesService.toggleStatus(id)
  }
}
