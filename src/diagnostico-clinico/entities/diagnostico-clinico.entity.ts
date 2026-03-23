import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Miembro } from '../../miembros/entities/miembro.entity';
import { AtaxiaType } from '../../ataxia-types/entities/ataxia-type.entity';

export enum ConfirmacionDiagnostico {
  GENETICO = 'genetico',
  CLINICO = 'clinico',
  PROBABLE = 'probable',
}

@Entity('diagnosticos_clinicos')
export class DiagnosticoClinico {
  @PrimaryGeneratedColumn()
  id: number;

  // ── Relación con Miembro (1:1) ─────────────────────────────────────────────
  @Column({ unique: true })
  miembroId: number;

  @OneToOne(() => Miembro, { eager: false })
  @JoinColumn({ name: 'miembroId' })
  miembro: Miembro;

  // ── Tipo de ataxia ─────────────────────────────────────────────────────────
  @Column({ nullable: true })
  tipoAtaxiaId: number | null;

  @ManyToOne(() => AtaxiaType, { nullable: true, eager: false })
  @JoinColumn({ name: 'tipoAtaxiaId' })
  tipoAtaxia: AtaxiaType | null;

  // Subtipo específico (ej: SCA1, SCA2, Friedreich, ARSACS)
  // Texto libre porque los subtipos son muchos y evolucionan con la ciencia
  @Column({ type: 'varchar', nullable: true })
  subtipo: string | null;

  // ── Confirmación del diagnóstico ───────────────────────────────────────────
  @Column({ type: 'varchar', default: ConfirmacionDiagnostico.CLINICO })
  confirmacion: ConfirmacionDiagnostico;

  // ── Datos del diagnóstico ──────────────────────────────────────────────────
  @Column({ type: 'date', nullable: true })
  fechaDiagnostico: string | null;

  @Column({ type: 'varchar', nullable: true })
  institucion: string | null;

  @Column({ type: 'varchar', nullable: true })
  medico: string | null;

  @Column({ type: 'text', nullable: true })
  observaciones: string | null;

  // ── Auditoría ─────────────────────────────────────────────────────────────
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
