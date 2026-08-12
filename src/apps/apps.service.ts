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

import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AppDto } from "./dto/app.dto";

@Injectable()
export class AppsService {
  constructor(private readonly prisma: PrismaService) {}

  async listApps(page: number, limit: number) {
    const skip = (page - 1) * limit;

    try {
      const [apps, total] = await this.prisma.$transaction([
        this.prisma.app.findMany({
          skip,
          take: limit,
          // explicitly select only what the list view needs;
          // relations are omitted by default in Prisma, no need for false flags
          select: {
            id: true,
            icon: true,
            name: true,
            description: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          cacheStrategy: {
            ttl: 60,
          },
        }),
        this.prisma.app.count(),
      ]);

      return {
        success: true,
        results: apps,
        metadata: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new InternalServerErrorException(
        error?.message ?? "Failed to fetch apps",
      );
    }
  }

  async getAppById(appId: string) {
    try {
    } catch (error) {
      throw new InternalServerErrorException(
        "An error occured. Please try again.",
      );
    }
  }

  async createApp(app: AppDto) {
    try {
    } catch (error) {
      throw new InternalServerErrorException(
        "An error occured. Please try again.",
      );
    }
  }
}
