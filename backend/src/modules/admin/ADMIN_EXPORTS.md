| Name                         | Type     | Source File         | Description                                                                |
|------------------------------|----------|---------------------|----------------------------------------------------------------------------|
| adminSchema                  | schema   | admin.validation.js | Defines the base admin validation schema with permissions and access logs   |
| adminRegistrationSchema      | schema   | admin.validation.js | Extends admin schema with password confirmation for registration            |
| adminUpdateSchema            | schema   | admin.validation.js | Admin update schema that omits password field                              |
| adminPermissionsUpdateSchema | schema   | admin.validation.js | Schema for updating admin permissions                                      |
| adminAccessLogSchema         | schema   | admin.validation.js | Schema for admin access log entries                                        |
| getSystemStats               | function | admin.controller.js | Retrieves system-wide statistics including user, shelter, and admin counts |
| getAllUsers                  | function | admin.controller.js | Fetches all users with sensitive data removed                              |
| getAllShelters               | function | admin.controller.js | Retrieves all shelters with sensitive data removed                         |
| getAllAdmins                 | function | admin.controller.js | Fetches all admin users with sensitive data removed                        |
| updateAdminPermissions       | function | admin.controller.js | Updates permissions for a specific admin user                              |
| getSystemLogs                | function | admin.controller.js | Retrieves system access logs with optional date and action filtering        |
| searchUsers                  | function | admin.controller.js | Searches users by name or email with case-insensitive matching             |
| updateUser                   | function | admin.controller.js | Updates user information                                                   |
| deleteUser                   | function | admin.controller.js | Deletes a user from the system                                             |
| createUser                   | function | admin.controller.js | Creates a new user                                                         |
| router                       | export   | admin.route.js      | Express router with all admin routes and middleware                        |
| getAllUsers                  | function | admin.service.js    | Service function to fetch all users                                        |
| updateUser                   | function | admin.service.js    | Service function to update user data                                       |
| deleteUser                   | function | admin.service.js    | Service function to delete a user                                          |
| createUser                   | function | admin.service.js    | Service function to create a new user                                      |
