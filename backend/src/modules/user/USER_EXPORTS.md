# User Module Exports

## Controllers (user.controller.js)

| Function Name           | Type     | File               | Description                         |
| ----------------------- | -------- | ------------------ | ----------------------------------- |
| handleCreateProfile     | function | user.controller.js | Creates a new user profile          |
| handleGetProfile        | function | user.controller.js | Retrieves user profile              |
| handleUpdateProfile     | function | user.controller.js | Updates user profile                |
| handleUpdatePreferences | function | user.controller.js | Updates user preferences            |
| handleUpdateLocation    | function | user.controller.js | Updates user location               |
| handleGetFavoritePets   | function | user.controller.js | Retrieves user's favorite pets      |
| handleToggleFavoritePet | function | user.controller.js | Toggles favorite status for a pet   |
| handleGetShelters       | function | user.controller.js | Retrieves all shelters              |
| handleGetShelterProfile | function | user.controller.js | Retrieves specific shelter profile  |
| handleAddViewedPet      | function | user.controller.js | Adds a pet to user's viewed history |
| handleGetViewedPets     | function | user.controller.js | Retrieves user's viewed pets        |

## Services (user.service.js)

| Function Name          | Type     | File            | Description                               |
| ---------------------- | -------- | --------------- | ----------------------------------------- |
| registerUser           | function | user.service.js | Registers a new user                      |
| loginUser              | function | user.service.js | Authenticates user login                  |
| manualVerifyUser       | function | user.service.js | Manually verifies user email              |
| resendUserVerification | function | user.service.js | Resends verification email                |
| forgotUserPassword     | function | user.service.js | Initiates password reset process          |
| resetUserPassword      | function | user.service.js | Resets user password with token           |
| createUserProfile      | function | user.service.js | Creates user profile                      |
| getUserProfile         | function | user.service.js | Retrieves user profile                    |
| updateUserProfile      | function | user.service.js | Updates user profile                      |
| updateUserPreferences  | function | user.service.js | Updates user preferences                  |
| updateUserLocation     | function | user.service.js | Updates user location                     |
| getFavoritePets        | function | user.service.js | Service layer for favorite pets retrieval |
| toggleFavoritePet      | function | user.service.js | Service layer for toggling favorite pets  |
| getAllShelters         | function | user.service.js | Retrieves all shelters                    |
| getShelterProfileById  | function | user.service.js | Retrieves shelter profile by ID           |
| addViewedPet           | function | user.service.js | Adds pet to viewed history                |
| getViewedPets          | function | user.service.js | Retrieves viewed pets                     |
| getAllUsers            | function | user.service.js | Admin: retrieves all users                |
| updateUser             | function | user.service.js | Admin: updates user                       |
| deleteUser             | function | user.service.js | Admin: deletes user                       |

## Routes (user.route.js)

| Route Pattern         | Method | Handler                 | Description                      |
| --------------------- | ------ | ----------------------- | -------------------------------- |
| /profile              | POST   | handleCreateProfile     | Create user profile              |
| /profile              | GET    | handleGetProfile        | Get user profile                 |
| /profile              | PUT    | handleUpdateProfile     | Update user profile              |
| /preferences          | PUT    | handleUpdatePreferences | Update user preferences          |
| /location             | PUT    | handleUpdateLocation    | Update user location             |
| /favorite-pets        | GET    | handleGetFavoritePets   | Get user's favorite pets         |
| /favorite-pets/:petId | POST   | handleToggleFavoritePet | Toggle favorite status for a pet |
| /viewed-pets          | GET    | handleGetViewedPets     | Get user's viewed pets           |
| /viewed-pets/:petId   | POST   | handleAddViewedPet      | Add pet to viewed history        |
| /shelters             | GET    | handleGetShelters       | Get all shelters                 |
| /shelters/:shelterId  | GET    | handleGetShelterProfile | Get specific shelter profile     |

## Models (user.model.js)

| Schema Field      | Type    | Description                      |
| ----------------- | ------- | -------------------------------- |
| email             | String  | User's email address             |
| phone             | String  | User's phone number              |
| password          | String  | Hashed password                  |
| role              | String  | User role (USER, SHELTER, ADMIN) |
| isVerified        | Boolean | Email verification status        |
| verificationToken | String  | Email verification token         |
| resetToken        | String  | Password reset token             |
| resetTokenExpiry  | Date    | Password reset token expiry      |
| profile           | Object  | User profile information         |
| preferences       | Object  | User preferences                 |
| location          | Object  | User location information        |
| favoritePets      | Array   | Array of favorite pet IDs        |
| viewedPets        | Array   | Array of viewed pet IDs          |
| pets              | Array   | Array of pet IDs (for shelters)  |
| reviews           | Array   | Array of review IDs              |
| createdAt         | Date    | Account creation timestamp       |
| updatedAt         | Date    | Last update timestamp            |

## Validation (user.validation.js)

| Schema Name       | Description                                   |
| ----------------- | --------------------------------------------- |
| userProfileSchema | Validation schema for user profile operations |
