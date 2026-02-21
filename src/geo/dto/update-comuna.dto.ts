import { PartialType } from '@nestjs/mapped-types'
import { CreateComunaDto } from './create-comuna.dto'

export class UpdateComunaDto extends PartialType(CreateComunaDto) {}
