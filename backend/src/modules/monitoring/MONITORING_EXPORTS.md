# Monitoring Module Exports

| Name                  | Type     | Source File              | Description                                                                                                         |
|-----------------------|----------|--------------------------|---------------------------------------------------------------------------------------------------------------------|
| getSystemMetrics      | function | monitoring.controller.js | Handles HTTP requests to retrieve system-level metrics including CPU, memory, and uptime information.                |
| getApplicationMetrics | function | monitoring.controller.js | Handles HTTP requests to retrieve application-level metrics including user, pet, adoption, and chat statistics.      |
| getSecurityMetrics    | function | monitoring.controller.js | Handles HTTP requests to retrieve security-related metrics including authentication, sessions, and security events.  |
| getPerformanceMetrics | function | monitoring.controller.js | Handles HTTP requests to retrieve performance metrics including response times, request counts, and cache statistics.|
| getErrorMetrics       | function | monitoring.controller.js | Handles HTTP requests to retrieve error-related metrics including error counts and exception statistics.             |
| getDatabaseMetrics    | function | monitoring.controller.js | Handles HTTP requests to retrieve database-related metrics including connection stats and operation counts.          |
| getSystemMetrics      | function | monitoring.service.js    | Service function that collects and returns detailed system metrics including CPU usage, memory stats, and system information.   |
| getApplicationMetrics | function | monitoring.service.js    | Service function that aggregates and returns application statistics across users, pets, adoptions, and chats.       |
| getSecurityMetrics    | function | monitoring.service.js    | Service function that collects and returns security-related statistics including authentication attempts and security events.    |
| getPerformanceMetrics | function | monitoring.service.js    | Service function that gathers and returns performance-related metrics including response times and request statistics.|
| getErrorMetrics       | function | monitoring.service.js    | Service function that collects and returns error-related statistics including error counts and exception information.|
| getDatabaseMetrics    | function | monitoring.service.js    | Service function that gathers and returns database-related statistics including connection pools and operation counts.|
| monitoringRouter      | export   | monitoring.route.js      | Express router instance that defines all monitoring-related API endpoints with authentication and authorization middleware.      |
