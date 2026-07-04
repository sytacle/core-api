/** @format */

import { Injectable } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";
import { prismaQueryInsights } from "@prisma/sqlcommenter-query-insights";

// Derive the Accelerate-extended type from the real factory so TypeScript
// knows about `cacheStrategy` on every model query method.
const _typeHelper = () => new PrismaClient().$extends(withAccelerate());
type PrismaWithAccelerate = ReturnType<typeof _typeHelper>;

/**
 * Cast the constructor signature so the class inherits the extended type.
 * We still call super() with real options — the cast is purely a TS hint.
 */
const PrismaBase = PrismaClient as unknown as new (
    options?: ConstructorParameters<typeof PrismaClient>[0],
) => PrismaWithAccelerate;

@Injectable()
export class PrismaService extends PrismaBase {
    constructor() {
        super({
            accelerateUrl: process.env.DATABASE_URL,
            comments: [prismaQueryInsights()],
        });
        // $extends returns a new object — return it so NestJS injects the
        // extended client everywhere PrismaService is requested.
        return (this as unknown as PrismaClient).$extends(
            withAccelerate(),
        ) as unknown as PrismaService;
    }
}
