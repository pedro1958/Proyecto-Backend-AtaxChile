import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { EvaluacionFuncional } from './entities/evaluacion-funcional.entity'
import { Miembro } from '../miembros/entities/miembro.entity'
import { EvaluacionFuncionalService } from './evaluacion-funcional.service'
import { EvaluacionFuncionalController } from './evaluacion-funcional.controller'

@Module({
  imports: [TypeOrmModule.forFeature([EvaluacionFuncional, Miembro])],
  controllers: [EvaluacionFuncionalController],
  providers: [EvaluacionFuncionalService],
})
export class EvaluacionFuncionalModule {}
