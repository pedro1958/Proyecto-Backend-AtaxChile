import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiagnosticoClinico } from './entities/diagnostico-clinico.entity';
import { Miembro } from '../miembros/entities/miembro.entity';
import { DiagnosticoClinicoService } from './diagnostico-clinico.service';
import { DiagnosticoClinicoController } from './diagnostico-clinico.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DiagnosticoClinico, Miembro]),
    AuditModule,
  ],
  controllers: [DiagnosticoClinicoController],
  providers: [DiagnosticoClinicoService],
})
export class DiagnosticoClinicoModule {}
