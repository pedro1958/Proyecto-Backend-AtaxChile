import { Injectable, OnApplicationBootstrap } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { AtaxiaType, GrupoAtaxia } from './entities/ataxia-type.entity'

const SEED_DATA: { nombre: string; grupo: GrupoAtaxia; descripcion?: string }[] = [
  // ── Hereditarias ────────────────────────────────────────────────────────
  { nombre: 'Ataxia de Friedreich', grupo: GrupoAtaxia.HEREDITARIA, descripcion: 'Ataxia hereditaria autosómica recesiva más frecuente. Gen FXN (frataxina).' },
  { nombre: 'SCA1 (Ataxia Espinocerebelosa tipo 1)', grupo: GrupoAtaxia.HEREDITARIA },
  { nombre: 'SCA2 (Ataxia Espinocerebelosa tipo 2)', grupo: GrupoAtaxia.HEREDITARIA },
  { nombre: 'SCA3 (Machado-Joseph)', grupo: GrupoAtaxia.HEREDITARIA, descripcion: 'La ataxia espinocerebelosa hereditaria más frecuente a nivel mundial.' },
  { nombre: 'SCA6 (Ataxia Espinocerebelosa tipo 6)', grupo: GrupoAtaxia.HEREDITARIA },
  { nombre: 'SCA7 (Ataxia Espinocerebelosa tipo 7)', grupo: GrupoAtaxia.HEREDITARIA },
  { nombre: 'SCA8 (Ataxia Espinocerebelosa tipo 8)', grupo: GrupoAtaxia.HEREDITARIA },
  { nombre: 'SCA10 (Ataxia Espinocerebelosa tipo 10)', grupo: GrupoAtaxia.HEREDITARIA },
  { nombre: 'SCA17 (Ataxia Espinocerebelosa tipo 17)', grupo: GrupoAtaxia.HEREDITARIA },
  { nombre: 'Ataxia-Telangiectasia', grupo: GrupoAtaxia.HEREDITARIA, descripcion: 'Autosómica recesiva. Gen ATM. Asociada a inmunodeficiencia y riesgo oncológico.' },
  { nombre: 'AOA1 (Ataxia con Apraxia Oculomotora tipo 1)', grupo: GrupoAtaxia.HEREDITARIA },
  { nombre: 'AOA2 (Ataxia con Apraxia Oculomotora tipo 2)', grupo: GrupoAtaxia.HEREDITARIA },
  { nombre: 'ARSACS (Ataxia Espinocerebelosa Autosómica Recesiva de Charlevoix-Saguenay)', grupo: GrupoAtaxia.HEREDITARIA },
  { nombre: 'Ataxia Episódica tipo 1', grupo: GrupoAtaxia.HEREDITARIA },
  { nombre: 'Ataxia Episódica tipo 2', grupo: GrupoAtaxia.HEREDITARIA },
  { nombre: 'AVED (Ataxia por Déficit de Vitamina E)', grupo: GrupoAtaxia.HEREDITARIA, descripcion: 'Autosómica recesiva. Tratable con suplementación de vitamina E.' },
  { nombre: 'Otra ataxia hereditaria', grupo: GrupoAtaxia.HEREDITARIA },

  // ── Adquiridas ───────────────────────────────────────────────────────────
  { nombre: 'MSA-C (Atrofia Multisistémica tipo cerebelosa)', grupo: GrupoAtaxia.ADQUIRIDA, descripcion: 'Enfermedad neurodegenerativa esporádica. Antes denominada OPCA.' },
  { nombre: 'Ataxia alcohólica', grupo: GrupoAtaxia.ADQUIRIDA, descripcion: 'Degeneración cerebelosa por consumo crónico de alcohol.' },
  { nombre: 'Ataxia paraneoplásica', grupo: GrupoAtaxia.ADQUIRIDA, descripcion: 'Asociada a anticuerpos anti-Yo, anti-Hu u otros marcadores paraneoplásicos.' },
  { nombre: 'Ataxia por enfermedad celíaca (Ataxia por gluten)', grupo: GrupoAtaxia.ADQUIRIDA },
  { nombre: 'Ataxia inmunomediada', grupo: GrupoAtaxia.ADQUIRIDA },
  { nombre: 'CANVAS (Cerebellar Ataxia, Neuropathy, Vestibular Areflexia Syndrome)', grupo: GrupoAtaxia.ADQUIRIDA },
  { nombre: 'Ataxia post-infecciosa', grupo: GrupoAtaxia.ADQUIRIDA },
  { nombre: 'Otra ataxia adquirida', grupo: GrupoAtaxia.ADQUIRIDA },

  // ── Idiopáticas ───────────────────────────────────────────────────────────
  { nombre: 'SAOA (Ataxia Cerebelosa Idiopática de Inicio Tardío)', grupo: GrupoAtaxia.IDIOPATICA, descripcion: 'Ataxia esporádica de inicio en adultos sin causa identificada. También llamada ILOCA.' },
  { nombre: 'Ataxia esporádica no clasificada', grupo: GrupoAtaxia.IDIOPATICA },

  // ── Otra ─────────────────────────────────────────────────────────────────
  { nombre: 'En investigación genética', grupo: GrupoAtaxia.OTRA, descripcion: 'Paciente con estudio genético en curso, sin diagnóstico definitivo.' },
  { nombre: 'Origen combinado o multifactorial', grupo: GrupoAtaxia.OTRA },
]

@Injectable()
export class AtaxiaTypesSeeder implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(AtaxiaType)
    private readonly ataxiaTypesRepository: Repository<AtaxiaType>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const count = await this.ataxiaTypesRepository.count()
    if (count > 0) return

    const tipos = SEED_DATA.map((item) =>
      this.ataxiaTypesRepository.create(item),
    )
    await this.ataxiaTypesRepository.save(tipos)
  }
}
