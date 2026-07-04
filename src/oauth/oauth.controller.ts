/** @format */

import {
    Controller,
    Post,
    Get,
    Req,
    Res,
    HttpCode,
    HttpStatus,
    UseGuards,
    NotFoundException,
    UnauthorizedException,
    BadRequestException,
} from "@nestjs/common";
import type {
    Request as ExpressRequest,
    Response as ExpressResponse,
} from "express";
import OAuth2Server from "@node-oauth/oauth2-server";
import { OAuthService } from "./oauth.service";
import { OAuthGuard, RequireScopes } from "./guards/oauth.guard";

@Controller("oauth2")
export class OAuthController {
    constructor(private readonly oauth: OAuthService) {}

    /**
     * RFC 6749 §3.1 / §4.1.1 authorization endpoint.
     * Assumes the caller is already authenticated (session cookie / SSO
     * interaction) — this endpoint issues the code, it does not log the
     * user in. If there's no authenticated session, 401.
     */
    @Post("authorize")
    async authorize(
        @Req() req: ExpressRequest,
        @Res() res: ExpressResponse,
    ): Promise<void> {
        const {
            clientId,
            clientSecret,
            codeChallenge,
            codeChallengeMethod,
            redirectUri,
            responseType,
            scope,
            state,
        } = req.body as Record<string, string | undefined>;

        const userId = req.session?.userId;
        if (!userId) {
            throw new UnauthorizedException(
                "User must be authenticated to authorize a client",
            );
        }

        if (!clientId || !redirectUri) {
            throw new BadRequestException("clientId and redirectUri are required");
        }

        // PKCE is mandatory for public clients — enforce it here rather than
        // relying on the model to reject silently.
        if (codeChallenge && !codeChallengeMethod) {
            throw new BadRequestException(
                "codeChallengeMethod is required when codeChallenge is present",
            );
        }
        if (codeChallengeMethod && codeChallengeMethod !== "S256") {
            throw new BadRequestException(
                "Only S256 is supported for codeChallengeMethod",
            );
        }

        // Normalize camelCase body -> snake_case the library expects.
        req.body = {
            ...req.body,
            client_id: clientId,
            client_secret: clientSecret,
            code_challenge: codeChallenge,
            code_challenge_method: codeChallengeMethod,
            redirect_uri: redirectUri,
            response_type: responseType ?? "code",
            scope,
            state,
        };

        const oauthReq = new OAuth2Server.Request(req);
        const oauthRes = new OAuth2Server.Response(res);

        try {
            const code = await this.oauth.server.authorize(oauthReq, oauthRes, {
                authenticateHandler: {
                    handle: () => ({ id: userId }),
                },
            });

            res.set(oauthRes.headers);
            res.status(oauthRes.status ?? HttpStatus.OK).json({
                code: code.authorizationCode,
                redirect_uri: code.redirectUri,
                state,
            });
        } catch (err) {
            this.handleOAuthError(err, oauthRes, res, redirectUri, state);
        }
    }

    @Post("token")
    @HttpCode(HttpStatus.OK)
    async token(
        @Req() req: ExpressRequest,
        @Res() res: ExpressResponse,
    ): Promise<void> {
        const oauthReq = new OAuth2Server.Request(req);
        const oauthRes = new OAuth2Server.Response(res);

        try {
            const token = await this.oauth.server.token(oauthReq, oauthRes, {
                requireClientAuthentication: {
                    authorization_code: false,
                    password: false,
                },
            });

            res.set(oauthRes.headers);
            res.status(oauthRes.status ?? HttpStatus.OK).json(token);
        } catch (err) {
            this.handleOAuthError(err, oauthRes, res);
        }
    }

    /**
     * RFC 7009 — token revocation. Client authenticates via client_id
     * (+ client_secret for confidential clients), then either token type
     * is looked up and revoked. Always 200 per spec, even if the token
     * doesn't exist, to avoid token-scanning oracles.
     */
    @Post("revoke")
    @HttpCode(HttpStatus.OK)
    async revoke(
        @Req() req: ExpressRequest,
        @Res() res: ExpressResponse,
    ): Promise<void> {
        const { token, token_type_hint, client_id, client_secret } =
            req.body as Record<string, string | undefined>;

        if (!token || !client_id) {
            throw new BadRequestException("token and client_id are required");
        }

        const client = await this.oauth.validateClient(client_id, client_secret);
        if (!client) {
            throw new UnauthorizedException("Invalid client credentials");
        }

        await this.oauth.revokeToken(token, token_type_hint, client_id);

        res.status(HttpStatus.OK).end();
    }

    /**
     * RFC 7662 — token introspection, restricted to the resource server /
     * client that owns the token (basic client auth).
     */
    @Post("introspect")
    @HttpCode(HttpStatus.OK)
    async introspect(
        @Req() req: ExpressRequest,
        @Res() res: ExpressResponse,
    ): Promise<void> {
        const { token, token_type_hint, client_id, client_secret } =
            req.body as Record<string, string | undefined>;

        if (!token || !client_id) {
            throw new BadRequestException("token and client_id are required");
        }

        const client = await this.oauth.validateClient(client_id, client_secret);
        if (!client) {
            throw new UnauthorizedException("Invalid client credentials");
        }

        const result = await this.oauth.introspectToken(
            token,
            token_type_hint,
            client_id,
        );

        if (!result) {
            res.status(HttpStatus.OK).json({ active: false });
            return;
        }

        res.status(HttpStatus.OK).json({
            active: true,
            scope: result.scope,
            client_id: result.clientId,
            sub: result.userId,
            exp: result.expiresAt
                ? Math.floor(result.expiresAt.getTime() / 1000)
                : undefined,
            token_type: result.tokenType,
        });
    }

    @UseGuards(OAuthGuard)
    @RequireScopes("profile", "email")
    @Get("profile")
    async profile(
        @Req() req: ExpressRequest,
    ): Promise<Record<string, unknown>> {
        const oauth = req.oauth;
        if (!oauth) throw new UnauthorizedException("No token on request");
        const { token } = oauth;
        const user = token.user;
        if (!user) throw new NotFoundException("User not found on token");

        return {
            sub: user.id,
            email: user.email,
            name: user.name,
            scope: token.scope,
            expires_at: token.accessTokenExpiresAt,
        };
    }

    private handleOAuthError(
        err: unknown,
        oauthRes: OAuth2Server.Response,
        res: ExpressResponse,
        redirectUri?: string,
        state?: string,
    ): void {
        if (err instanceof OAuth2Server.OAuthError) {
            res.set(oauthRes.headers);

            // For authorize errors, redirect back per RFC 6749 §4.1.2.1
            // instead of returning JSON, when we have somewhere to send it.
            if (redirectUri) {
                const url = new URL(redirectUri);
                url.searchParams.set("error", err.name);
                url.searchParams.set("error_description", err.message);
                if (state) url.searchParams.set("state", state);
                res.redirect(HttpStatus.FOUND, url.toString());
                return;
            }

            res.status(err.code ?? HttpStatus.BAD_REQUEST).json({
                error: err.name,
                error_description: err.message,
            });
            return;
        }
        throw err;
    }
}