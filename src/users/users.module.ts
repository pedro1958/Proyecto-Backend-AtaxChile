import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { User } from './entities/user.entity'
import { UsersController } from './users.controller'
import { UsersService } from './users.service'
import { MailerModule } from '../mailer/mailer.module'

@Module({
  imports: [TypeOrmModule.forFeature([User]), MailerModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
