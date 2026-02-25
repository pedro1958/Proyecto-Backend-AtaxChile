import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm'

export enum Rol {
  SUPERADMIN = 'superadmin',
  ADMIN = 'admin',
  SECRETARIO = 'secretario',
  TESORERO = 'tesorero',
  USUARIO = 'usuario',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ unique: true })
  email: string

  @Column()
  nombre: string

  @Column()
  password: string

  @Column({ type: 'simple-enum', enum: Rol, default: Rol.USUARIO })
  rol: Rol

  @Column({ default: true })
  activo: boolean

  @Column({ default: false })
  cuentaActivada: boolean

  @Column({ type: 'varchar', nullable: true })
  tokenActivacion: string | null

  @Column({ type: 'timestamptz', nullable: true })
  tokenExpiracion: Date | null

  @Column({ type: 'varchar', nullable: true })
  resetPasswordToken: string | null

  @Column({ type: 'timestamptz', nullable: true })
  resetPasswordExpires: Date | null

  @Column({ type: 'varchar', nullable: true })
  refreshToken: string | null

  @Column({ type: 'timestamptz', nullable: true })
  refreshTokenExpires: Date | null

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
