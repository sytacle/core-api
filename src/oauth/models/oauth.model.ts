/** @format */

import { Injectable } from "@nestjs/common";

@Injectable()
export class OAuthModel {
    private clients = [
        {
            id: "client",
            clientId: "client",
            clientSecret: "secret",
            grants: ["client_credentials", "refresh_token"],
        },
    ];

    private tokens: any[] = [];

    async getClient(clientId: string, clientSecret?: string) {
        return (
            this.clients.find(
                c =>
                    c.clientId === clientId &&
                    (!clientSecret || c.clientSecret === clientSecret),
            ) || null
        );
    }

    async saveToken(token: any, client: any, user: any) {
        const saved = {
            ...token,
            client,
            user,
        };

        this.tokens.push(saved);
        return saved;
    }

    async getAccessToken(accessToken: string) {
        return this.tokens.find(t => t.accessToken === accessToken) || null;
    }

    async getRefreshToken(refreshToken: string) {
        return this.tokens.find(t => t.refreshToken === refreshToken) || null;
    }

    async revokeToken(token: any) {
        return true;
    }

    async verifyScope() {
        return true;
    }
}
