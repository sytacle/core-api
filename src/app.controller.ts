/** @format */

import { Controller, Get, Redirect } from "@nestjs/common";

@Controller()
export class AppController {
    @Get()
    @Redirect("https://www.sytacle.com")
    getIndex() {}
}
