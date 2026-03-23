import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Miembro } from '../miembros/entities/miembro.entity';
import { DiagnosticoClinico } from '../diagnostico-clinico/entities/diagnostico-clinico.entity';
import { EvaluacionFuncional } from '../evaluacion-funcional/entities/evaluacion-funcional.entity';
import { StatsService } from './stats.service';
import { StatsController } from './stats.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Miembro,
      DiagnosticoClinico,
      EvaluacionFuncional,
    ]),
  ],
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}
