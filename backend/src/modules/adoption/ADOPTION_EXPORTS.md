| Name                   | Type     | Source File           | Description                                                                                                 |
|------------------------|----------|-----------------------|-------------------------------------------------------------------------------------------------------------|
| AdoptionRequest        | class    | adoption.model.js     | Mongoose model for adoption requests with schema for tracking adoption process, meetings, documents, and follow-ups |
| createAdoptionRequest  | function | adoption.service.js   | Creates a new adoption request for a pet and updates pet status                                             |
| getAdoptionRequests    | function | adoption.service.js   | Retrieves paginated list of adoption requests with filtering and sorting options                            |
| getAdoptionRequestById | function | adoption.service.js   | Retrieves a single adoption request by its ID with optional population                                      |
| updateAdoptionRequest  | function | adoption.service.js   | Updates an adoption request's details with shelter authorization                                            |
| addNote                | function | adoption.service.js   | Adds a note to an adoption request with author tracking                                                     |
| scheduleMeeting        | function | adoption.service.js   | Schedules a meeting for an adoption request and updates timeline                                            |
| updateMeetingStatus    | function | adoption.service.js   | Updates the status of a scheduled meeting and adds timeline entry                                           |
| uploadDocument         | function | adoption.service.js   | Uploads and attaches a document to an adoption request                                                      |
| makeFinalDecision      | function | adoption.service.js   | Makes final decision on adoption request and updates pet status accordingly                                 |
| scheduleFollowUp       | function | adoption.service.js   | Schedules a follow-up activity for an adoption request                                                      |
| adoptionSchema         | schema   | adoption.validation.js| Joi validation schema for adoption request data validation                                                  |
| createAdoptionRequest  | function | adoption.controller.js| HTTP controller for creating new adoption requests                                                          |
| getAdoptionRequests    | function | adoption.controller.js| HTTP controller for retrieving adoption requests list                                                       |
| getAdoptionRequestById | function | adoption.controller.js| HTTP controller for retrieving single adoption request                                                      |
| updateAdoptionRequest  | function | adoption.controller.js| HTTP controller for updating adoption request details                                                       |
| addNote                | function | adoption.controller.js| HTTP controller for adding notes to adoption requests                                                       |
| scheduleMeeting        | function | adoption.controller.js| HTTP controller for scheduling adoption meetings                                                            |
| updateMeetingStatus    | function | adoption.controller.js| HTTP controller for updating meeting status                                                                 |
| uploadDocument         | function | adoption.controller.js| HTTP controller for document uploads                                                                        |
| makeFinalDecision      | function | adoption.controller.js| HTTP controller for making final adoption decisions                                                         |
| scheduleFollowUp       | function | adoption.controller.js| HTTP controller for scheduling follow-ups                                                                   |
| router                 | object   | adoption.route.js     | Express router with all adoption-related routes and middleware                                              |
