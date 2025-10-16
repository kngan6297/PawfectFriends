# Shelter Module Exports

| Name                   | Type     | Source File            | Description                                                          |
|------------------------|----------|------------------------|----------------------------------------------------------------------|
| getAllShelters         | function | shelter.controller.js  | Retrieves a list of all shelters with basic information              |
| getShelterById         | function | shelter.controller.js  | Retrieves detailed information about a specific shelter by ID         |
| updateShelterProfile   | function | shelter.controller.js  | Updates a shelter's profile information with validated fields         |
| getShelterStats        | function | shelter.controller.js  | Retrieves statistics about a shelter's adoptions and pets             |
| searchShelters         | function | shelter.controller.js  | Searches for shelters based on query parameters and location          |
| shelterController      | object   | shelter.controller.js  | Collection of all shelter-related controller functions                |
| shelterFieldsSchema    | schema   | shelter.validation.js  | Joi validation schema for shelter-specific fields                     |
| shelterRegistrationSchema | schema | shelter.validation.js  | Combined validation schema for shelter registration                   |
| shelterUpdateSchema    | schema   | shelter.validation.js  | Validation schema for updating shelter information                    |
| shelterSearchSchema    | schema   | shelter.validation.js  | Validation schema for shelter search parameters                       |
| router                 | export   | shelter.route.js       | Express router instance for shelter-related endpoints                 |
