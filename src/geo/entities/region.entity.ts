import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { Comuna } from './comuna.entity'

@Entity('regiones')
export class Region {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ unique: true })
  nombre: string

  @OneToMany(() => Comuna, (comuna) => comuna.region)
  comunas: Comuna[]
}
