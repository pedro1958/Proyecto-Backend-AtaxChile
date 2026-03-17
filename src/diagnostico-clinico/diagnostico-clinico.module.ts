import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { DiagnosticoClinico } from './entities/diagnostico-clinico.entity'
import { Miembro } from '../miembros/entities/miembro.entity'
import { DiagnosticoClinicoService } from './diagnostico-clinico.service'
import { DiagnosticoClinicoController } from './diagnostico-clinico.controller'

@Module({
  imports: [TypeOrmModule.forFeature([DiagnosticoClinico, Miembro])],
  controllers: [DiagnosticoClinicoController],
  providers: [DiagnosticoClinicoService],
})
export class DiagnosticoClinicoModule {}
