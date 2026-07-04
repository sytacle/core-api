/** @format */

import { Token } from "@node-oauth/oauth2-server";

declare global {
    namespace Express {
        interface Request {
            oauth?: { token: Token };
        }
    }
}

export {};
