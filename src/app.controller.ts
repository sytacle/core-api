import { Controller, Get } from "@nestjs/common";

@Controller()
export class AppController {
  @Get()
  getIndex(): string {
    return "Hello World!";
  }

  @Get("health")
  getHealth(): { success: boolean; data: { status: string; service: string } } {
    return {
      success: true,
      data: {
        status: "ok",
        service: "core-api",
      },
    };
  }
}
