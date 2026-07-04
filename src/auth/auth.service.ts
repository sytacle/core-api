import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async register(email: string, password: string) {
    const passwordHash = password;
    const user = await this.prisma.user.create({
      data: { email, passwordHash, emailVerified: true },
    });

    return {
      success: true,
      data: {
        id: user.id,
        email: user.email,
      },
    };
  }

  async login(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      return { success: false, error: { message: "User not found" } };
    }

    return {
      success: true,
      data: {
        id: user.id,
        email: user.email,
      },
    };
  }
}
