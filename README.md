# TaskFlow — Node.js + Playwright Integration Tests

A minimal task management REST API with a clean UI, fully covered by
Playwright integration tests and a GitHub Actions CI pipeline.

---

## Project Structure

```
taskflow/
├── src/
│   ├── app.js              # Express app (routes, middleware)
│   └── server.js           # HTTP server entry point
├── public/
│   └── index.html          # Single-page frontend
├── tests/
│   ├── helpers/
│   │   └── task-page.ts    # Page Object Model + API helper
│   ├── api.spec.ts         # REST API integration tests
│   └── ui.spec.ts          # End-to-end UI tests
├── .github/
│   └── workflows/
│       └── ci.yml          # GitHub Actions pipeline
├── playwright.config.ts
├── tsconfig.json
└── package.json
```

---

## Quick Start

```bash
# Install dependencies
npm install

# Install Playwright browsers (first time only)
npx playwright install --with-deps

# Start the development server
npm start            # → http://localhost:3000

# Run integration tests (starts the server automatically)
npm run test:integration

# Open the interactive Playwright UI
npm run test:integration:ui

# View the HTML report after a run
npm run test:integration:report
```

---

## REST API

| Method | Path               | Description           |
|--------|--------------------|-----------------------|
| GET    | /health            | Health check          |
| GET    | /api/tasks         | List all tasks        |
| GET    | /api/tasks/:id     | Get a single task     |
| POST   | /api/tasks         | Create a task         |
| PATCH  | /api/tasks/:id     | Update a task         |
| DELETE | /api/tasks/:id     | Delete a task         |
| POST   | /api/reset         | Reset to seed data    |

---

## CI Pipeline

The GitHub Actions workflow (`.github/workflows/ci.yml`) has **two jobs**:

```
app  ──────────────────────────────────────────► integration-tests
  • npm ci                                          • Restore node_modules
  • Start server                                    • playwright install
  • Wait for /health → 200                          • Start server
  • Verify API response                             • Wait for /health → 200
  • Stop server                                     • npx playwright test
                                                    • Upload HTML report
                                                    • Upload JUnit XML
                                                    • Upload traces on failure
```

The `integration-tests` job declares `needs: app`, so Playwright tests only
run once the application has been verified healthy. Artifacts (HTML report,
JUnit XML, screenshots, traces) are always uploaded so failures are easy to
diagnose in the GitHub Actions UI.
