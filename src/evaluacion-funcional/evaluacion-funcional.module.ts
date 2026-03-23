import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EvaluacionFuncional } from './entities/evaluacion-funcional.entity';
import { Miembro } from '../miembros/entities/miembro.entity';
import { EvaluacionFuncionalService } from './evaluacion-funcional.service';
import { EvaluacionFuncionalController } from './evaluacion-funcional.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([EvaluacionFuncional, Miembro]),
    AuditModule,
  ],
  controllers: [EvaluacionFuncionalController],
  providers: [EvaluacionFuncionalService],
})
export class EvaluacionFuncionalModule {}
