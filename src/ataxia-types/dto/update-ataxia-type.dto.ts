import { PartialType } from '@nestjs/swagger'
import { CreateAtaxiaTypeDto } from './create-ataxia-type.dto'

export class UpdateAtaxiaTypeDto extends PartialType(CreateAtaxiaTypeDto) {}
