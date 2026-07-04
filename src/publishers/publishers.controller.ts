import { Controller, Get } from "@nestjs/common";
import { PublishersService } from "./publishers.service";

@Controller("publishers")
export class PublishersController {
  constructor(private readonly publishersService: PublishersService) {}

  @Get("overview")
  getOverview() {
    return this.publishersService.getPublisherOverview();
  }
}
