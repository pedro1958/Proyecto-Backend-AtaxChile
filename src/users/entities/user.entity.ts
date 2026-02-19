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

  @Column({ type: 'enum', enum: Rol })
  rol: Rol

  @Column({ default: true })
  activo: boolean

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
