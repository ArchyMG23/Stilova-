import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Establish General Production Security Headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
        connectSrc: ["'self'", "https://api.stilova.com", "wss://api.stilova.com"]
      }
    }
  }));

  // 2. Enable Cross-Origin Resource Sharing (CORS)
  app.enableCors({
    origin: process.env.CORS_ALLOWED_ORIGINS ? process.env.CORS_ALLOWED_ORIGINS.split(',') : '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // 3. Register Global Standard Validation Pipes for DTO structures
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }));

  // 4. Configure unified Swagger UI Specification
  const config = new DocumentBuilder()
    .setTitle('📖 Stilova Platform Core Engine')
    .setDescription('Spécification et documentation de l\'API REST complète de la plateforme Panafricaine interactive.')
    .setVersion('1.0.0')
    .addBearerAuth({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Insérez votre jeton d\'accès JWT Bearer pour authentifier vos requêtes.',
        in: 'header'
    })
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // 5. Mount Server of container ingress (Binding to port 3000)
  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0', () => {
    console.log(`[🚀 Stilova Engine] Server running on http://0.0.0.0:${port}`);
    console.log(`[📖 Swagger Specs ] Interactive sandbox document accessible on /api/docs`);
  });
}

bootstrap();
