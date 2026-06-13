# Time & Attendance System - Backend API

This is the backend API for the Time and Attendance System, built with **ASP.NET Core** and **Entity Framework Core**. It provides a robust, secure, and resilient architecture for managing employee work hours.

## Tech Stack
* **Framework:** ASP.NET Core (C#)
* **Database:** Microsoft SQL Server with Entity Framework Core
* **Authentication:** JWT Bearer Token (with HttpOnly Refresh Tokens support)
* **Validation:** FluentValidation
* **Resilience:** Polly (Retry policies, Exponential Backoff, Jitter, and Timeouts)
* **Documentation:** Swagger / OpenAPI

## Core Architecture & Business Rules

### 1. Single Source of Truth for Time (Europe/Zurich)
To prevent time-tampering, the system **never** relies on the client's local time or the host server's default clock. 
All clock-in and clock-out events are stamped using an external time provider (`TimeAPI.io`) specifically set to the `Europe/Zurich` timezone. 

### 2. Network Resilience with Polly
Fetching time from an external API is critical. We wrapped the HTTP calls using **Polly Resilience Pipelines**. 
If the external time API is slow or fails, the system automatically applies exponential backoff retries with jitter before failing fast to avoid blocking server threads.

### 3. Role-Based Access Control (RBAC)
* **Employee:** Can clock in/out, view their own status, and see their personal attendance history.
* **Admin:** Can view all employees, monitor live shift statuses, and manually add or edit employee records.

### 4. Manual / Retroactive Updates
Admins and Employees can manually update shift times retroactively. When doing so, a **Reason/Note is strictly required** via FluentValidation. For standard daily clock-ins, this note remains empty.

## API Endpoints Summary

### Auth (`/api/auth`)
* `POST /login` - Authenticates user and returns JWT + Refresh Token.
* `POST /refresh-token` - Rotates expired access tokens.

### Attendance (`/api/attendance`)
* `POST /clock-in` & `POST /clock-out` - Manages active shifts.
* `GET /status` - Returns live session status.
* `PUT /manual-update` - Retroactive update (requires mandatory note).

### Admin (`/api/admin`)
* `GET /dashboard` - System-wide stats (total employees, active shifts).
* `GET /employees/{id}` - Detailed view of specific employees.

## Getting Started

1. Clone the repository.
2. Update the `appsettings.json` with your SQL Server Connection String and JWT Secret.
3. Ensure `TimeProvider` settings are configured (BaseUrl, TimeZone, Timeout settings).
4. Run EF Core Migrations: `dotnet ef database update`
5. Run the application: `dotnet run`