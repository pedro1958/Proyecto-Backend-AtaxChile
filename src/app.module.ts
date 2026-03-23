import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { GeoModule } from './geo/geo.module';
import { AtaxiaTypesModule } from './ataxia-types/ataxia-types.module';
import { MiembrosModule } from './miembros/miembros.module';
import { DiagnosticoClinicoModule } from './diagnostico-clinico/diagnostico-clinico.module';
import { EvaluacionFuncionalModule } from './evaluacion-funcional/evaluacion-funcional.module';
import { StatsModule } from './stats/stats.module';
import { AuditModule } from './audit/audit.module';
import { ExportsModule } from './exports/exports.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        name: 'global',
        ttl: 60_000, // 60 segundos
        limit: 60, // 60 requests por minuto (uso general)
      },
    ]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const env = config.get<string>('NODE_ENV');

        if (env === 'production' || env === 'development') {
          return {
            type: 'postgres',
            host: config.get<string>('DB_HOST'),
            port: parseInt(config.get<string>('DB_PORT') ?? '5432', 10),
            username: config.get<string>('DB_USER'),
            password: config.get<string>('DB_PASSWORD'),
            database: config.get<string>('DB_NAME'),
            autoLoadEntities: true,
            synchronize: env === 'development', // solo en dev, prod usa migraciones
            ssl: env === 'production' ? { rejectUnauthorized: false } : false,
          };
        }

        // NODE_ENV=test — SQLite en memoria, sin estado entre ejecuciones
        return {
          type: 'better-sqlite3',
          database: ':memory:',
          autoLoadEntities: true,
          synchronize: true,
        };
      },
    }),
    UsersModule,
    AuthModule,
    GeoModule,
    AtaxiaTypesModule,
    MiembrosModule,
    DiagnosticoClinicoModule,
    EvaluacionFuncionalModule,
    StatsModule,
    AuditModule,
    ExportsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
