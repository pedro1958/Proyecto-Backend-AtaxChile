import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Miembro } from '../miembros/entities/miembro.entity'
import { DiagnosticoClinico } from '../diagnostico-clinico/entities/diagnostico-clinico.entity'
import { EvaluacionFuncional } from '../evaluacion-funcional/entities/evaluacion-funcional.entity'
import { ExportsService } from './exports.service'
import { ExportsController } from './exports.controller'

@Module({
  imports: [
    TypeOrmModule.forFeature([Miembro, DiagnosticoClinico, EvaluacionFuncional]),
  ],
  controllers: [ExportsController],
  providers: [ExportsService],
})
export class ExportsModule {}
