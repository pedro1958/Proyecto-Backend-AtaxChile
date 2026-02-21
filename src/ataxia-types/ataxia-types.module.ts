import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AtaxiaType } from './entities/ataxia-type.entity'
import { AtaxiaTypesService } from './ataxia-types.service'
import { AtaxiaTypesController } from './ataxia-types.controller'
import { AtaxiaTypesSeeder } from './ataxia-types.seeder'

@Module({
  imports: [TypeOrmModule.forFeature([AtaxiaType])],
  controllers: [AtaxiaTypesController],
  providers: [AtaxiaTypesService, AtaxiaTypesSeeder],
  exports: [AtaxiaTypesService],
})
export class AtaxiaTypesModule {}
