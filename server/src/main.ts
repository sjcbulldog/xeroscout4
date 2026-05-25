import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, { bufferLogs: true });

    app.setGlobalPrefix('api/v1');

    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
    }));

    app.enableCors();

    const swaggerConfig = new DocumentBuilder()
        .setTitle('XeroScout 4 API')
        .setDescription('FRC scouting REST API')
        .setVersion('4.0')
        .addBearerAuth()
        .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);

    const port = process.env.PORT ? parseInt(process.env.PORT) : 4560;
    await app.listen(port);
    console.log(`XeroScout server listening on port ${port}`);
}

bootstrap();
