import { PartialType } from '@nestjs/swagger';
import { CreateComunaDto } from './create-comuna.dto';

export class UpdateComunaDto extends PartialType(CreateComunaDto) {}
