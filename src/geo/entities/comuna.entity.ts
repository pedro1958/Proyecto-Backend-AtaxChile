import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Region } from './region.entity';

@Entity('comunas')
export class Comuna {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column()
  regionId: number;

  @ManyToOne(() => Region, (region) => region.comunas)
  @JoinColumn({ name: 'regionId' })
  region: Region;
}
