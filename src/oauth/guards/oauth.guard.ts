/** @format */

import {
    Injectable,
    CanActivate,
    ExecutionContext,
    UnauthorizedException,
    ForbiddenException,
    SetMetadata,
    Logger,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import OAuth2Server, { OAuthError } from "@node-oauth/oauth2-server";
import { OAuthService } from "../oauth.service";

export const OAUTH_SCOPES_KEY = "oauth_scopes";

export const RequireScopes = (...scopes: string[]) =>
    SetMetadata(OAUTH_SCOPES_KEY, scopes);

const DEFAULT_SCOPES = [
    "profile",
    "email",
    "offline_access",
    "basic_user_info",
] as const;

@Injectable()
export class OAuthGuard implements CanActivate {
    private readonly logger = new Logger(OAuthGuard.name);

    constructor(
        private readonly oauth: OAuthService,
        private readonly reflector: Reflector,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest();
        const res = context.switchToHttp().getResponse();

        const oauthReq = new OAuth2Server.Request(req);
        const oauthRes = new OAuth2Server.Response(res);

        const requiredScopes = this.reflector.getAllAndOverride<string[]>(
            OAUTH_SCOPES_KEY,
            [context.getHandler(), context.getClass()],
        ) ?? [...DEFAULT_SCOPES];

        try {
            const token = await this.oauth.server.authenticate(
                oauthReq,
                oauthRes,
                {
                    scope: requiredScopes,
                },
            );

            // Attach token data to request for downstream use
            req.oauth = { token };

            return true;
        } catch (err) {
            this.logger.warn(
                `OAuth authentication failed: ${err?.message ?? "unknown error"}`,
                { path: req.url, method: req.method },
            );

            // Surface meaningful HTTP exceptions instead of leaking internals
            if (err?.code === "insufficient_scope") {
                throw new OAuthError("Insufficient scope", {
                    code: 403,
                    name: "error_insufficient_scope",
                });
            }

            throw new OAuthError(
                err?.message ?? "Invalid or missing access token",
                {
                    code: 401,
                    name: "error_invalid_token",
                },
            );
        }
    }
}
