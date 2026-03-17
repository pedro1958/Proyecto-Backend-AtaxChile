import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { Miembro } from '../../miembros/entities/miembro.entity'
import { User } from '../../users/entities/user.entity'

export enum NivelMovilidad {
  AMBULATORIO_SIN_APOYO = 'ambulatorio_sin_apoyo',
  AMBULATORIO_CON_APOYO = 'ambulatorio_con_apoyo', // bastón, andador
  SILLA_PARCIAL         = 'silla_parcial',          // usa silla parte del tiempo
  SILLA_TOTAL           = 'silla_total',
  POSTRADO              = 'postrado',
}

// ⚠️  APPEND-ONLY: esta tabla nunca recibe UPDATE ni DELETE.
//     Cada evaluación es un hecho histórico inmutable.
//     Para "corregir" un error se registra una nueva evaluación.
@Entity('evaluaciones_funcionales')
export class EvaluacionFuncional {
  @PrimaryGeneratedColumn()
  id: number

  // ── Miembro evaluado ───────────────────────────────────────────────────────
  @Column()
  miembroId: number

  @ManyToOne(() => Miembro, { eager: false })
  @JoinColumn({ name: 'miembroId' })
  miembro: Miembro

  // ── Fecha de la evaluación ─────────────────────────────────────────────────
  @Column({ type: 'date' })
  fecha: string

  // ── Movilidad ─────────────────────────────────────────────────────────────
  @Column({ type: 'varchar' })
  nivelMovilidad: NivelMovilidad

  // Escala SARA: 0 (sin afectación) — 40 (máxima afectación)
  // Estándar clínico internacional para ataxia cerebelosa
  @Column({ type: 'int', nullable: true })
  puntuacionSara: number | null

  // ── Afectaciones específicas ───────────────────────────────────────────────
  @Column({ default: false })
  disartria: boolean  // dificultad para hablar

  @Column({ default: false })
  disfagia: boolean   // dificultad para tragar

  @Column({ default: false })
  nistagmo: boolean   // movimiento involuntario de ojos

  // ── Cuidado ───────────────────────────────────────────────────────────────
  @Column({ default: false })
  tieneCuidador: boolean

  @Column({ type: 'varchar', nullable: true })
  nombreCuidador: string | null

  @Column({ type: 'text', nullable: true })
  observaciones: string | null

  // ── Quién registró ────────────────────────────────────────────────────────
  @Column({ nullable: true })
  registradoPorId: number | null

  @ManyToOne(() => User, { nullable: true, eager: false })
  @JoinColumn({ name: 'registradoPorId' })
  registradoPor: User | null

  // Solo createdAt — sin updatedAt (registro inmutable)
  @CreateDateColumn()
  createdAt: Date
}
