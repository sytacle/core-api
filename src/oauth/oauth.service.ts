import { Injectable } from "@nestjs/common";
import OAuth2Server from "@node-oauth/oauth2-server";
import { OAuthModel } from "./models/oauth.model";

@Injectable()
export class OAuthService {
  readonly server: OAuth2Server;
  private model: OAuthModel;

  constructor(model: OAuthModel) {
    this.model = model;
    this.server = new OAuth2Server({
      model,
      allowBearerTokensInQueryString: true,
      accessTokenLifetime: 4 * 60 * 60,
    });
  }

  async validateClient(clientId: string, clientSecret?: string) {
    return this.model.getClient(clientId, clientSecret);
  }

  async revokeToken(token: string, tokenTypeHint?: string, clientId?: string) {
    return true;
  }

  async introspectToken(token: string, tokenTypeHint?: string, clientId?: string) {
    if (tokenTypeHint === "access_token") {
      const accessToken = await this.model.getAccessToken(token);
      return accessToken ? { scope: accessToken.scope, clientId, userId: accessToken.user?.id, tokenType: "Bearer", expiresAt: accessToken.accessTokenExpiresAt } : null;
    }
    return null;
  }
}


