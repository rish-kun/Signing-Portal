## 2024-05-22 - Exposed Refresh Tokens in Logs
**Vulnerability:** Refresh tokens and access tokens were explicitly logged to the console in `auth.js` and implicitly logged via full error object dumping in `errorHandling.js` and `toast.js`.
**Learning:** "Printf debugging" left in production code can expose critical credentials. Centralized error handlers that log the full `error` object can inadvertently leak request headers containing Authorization tokens.
**Prevention:** Use a logger that sanitizes sensitive fields or strips headers. Enforce linting rules (e.g., `no-console`) for production builds. Never log the full `error` object in frontend apps; log `error.message` or a specific code.
