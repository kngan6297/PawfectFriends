# Favorite Module Exports

| Name                 | Type     | Source File            | Description                                                                                  |
|----------------------|----------|------------------------|----------------------------------------------------------------------------------------------|
| favoritePet          | function | favorite.controller.js | Handles adding a pet to a user's favorites list and increments the pet's favorites count      |
| unfavoritePet        | function | favorite.controller.js | Removes a pet from a user's favorites list and decrements the pet's favorites count           |
| getFavoritePets      | function | favorite.controller.js | Retrieves all favorite pets for the authenticated user                                        |
| checkFavoriteStatus  | function | favorite.controller.js | Checks if a specific pet is in the user's favorites list                                      |
| favoriteController   | object   | favorite.controller.js | Exports all favorite-related controller functions as a single object                          |
| favoriteRoutes       | object   | favorite.route.js      | Express router containing all favorite-related routes with authentication middleware           |
