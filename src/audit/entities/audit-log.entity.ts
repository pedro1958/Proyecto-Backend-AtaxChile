import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum AccionAudit {
  LOGIN = 'LOGIN',
  LOGIN_FALLIDO = 'LOGIN_FALLIDO',
  LOGOUT = 'LOGOUT',
  CREAR_MIEMBRO = 'CREAR_MIEMBRO',
  MODIFICAR_MIEMBRO = 'MODIFICAR_MIEMBRO',
  CAMBIAR_ESTADO_MIEMBRO = 'CAMBIAR_ESTADO_MIEMBRO',
  CREAR_DIAGNOSTICO = 'CREAR_DIAGNOSTICO',
  MODIFICAR_DIAGNOSTICO = 'MODIFICAR_DIAGNOSTICO',
  CREAR_EVALUACION = 'CREAR_EVALUACION',
  CAMBIAR_ROL = 'CAMBIAR_ROL',
  CONSULTAR_STATS = 'CONSULTAR_STATS',
  ACTIVAR_CUENTA = 'ACTIVAR_CUENTA',
  CAMBIAR_PASSWORD = 'CAMBIAR_PASSWORD',
}

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: AccionAudit })
  accion: AccionAudit;

  @Column({ nullable: true, type: 'varchar' })
  entidad: string | null;

  @Column({ nullable: true, type: 'int' })
  entidadId: number | null;

  @Column({ nullable: true, type: 'int' })
  usuarioId: number | null;

  @Column({ nullable: true, type: 'varchar', length: 45 })
  ip: string | null;

  @Column({ nullable: true, type: 'jsonb' })
  detalle: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt: Date;
}
