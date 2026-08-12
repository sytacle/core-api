import { Injectable } from "@nestjs/common";
import OAuth2Server from "@node-oauth/oauth2-server";
import { OAuthModel } from "./models/oauth.model";

@Injectable()
export class OAuthService {
  readonly server: OAuth2Server;

  constructor(private readonly model: OAuthModel) {
    this.server = new OAuth2Server({
      model: model,
      allowBearerTokensInQueryString: false,
      accessTokenLifetime: 4 * 60 * 60,
      refreshTokenLifetime: 90 * 24 * 60 * 60,
    });
  }

  validateClient(clientId: string, clientSecret?: string) {
    return this.model.getClient(clientId, clientSecret);
  }

  async revokeToken(token: string, tokenTypeHint?: string, clientId?: string) {
    return this.model.revokeToken({ refreshToken: token });
  }

  async introspectToken(
    token: string,
    tokenTypeHint?: string,
    clientId?: string,
  ) {
    const accessToken = await this.model.getAccessToken(token);
    if (accessToken)
      return {
        scope: accessToken.scope,
        clientId: accessToken.client.id,
        userId: accessToken.user?.id,
        tokenType: "Bearer",
        expiresAt: accessToken.accessTokenExpiresAt,
      };
    const refreshToken = await this.model.getRefreshToken(token);
    if (refreshToken)
      return {
        scope: refreshToken.scope,
        clientId: refreshToken.client.id,
        userId: refreshToken.user?.id,
        tokenType: "Refresh",
        expiresAt: refreshToken.refreshTokenExpiresAt,
      };
    return null;
  }
}
