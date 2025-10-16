# Recommendation Module Exports

| Name                      | Type     | Source File                    | Description                                                                |
|---------------------------|----------|--------------------------------|----------------------------------------------------------------------------|
| getRecommendations        | function | recommendation.controller.js   | Handles HTTP requests to fetch personalized pet recommendations for a user  |
| updatePreferences         | function | recommendation.controller.js   | Processes HTTP requests to update a user's pet preference settings          |
| getSimilarPets            | function | recommendation.controller.js   | Handles HTTP requests to find pets similar to a specified pet               |
| getPersonalizedFeed       | function | recommendation.controller.js   | Processes HTTP requests to get a personalized feed of pet recommendations   |
| RecommendationService     | class    | recommendation.service.js      | Core service class implementing recommendation business logic               |
| recommendationService     | export   | recommendation.service.js      | Singleton instance of RecommendationService                                 |
| recommendationMonitor     | object   | recommendation.monitor.js      | Monitoring utility for tracking recommendation system metrics               |
| monitorRecommendationSystem | function | recommendation.monitor.js      | Monitors and collects metrics about the recommendation system's performance |
| clearRecommendationCache  | function | recommendation.monitor.js      | Clears cached recommendation data from Redis                                |
| updateRecommendationMetrics | function | recommendation.monitor.js      | Updates and stores recommendation system metrics in Redis                   |
| updatePreferencesSchema   | schema   | recommendation.validation.js   | Joi validation schema for updating user preferences                         |
| getSimilarPetsSchema      | schema   | recommendation.validation.js   | Joi validation schema for getting similar pets                              |
| getPersonalizedFeedSchema | schema   | recommendation.validation.js   | Joi validation schema for getting personalized feed                         |
| recommendationValidation  | object   | recommendation.validation.js   | Collection of all recommendation-related validation schemas                 |
| recommendationRouter      | export   | recommendation.route.js        | Express router instance for recommendation-related endpoints                |
