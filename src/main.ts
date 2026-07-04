import { Logger, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const port = Number(process.env.PORT ?? 5000);
  const logger = new Logger("CoreApi");

  try {
    const app = await NestFactory.create(AppModule);

    app.setGlobalPrefix("v1", { exclude: ["/", "health"] });
    app.enableCors({
      origin: true,
      credentials: true,
    });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    const config = new DocumentBuilder()
      .setTitle("App Store Platform API")
      .setDescription("Production-grade backend for app publishing and distribution")
      .setVersion("1.0")
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("docs", app, document);

    await app.listen(port, "0.0.0.0");
    logger.log(`Application listening on port ${port}`);
  } catch (error) {
    logger.error("Server start failed", error);
  }
}

void bootstrap();
