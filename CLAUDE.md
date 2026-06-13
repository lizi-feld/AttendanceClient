# Project Context: Time & Attendance SPA
Act as a Senior Full-Stack Developer specializing in ASP.NET Core (C#) and React (TypeScript). 
You are working on a localized (RTL Hebrew) Time and Attendance system.

## 1. Tech Stack
* **Frontend:** React, Vite, TypeScript, Tailwind CSS, React Hook Form, Zod (validation), Axios, React Router v6.
* **Backend:** ASP.NET Core, Entity Framework Core, FluentValidation, Polly (Resilience/Timeouts), JWT Bearer Auth.

## 2. Core Architectural Rules (CRITICAL)

### A. Time Handling (Single Source of Truth)
* **Rule:** The Backend (`ExternalTimeProvider` via `Europe/Zurich`) is the ONLY source of truth for time. 
* **Frontend Constraints:** NEVER use the browser's `new Date()` for business logic, clock-ins, or displaying static timestamps.
* **Live Clocks:** If a live clock is required, it must fetch the server time ONCE on mount, calculate the offset against the local machine, and tick using that offset. If the server is unreachable, the clock must return `null` or `--:--:--` (never fall back to local browser time).

### B. Casing & Serialization mismatch
* **Backend:** C# classes use `PascalCase`.
* **Frontend:** The API serializes JSON to `camelCase`. 
* **Rule:** ALL TypeScript Interfaces, Types, and React component references MUST strictly use `camelCase` (e.g., `totalEmployees`, `clockInTime`). Do not copy C# casing into TypeScript.

### C. Enums and Form Submissions
* **The Conflict:** UI elements (like Select dropdowns) and Zod schemas work best with Strings (e.g., "Employee", "Admin"). The C# backend strictly expects Integers (e.g., `1`, `2`) for Enums.
* **The Solution:** Do NOT force Zod or HTML to work with numbers if it causes rendering/validation issues. Instead, let the UI and Zod handle Strings, and intercept the payload inside the `onSubmit` function to map the strings to integers right before executing the Axios request.

### D. Validation (Backend vs. Frontend Parity)
* Client-side validation (Zod) MUST 1:1 mirror the server-side FluentValidation rules.
* All error messages in Zod must be localized in Hebrew.
* Submit buttons must be disabled if the form is invalid.
* **Exception:** For manual retroactive updates, the "Note" field is strictly REQUIRED. For normal daily clock-ins, it is omitted.

## 3. Workflow Instructions
* Do not generate entire files if a targeted modification is sufficient.
* When creating new UI components, seamlessly match the existing RTL Tailwind CSS aesthetic.
* Always implement robust error handling (e.g., catching Axios 400/409/401 errors and displaying appropriate UI toasts/alerts).
