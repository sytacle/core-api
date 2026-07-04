/** @format */

import { Injectable } from "@nestjs/common";
import OAuth2Server from "@node-oauth/oauth2-server";
import { OAuthModel } from "./models/oauth.model";

@Injectable()
export class OAuthService {
    readonly server: OAuth2Server;

    constructor(model: OAuthModel) {
        this.server = new OAuth2Server({
            model,
            allowBearerTokensInQueryString: true,
            accessTokenLifetime: 4 * 60 * 60,
        });
    }
}
