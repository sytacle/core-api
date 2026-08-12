/*
 * Copyright 2026 Sytacle LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(body: RegisterDto) {
    if (!body.password) throw new Error("Invalid password");

    const passwordHash = await bcrypt.hash(body.password, 12);

    try {
      const user = await this.prisma.user.create({
        data: {
          email: body.email,
          passwordHash,
          emailVerified: false,
          givenName: body.givenName,
          familyName: body.familyName,
          displayName:
            body.displayName ?? `${body.givenName} ${body.familyName}`,
        },
      });

      const { accessToken, refreshToken } = await this.generateTokens(
        user.id,
        user.email,
      );

      return {
        success: true,
        results: {
          id: user.id,
          accessToken,
          refreshToken,
        },
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(error?.message ?? "Something went wrong");
    }
  }

  async login(body: LoginDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: body.email },
      });

      if (!user) {
        throw new Error("User not found");
      }

      if (!user?.passwordHash) throw new Error("Invalid credentials");

      const isPasswordValid = await bcrypt.compare(
        body.password,
        user?.passwordHash,
      );
      if (!isPasswordValid) {
        throw new Error("Invalid credentials");
      }

      const { accessToken, refreshToken } = await this.generateTokens(
        user.id,
        user.email,
      );

      return {
        success: true,
        results: {
          id: user.id,
          accessToken,
          refreshToken,
        },
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(error?.message ?? "Something went wrong");
    }
  }

  async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: "14d",
      }),
      this.jwtService.signAsync(payload, {
        expiresIn: "90d",
      }),
    ]);

    return { accessToken, refreshToken };
  }

  async me(accessToken: string) {
    const payload = await this.jwtService.verifyAsync(accessToken, {
      secret: process.env.JWT_SECRET,
    });
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        givenName: true,
        familyName: true,
        picture: true,
        emailVerified: true,
        createdAt: true,
      },
    });
    if (!user) throw new Error("User not found");
    return { success: true, results: user };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });
      if (!user) {
        throw new Error("User not found");
      }

      const tokens = await this.generateTokens(user.id, user.email);

      return { success: true, data: tokens };
    } catch {
      throw new Error("Invalid or expired refresh token");
    }
  }
}
