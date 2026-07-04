import { Module } from "@nestjs/common";
import { ThrottlerModule } from "@nestjs/throttler";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AdminModule } from "./admin/admin.module";
import { AppsModule } from "./apps/apps.module";
import { AuthModule } from "./auth/auth.module";
import { PrismaModule } from "./prisma/prisma.module";
import { PublishersModule } from "./publishers/publishers.module";
import { ReleasesModule } from "./releases/releases.module";
import { ReviewsModule } from "./reviews/reviews.module";
import { UploadsModule } from "./uploads/uploads.module";
import { UsersModule } from "./users/users.module";
import { OAuthModule } from "./oauth/oauth.module";

@Module({
  imports: [
    PrismaModule,
    OAuthModule,
    AuthModule,
    UsersModule,
    PublishersModule,
    AppsModule,
    ReleasesModule,
    ReviewsModule,
    UploadsModule,
    AdminModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 200,
      },
    ]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
