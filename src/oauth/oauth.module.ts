import { Module } from "@nestjs/common";
import { OAuthController } from "./oauth.controller";
import { OAuthService } from "./oauth.service";
import { OAuthModel } from "./models/oauth.model";

@Module({
  imports: [],
  controllers: [OAuthController],
  providers: [OAuthModel, OAuthService],
})
export class OAuthModule {}
