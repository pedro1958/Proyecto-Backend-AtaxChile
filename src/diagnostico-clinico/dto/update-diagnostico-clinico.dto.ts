import { PartialType } from '@nestjs/swagger'
import { CreateDiagnosticoClinicoDto } from './create-diagnostico-clinico.dto'

export class UpdateDiagnosticoClinicoDto extends PartialType(CreateDiagnosticoClinicoDto) {}
