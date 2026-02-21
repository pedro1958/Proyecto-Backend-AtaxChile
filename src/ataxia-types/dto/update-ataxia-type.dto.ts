import { PartialType } from '@nestjs/mapped-types'
import { CreateAtaxiaTypeDto } from './create-ataxia-type.dto'

export class UpdateAtaxiaTypeDto extends PartialType(CreateAtaxiaTypeDto) {}
