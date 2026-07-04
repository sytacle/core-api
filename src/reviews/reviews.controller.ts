import { Controller, Get } from "@nestjs/common";
import { ReviewsService } from "./reviews.service";

@Controller("reviews")
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  listReviews() {
    return this.reviewsService.listReviews();
  }
}
