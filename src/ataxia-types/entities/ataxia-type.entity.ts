import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'

export enum GrupoAtaxia {
  HEREDITARIA = 'hereditaria',
  ADQUIRIDA = 'adquirida',
  IDIOPATICA = 'idiopatica',
  OTRA = 'otra',
}

@Entity('ataxia_types')
export class AtaxiaType {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  nombre: string

  @Column({ type: 'varchar' })
  grupo: GrupoAtaxia

  @Column({ nullable: true, type: 'varchar' })
  descripcion: string | null

  @Column({ default: true })
  activo: boolean

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
