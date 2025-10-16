# Pet Module Exports

| Name                      | Type     | Source File         | Description                                                                                 |
|---------------------------|----------|---------------------|---------------------------------------------------------------------------------------------|
| createPet                 | function | pet.controller.js   | Creates a new pet record with shelter association and handles photo uploads                 |
| getPets                   | function | pet.controller.js   | Retrieves a paginated list of pets with optional filtering                                  |
| getPetById                | function | pet.controller.js   | Retrieves a single pet by ID and increments its view count                                  |
| updatePet                 | function | pet.controller.js   | Updates an existing pet's information with authorization checks                             |
| deletePet                 | function | pet.controller.js   | Deletes a pet record with proper authorization                                              |
| addHealthRecord           | function | pet.controller.js   | Adds a new health record to a pet's medical history                                         |
| addBehaviorRecord         | function | pet.controller.js   | Adds a new behavior record to a pet's history                                               |
| updatePetStatus           | function | pet.controller.js   | Updates a pet's adoption status (available/pending/adopted)                                 |
| uploadPetImages           | function | pet.controller.js   | Handles multiple image uploads for a pet                                                    |
| deletePetImage            | function | pet.controller.js   | Removes a specific image from a pet's photo collection                                      |
| setPrimaryImage           | function | pet.controller.js   | Sets a specific image as the primary photo for a pet                                        |
| getFeaturedPets           | function | pet.controller.js   | Retrieves a list of featured pets for display                                               |
| searchPets                | function | pet.controller.js   | Performs text-based search across pet records                                               |
| getShelterStats           | function | pet.controller.js   | Retrieves statistics for a shelter's pets                                                   |
| getShelterAdoptionRequests| function | pet.controller.js   | Gets all adoption requests for a shelter's pets                                             |
| Pet                       | class    | pet.model.js        | Mongoose model for pet data with schema validation                                          |
| petSchema                 | schema   | pet.validation.js   | Joi validation schema for pet data                                                          |
| createPetSchema           | schema   | pet.validation.js   | Validation schema specifically for pet creation                                             |
| updatePetSchema           | schema   | pet.validation.js   | Validation schema for pet updates                                                           |
| addHealthRecordSchema     | schema   | pet.validation.js   | Validation schema for health record additions                                               |
| addBehaviorRecordSchema   | schema   | pet.validation.js   | Validation schema for behavior record additions                                             |
| updateStatusSchema        | schema   | pet.validation.js   | Validation schema for status updates                                                        |
| uploadImagesSchema        | schema   | pet.validation.js   | Validation schema for image uploads                                                         |
| petValidation             | object   | pet.validation.js   | Collection of all validation schemas                                                        |
| verifyPetOwnership        | function | pet.middleware.js   | Middleware to verify pet ownership for modifications                                        |
| validatePetStatus         | function | pet.middleware.js   | Middleware to validate pet's adoption status                                                |
| petRouter                 | object   | pet.route.js        | Express router with all pet-related routes                                                  |
