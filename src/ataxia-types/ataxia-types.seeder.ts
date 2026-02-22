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
  { nombre: 'SCA4 (Ataxia Espinocerebelosa tipo 4)', grupo: GrupoAtaxia.HEREDITARIA },
  { nombre: 'SCA5 (Ataxia Espinocerebelosa tipo 5)', grupo: GrupoAtaxia.HEREDITARIA },
  { nombre: 'SCA6 (Ataxia Espinocerebelosa tipo 6)', grupo: GrupoAtaxia.HEREDITARIA },
  { nombre: 'SCA7 (Ataxia Espinocerebelosa tipo 7)', grupo: GrupoAtaxia.HEREDITARIA },
  { nombre: 'SCA8 (Ataxia Espinocerebelosa tipo 8)', grupo: GrupoAtaxia.HEREDITARIA },
  { nombre: 'SCA10 (Ataxia Espinocerebelosa tipo 10)', grupo: GrupoAtaxia.HEREDITARIA },
  { nombre: 'SCA11 (Ataxia Espinocerebelosa tipo 11)', grupo: GrupoAtaxia.HEREDITARIA },
  { nombre: 'SCA12 (Ataxia Espinocerebelosa tipo 12)', grupo: GrupoAtaxia.HEREDITARIA },
  { nombre: 'SCA13 (Ataxia Espinocerebelosa tipo 13)', grupo: GrupoAtaxia.HEREDITARIA },
  { nombre: 'SCA14 (Ataxia Espinocerebelosa tipo 14)', grupo: GrupoAtaxia.HEREDITARIA },
  { nombre: 'SCA15 (Ataxia Espinocerebelosa tipo 15)', grupo: GrupoAtaxia.HEREDITARIA },
  { nombre: 'SCA16 (Ataxia Espinocerebelosa tipo 16)', grupo: GrupoAtaxia.HEREDITARIA },
  { nombre: 'SCA17 (Ataxia Espinocerebelosa tipo 17)', grupo: GrupoAtaxia.HEREDITARIA },
  { nombre: 'SCA18 (Ataxia Espinocerebelosa tipo 18)', grupo: GrupoAtaxia.HEREDITARIA },
  { nombre: 'SCA19 (Ataxia Espinocerebelosa tipo 19)', grupo: GrupoAtaxia.HEREDITARIA },
  { nombre: 'SCA20 (Ataxia Espinocerebelosa tipo 20)', grupo: GrupoAtaxia.HEREDITARIA },
  { nombre: 'SCA21 (Ataxia Espinocerebelosa tipo 21)', grupo: GrupoAtaxia.HEREDITARIA },
  { nombre: 'SCA22 (Ataxia Espinocerebelosa tipo 22)', grupo: GrupoAtaxia.HEREDITARIA },
  { nombre: 'SCA23 (Ataxia Espinocerebelosa tipo 23)', grupo: GrupoAtaxia.HEREDITARIA },
  { nombre: 'SCA25 (Ataxia Espinocerebelosa tipo 25)', grupo: GrupoAtaxia.HEREDITARIA },
  { nombre: 'SCA26 (Ataxia Espinocerebelosa tipo 26)', grupo: GrupoAtaxia.HEREDITARIA },
  { nombre: 'SCA27 (Ataxia Espinocerebelosa tipo 27)', grupo: GrupoAtaxia.HEREDITARIA },
  { nombre: 'SCA28 (Ataxia Espinocerebelosa tipo 28)', grupo: GrupoAtaxia.HEREDITARIA },
  { nombre: 'SCA29 (Ataxia Espinocerebelosa tipo 29)', grupo: GrupoAtaxia.HEREDITARIA },
  { nombre: 'SCA30 (Ataxia Espinocerebelosa tipo 30)', grupo: GrupoAtaxia.HEREDITARIA },
  { nombre: 'DRPLA (Atrofia Dentatorubral-Pallidoluisiana)', grupo: GrupoAtaxia.HEREDITARIA, descripcion: 'Expansión de trinucleótidos CAG en el gen ATN1. Más frecuente en Japón.' },
  { nombre: 'FXTAS (Síndrome de Temblor-Ataxia Asociado al Cromosoma X Frágil)', grupo: GrupoAtaxia.HEREDITARIA, descripcion: 'Ligada al X. Afecta principalmente a varones portadores de premutación del gen FMR1.' },
  { nombre: 'Ataxia-Telangiectasia', grupo: GrupoAtaxia.HEREDITARIA, descripcion: 'Autosómica recesiva. Gen ATM. Asociada a inmunodeficiencia y riesgo oncológico.' },
  { nombre: 'AOA1 (Ataxia con Apraxia Oculomotora tipo 1)', grupo: GrupoAtaxia.HEREDITARIA },
  { nombre: 'AOA2 (Ataxia con Apraxia Oculomotora tipo 2)', grupo: GrupoAtaxia.HEREDITARIA },
  { nombre: 'ARSACS (Ataxia Espinocerebelosa Autosómica Recesiva de Charlevoix-Saguenay)', grupo: GrupoAtaxia.HEREDITARIA },
  { nombre: 'MIRAS (Síndrome Mitocondrial de Ataxia Recesiva)', grupo: GrupoAtaxia.HEREDITARIA, descripcion: 'Ataxia recesiva de origen mitocondrial. Gen POLG.' },
  { nombre: 'Síndrome de Marinesco-Sjögren (MSS)', grupo: GrupoAtaxia.HEREDITARIA, descripcion: 'Autosómica recesiva. Gen SIL1. Asociada a cataratas, miopatía y discapacidad intelectual.' },
  { nombre: 'Ataxia Episódica tipo 1', grupo: GrupoAtaxia.HEREDITARIA },
  { nombre: 'Ataxia Episódica tipo 2', grupo: GrupoAtaxia.HEREDITARIA },
  { nombre: 'Ataxia Episódica tipo 3', grupo: GrupoAtaxia.HEREDITARIA },
  { nombre: 'Ataxia Episódica tipo 4', grupo: GrupoAtaxia.HEREDITARIA },
  { nombre: 'Ataxia Episódica tipo 5', grupo: GrupoAtaxia.HEREDITARIA },
  { nombre: 'Ataxia Episódica tipo 6', grupo: GrupoAtaxia.HEREDITARIA },
  { nombre: 'Ataxia Episódica tipo 7', grupo: GrupoAtaxia.HEREDITARIA },
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
  { nombre: 'Ataxia Cerebelosa Adquirida (no especificada)', grupo: GrupoAtaxia.ADQUIRIDA },
  { nombre: 'Ataxia por Atrofia Cerebelosa', grupo: GrupoAtaxia.ADQUIRIDA },
  { nombre: 'Otra ataxia adquirida', grupo: GrupoAtaxia.ADQUIRIDA },

  // ── Idiopáticas ───────────────────────────────────────────────────────────
  { nombre: 'SAOA (Ataxia Cerebelosa Idiopática de Inicio Tardío)', grupo: GrupoAtaxia.IDIOPATICA, descripcion: 'Ataxia esporádica de inicio en adultos sin causa identificada. También llamada ILOCA.' },
  { nombre: 'Ataxia esporádica no clasificada', grupo: GrupoAtaxia.IDIOPATICA },

  // ── Otra ─────────────────────────────────────────────────────────────────
  { nombre: 'Desconocida / Sin diagnóstico', grupo: GrupoAtaxia.OTRA, descripcion: 'Paciente sin diagnóstico etiológico establecido.' },
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
