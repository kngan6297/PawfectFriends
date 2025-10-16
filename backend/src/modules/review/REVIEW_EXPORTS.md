# Review Module Exports

| Name              | Type     | Source File         | Description                                                                |
|-------------------|----------|---------------------|----------------------------------------------------------------------------|
| Review            | model    | review.model.js     | Mongoose model for storing and managing review data with validation and indexing |
| reviewSchema      | schema   | review.validation.js| Joi validation schema for validating review data structure and content      |
| ReviewService     | class    | review.service.js   | Service class implementing business logic for review operations             |
| createReview      | method   | review.service.js   | Creates a new review for a completed adoption                              |
| getShelterReviews | method   | review.service.js   | Retrieves paginated reviews for a specific shelter                         |
| getUserReviews    | method   | review.service.js   | Retrieves paginated reviews written by a specific user                      |
| updateReview      | method   | review.service.js   | Updates an existing review's content                                       |
| deleteReview      | method   | review.service.js   | Deletes a review                                                           |
| addResponse       | method   | review.service.js   | Adds a shelter's response to a review                                      |
| markHelpful       | method   | review.service.js   | Toggles helpful status for a review                                        |
| reportReview      | method   | review.service.js   | Reports a review for inappropriate content                                 |
| ReviewController  | class    | review.controller.js| Controller class handling HTTP requests for review operations               |
| createReview      | method   | review.controller.js| Handles HTTP POST request to create a new review                           |
| getShelterReviews | method   | review.controller.js| Handles HTTP GET request to fetch shelter reviews                          |
| getUserReviews    | method   | review.controller.js| Handles HTTP GET request to fetch user's reviews                           |
| updateReview      | method   | review.controller.js| Handles HTTP PATCH request to update a review                              |
| deleteReview      | method   | review.controller.js| Handles HTTP DELETE request to remove a review                             |
| addResponse       | method   | review.controller.js| Handles HTTP POST request to add a shelter response                        |
| markHelpful       | method   | review.controller.js| Handles HTTP POST request to mark a review as helpful                      |
| reportReview      | method   | review.controller.js| Handles HTTP POST request to report a review                               |
| router            | export   | review.route.js     | Express router instance for review-related endpoints                       |
