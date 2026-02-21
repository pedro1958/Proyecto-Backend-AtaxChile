import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Region } from './entities/region.entity'
import { Comuna } from './entities/comuna.entity'
import { GeoService } from './geo.service'
import { GeoController } from './geo.controller'
import { GeoSeeder } from './geo.seeder'

@Module({
  imports: [TypeOrmModule.forFeature([Region, Comuna])],
  controllers: [GeoController],
  providers: [GeoService, GeoSeeder],
  exports: [GeoService],
})
export class GeoModule {}
