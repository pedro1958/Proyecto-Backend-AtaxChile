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
import { Region } from '../../geo/entities/region.entity';
import { Comuna } from '../../geo/entities/comuna.entity';
import { AtaxiaType } from '../../ataxia-types/entities/ataxia-type.entity';
import { User } from '../../users/entities/user.entity';

export enum EstadoSocio {
  ACTIVO = 'activo',
  RENUNCIADO = 'renunciado',
  SUSPENDIDO = 'suspendido',
  FALLECIDO = 'fallecido',
}

export enum EstadoCivil {
  SOLTERO = 'soltero',
  CASADO = 'casado',
  VIUDO = 'viudo',
  DIVORCIADO = 'divorciado',
}

export enum TipoRepresentacion {
  PADRE_MADRE = 'padre_madre',
  CONYUGE = 'conyuge',
  HIJO_HIJA = 'hijo_hija',
  TUTOR_LEGAL = 'tutor_legal',
  CUIDADOR = 'cuidador',
  OTRO = 'otro',
}

@Entity('miembros')
export class Miembro {
  @PrimaryGeneratedColumn()
  id: number;

  // ── Identidad ─────────────────────────────────────────────────────────────
  @Column({ unique: true })
  rut: string;

  @Column()
  nombre: string;

  @Column({ type: 'date', nullable: true })
  fechaNacimiento: string | null;

  @Column({ type: 'varchar', nullable: true })
  estadoCivil: EstadoCivil | null;

  @Column({ type: 'varchar', nullable: true })
  profesion: string | null;

  // ── Contacto ──────────────────────────────────────────────────────────────
  @Column({ type: 'varchar', nullable: true })
  telefono: string | null;

  @Column({ type: 'varchar', nullable: true })
  celular: string | null;

  @Column({ type: 'varchar', nullable: true })
  email: string | null;

  @Column({ type: 'varchar', nullable: true })
  direccion: string | null;

  // ── Geo ───────────────────────────────────────────────────────────────────
  @Column({ nullable: true })
  regionId: number | null;

  @ManyToOne(() => Region, { nullable: true, eager: false })
  @JoinColumn({ name: 'regionId' })
  region: Region | null;

  @Column({ nullable: true })
  comunaId: number | null;

  @ManyToOne(() => Comuna, { nullable: true, eager: false })
  @JoinColumn({ name: 'comunaId' })
  comuna: Comuna | null;

  // ── Representación ────────────────────────────────────────────────────────
  @Column({ default: false })
  esRepresentante: boolean;

  @Column({ type: 'varchar', nullable: true })
  tipoRepresentacion: TipoRepresentacion | null;

  @Column({ nullable: true })
  representadoId: number | null;

  @ManyToOne(() => Miembro, { nullable: true, eager: false })
  @JoinColumn({ name: 'representadoId' })
  representado: Miembro | null;

  @Column({ type: 'varchar', nullable: true })
  representadoNombre: string | null;

  @Column({ type: 'varchar', nullable: true })
  representadoRut: string | null;

  // ── Diagnóstico ───────────────────────────────────────────────────────────
  @Column({ nullable: true })
  tipoAtaxiaId: number | null;

  @ManyToOne(() => AtaxiaType, { nullable: true, eager: false })
  @JoinColumn({ name: 'tipoAtaxiaId' })
  tipoAtaxia: AtaxiaType | null;

  // ── Estado del socio ──────────────────────────────────────────────────────
  @Column({ type: 'varchar', default: EstadoSocio.ACTIVO })
  estado: EstadoSocio;

  @Column({ type: 'date' })
  fechaInscripcion: string;

  @Column({ type: 'date', nullable: true })
  fechaCambioEstado: string | null;

  // ── Cuenta de sistema (opcional) ──────────────────────────────────────────
  @Column({ nullable: true, unique: true })
  userId: number | null;

  @OneToOne(() => User, { nullable: true, eager: false })
  @JoinColumn({ name: 'userId' })
  user: User | null;

  // ── Auditoría ─────────────────────────────────────────────────────────────
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
