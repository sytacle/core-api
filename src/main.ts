/** @format */

import { NestFactory } from "@nestjs/core";
import { Logger, ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";

async function bootstrap() {
    const PORT = parseInt(process.env.PORT ?? "5000", 10);
    const isProduction = process.env.NODE_ENV === "production";
    const logger = new Logger("Sytacle");
    try {
        const app = await NestFactory.create(AppModule);

        app.setGlobalPrefix("v2", { exclude: ["/", "oauth2/*path"] });

        const DEV_URIS = [
            "http://localhost:5173",
            "https://localhost:5173",
            "http://localhost:3000",
            "https://localhost:3000",
        ];

        app.enableCors({
            origin: (origin, callback) => {
                const allowed = [
                    ...(!isProduction ? DEV_URIS : []),
                    process.env.REPL_SLUG
                        ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.replit.dev`
                        : process.env.FRONTEND_URL,
                    process.env.FRONTEND_URL,
                ].filter(Boolean);

                if (!origin || allowed.includes(origin)) {
                    callback(null, true);
                } else {
                    callback(new Error(`CORS blocked: ${origin}`), false);
                }
            },
            credentials: false,
            methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
            allowedHeaders: ["Content-Type", "Authorization", "Accept"],
        });

        app.useGlobalPipes(
            new ValidationPipe({
                whitelist: true,
                transform: true,
                forbidNonWhitelisted: true,
            }),
        );

        await app.listen(PORT, "0.0.0.0");
        const shutdown = async (signal: string) => {
            logger.log(`Received ${signal}, shutting down gracefully...`);

            try {
                await app.close();
                process.exit(0);
            } catch (error) {
                logger.error(
                    "Error during shutdown",
                    error instanceof Error ? error.stack : String(error),
                );
                process.exit(1);
            }
        };

        process.on("SIGTERM", () => void shutdown("SIGTERM"));
        process.on("SIGINT", () => void shutdown("SIGINT"));
    } catch (error) {
        logger.error("Server start failed", error);
    }
}

void bootstrap();
