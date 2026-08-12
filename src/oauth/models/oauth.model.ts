import { Injectable } from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import { createHash } from "crypto";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class OAuthModel {
  constructor(private readonly prisma: PrismaService) {}

  async getClient(clientId: string, clientSecret?: string) {
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, disabled: false },
    });
    if (!client) return null;
    if (client.secretHash && clientSecret) {
      const valid = client.secretHash.startsWith("$2")
        ? await bcrypt.compare(clientSecret, client.secretHash)
        : client.secretHash === this.hash(clientSecret);
      if (!valid) return null;
    } else if (
      client.secretHash &&
      !clientSecret &&
      client.tokenEndpointAuthMethod !== "none"
    ) {
      return null;
    }
    return {
      id: client.id,
      clientId: client.id,
      grants: client.grants,
      redirectUris: client.redirectUris,
      scope: client.scopes,
    };
  }

  async getUser(username: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: username },
    });
    if (!user?.passwordHash || user.blocked) return null;
    return (await bcrypt.compare(password, user.passwordHash)) ? user : null;
  }

  async saveToken(token: any, client: any, user: any) {
    const scope = this.normalizeScope(token.scope);
    const dbUser = user?.id
      ? user
      : await this.prisma.user.findFirst({
          where: { clients: { some: { id: client.id ?? client.clientId } } },
        });
    if (!dbUser?.id) throw new Error("OAuth token requires a user");
    if (token.accessToken) {
      await this.prisma.accessToken.create({
        data: {
          tokenHash: this.hash(token.accessToken),
          userId: dbUser.id,
          clientId: client.id ?? client.clientId,
          scope,
          expiresAt: token.accessTokenExpiresAt,
        },
      });
    }
    if (token.refreshToken) {
      await this.prisma.refreshToken.create({
        data: {
          tokenHash: this.hash(token.refreshToken),
          userId: dbUser.id,
          clientId: client.id ?? client.clientId,
          scope,
          expiresAt: token.refreshTokenExpiresAt,
        },
      });
    }
    return { ...token, client, user: dbUser, scope };
  }

  async getAccessToken(accessToken: string) {
    const row = await this.prisma.accessToken.findUnique({
      where: { tokenHash: this.hash(accessToken) },
      include: { user: true, client: true },
    });
    if (!row || row.revokedAt || row.expiresAt <= new Date()) return null;
    return {
      accessToken,
      accessTokenExpiresAt: row.expiresAt,
      scope: row.scope,
      client: {
        id: row.clientId,
        clientId: row.clientId,
        grants: row.client.grants,
      },
      user: row.user,
    };
  }

  async getRefreshToken(refreshToken: string) {
    const row = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.hash(refreshToken) },
      include: { user: true, client: true },
    });
    if (!row || row.revokedAt || row.expiresAt <= new Date()) return null;
    return {
      refreshToken,
      refreshTokenExpiresAt: row.expiresAt,
      scope: row.scope,
      client: {
        id: row.clientId,
        clientId: row.clientId,
        grants: row.client.grants,
      },
      user: row.user,
    };
  }

  async revokeToken(token: any) {
    if (!token?.refreshToken) return false;
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: this.hash(token.refreshToken) },
      data: { revokedAt: new Date() },
    });
    return true;
  }

  async verifyScope(token: any, scope: string | string[]) {
    const required = Array.isArray(scope)
      ? scope
      : scope.split(" ").filter(Boolean);
    const granted = this.normalizeScope(token.scope);
    return required.every((s) => granted.includes(s));
  }

  private normalizeScope(scope: unknown): string[] {
    if (Array.isArray(scope)) return scope;
    if (typeof scope === "string") return scope.split(" ").filter(Boolean);
    return [];
  }

  private hash(value: string) {
    return createHash("sha256").update(value).digest("hex");
  }
}
