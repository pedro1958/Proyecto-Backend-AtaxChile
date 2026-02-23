import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // Headers de seguridad HTTP (clickjacking, MIME sniffing, XSS, HSTS, etc.)
  const { default: helmet } = await import('helmet')
  app.use(helmet())

  app.setGlobalPrefix('api/v1')
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  )
  app.enableCors({
    origin: process.env.FRONTEND_URL,
  })

  const config = new DocumentBuilder()
    .setTitle('AtaxChile API')
    .setDescription('Sistema de registro de miembros de la Agrupación AtaxChile')
    .setVersion('1.0')
    .addBearerAuth()
    .build()

  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api/docs', app, document)

  await app.listen(process.env.PORT ?? 5000)
}
bootstrap()
