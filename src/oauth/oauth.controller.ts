import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import type {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from "express";
import OAuth2Server from "@node-oauth/oauth2-server";
import { OAuthService } from "./oauth.service";
import { OAuthGuard, RequireScopes } from "./guards/oauth.guard";

@Controller("oauth")
export class OAuthController {
  constructor(private readonly oauth: OAuthService) {}

  @Post("token")
  @HttpCode(HttpStatus.OK)
  async token(
    @Req() req: ExpressRequest,
    @Res() res: ExpressResponse,
  ): Promise<void> {
    const oauthReq = new OAuth2Server.Request(req);
    const oauthRes = new OAuth2Server.Response(res);

    try {
      const token = await this.oauth.server.token(oauthReq, oauthRes);
      res.set(oauthRes.headers);
      res.status(oauthRes.status ?? HttpStatus.OK).json(token);
    } catch (err: any) {
      res.status(err?.code ?? HttpStatus.BAD_REQUEST).json({
        error: err?.name || "server_error",
        error_description: err?.message || "An error occurred",
      });
    }
  }

  @Post("revoke")
  @HttpCode(HttpStatus.OK)
  async revoke(
    @Body() body: { token: string; client_id: string; client_secret?: string },
    @Res() res: ExpressResponse,
  ): Promise<void> {
    const { token, client_id, client_secret } = body;
    if (!token || !client_id) {
      res.status(HttpStatus.BAD_REQUEST).json({
        error: "invalid_request",
        error_description: "token and client_id are required",
      });
      return;
    }

    await this.oauth.revokeToken(token, undefined, client_id);
    res.status(HttpStatus.OK).end();
  }

  @Post("introspect")
  @HttpCode(HttpStatus.OK)
  async introspect(
    @Body() body: { token: string; client_id: string; client_secret?: string },
    @Res() res: ExpressResponse,
  ): Promise<void> {
    const { token, client_id } = body;
    if (!token || !client_id) {
      res.status(HttpStatus.BAD_REQUEST).json({
        error: "invalid_request",
        error_description: "token and client_id are required",
      });
      return;
    }

    const result = await this.oauth.introspectToken(
      token,
      undefined,
      client_id,
    );
    if (!result) {
      res.status(HttpStatus.OK).json({ active: false });
      return;
    }

    res.status(HttpStatus.OK).json({
      active: true,
      scope: (result.scope || []).join(" "),
      client_id,
      sub: result.userId,
      token_type: result.tokenType,
    });
  }

  @UseGuards(OAuthGuard)
  @RequireScopes("profile", "email")
  @Get("profile")
  async profile(@Req() req: ExpressRequest, @Res() res: ExpressResponse) {
    const oauth = (req as any).oauth;
    if (!oauth?.token) {
      res.status(HttpStatus.UNAUTHORIZED).json({ error: "unauthorized" });
      return;
    }

    const token = oauth.token;
    res.status(HttpStatus.OK).json({
      sub: token.user?.id,
      email: token.user?.email,
      name: token.user?.displayName,
      scope: (token.scope || []).join(" "),
      iat: Math.floor(
        token.accessTokenExpiresAt.getTime() / 1000 - 4 * 60 * 60,
      ),
      exp: Math.floor(token.accessTokenExpiresAt.getTime() / 1000),
    });
  }
}
