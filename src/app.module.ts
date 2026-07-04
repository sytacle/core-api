/** @format */

import { Module } from "@nestjs/common";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { OAuthModule } from "./oauth/oauth.module";

@Module({
    imports: [
        OAuthModule,
        ThrottlerModule.forRoot([
            {
                ttl: 60_000, // 1 minute
                limit: 100, // 100 requests
            },
        ]),
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
