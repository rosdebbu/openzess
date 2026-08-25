# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.1.x   | ✅ |
| < 1.1   | ❌ |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, report them privately via
[GitHub Security Advisories](https://github.com/rosdebbu/openzess/security/advisories/new)
("Report a vulnerability" button).

Please include:
- Type of issue (e.g. injection, privilege escalation, secret exposure)
- Step-by-step reproduction instructions
- Affected component (backend `app/`, frontend, MCP bridge, etc.)
- Impact assessment

You can expect an initial response within **72 hours**. We will credit you in
the fix release unless you prefer to remain anonymous.

## Security Notes for Users

- **API keys** are stored client-side in `localStorage` and sent per-request;
  they are never persisted server-side
- **Tool execution** (terminal commands, file writes) requires explicit
  human-in-the-loop approval before running
- **MCP connections** run in subprocess isolation via stdio transport
- **CORS** is configured for local development — restrict `allow_origins` in
  `backend/app/server.py` before exposing the app beyond `localhost`
- Never expose port `8000` directly to the public internet without adding
  authentication and a reverse proxy
