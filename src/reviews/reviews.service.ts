import { Injectable } from "@nestjs/common";

@Injectable()
export class ReviewsService {
  listReviews() {
    return {
      success: true,
      data: [],
    };
  }
}
