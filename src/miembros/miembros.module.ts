import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Miembro } from './entities/miembro.entity'
import { MiembrosService } from './miembros.service'
import { MiembrosController } from './miembros.controller'

@Module({
  imports: [TypeOrmModule.forFeature([Miembro])],
  controllers: [MiembrosController],
  providers: [MiembrosService],
  exports: [MiembrosService],
})
export class MiembrosModule {}
