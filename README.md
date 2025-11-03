# Cloudflare MCP Server

A modular MCP (Model Communication Platform) server deployed on **Cloudflare Workers**, providing tools like current weather and 5-day weather forecast APIs for AI models or other clients.

---

## Features

* **Modular tools architecture** – easily add new tools for different APIs.
* **Get current weather** – fetch current weather for any city.
* **Get 5-day forecast** – fetch 5-day weather forecast for any city.
* **Serverless & globally accessible** – deployed on Cloudflare Workers with no infrastructure to maintain.
* **JSON interface** – send POST requests with `tool` and `input`, receive structured JSON responses.

---

## Project Structure

```
cloudflare-mcp/
│
├─ src/
│   ├─ index.ts           # main MCP Server
│   ├─ tools/
│   │   ├─ getWeather.ts
│   │   ├─ getForecast.ts
│   │   └─ ... other tools
│   └─ utils.ts           # helper functions
│
├─ test/                  # optional tests
├─ package.json
├─ package-lock.json
├─ tsconfig.json
├─ vitest.config.mts
├─ README.md
├─ .gitignore
```

**Note:** Files like `.env`, `.dev.vars`, and `wrangler.toml` containing API keys should **not** be included in public repo.

---

## Getting Started

### Prerequisites

* Node.js >= 18
* [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)

### Install dependencies

```bash
npm install
```

### Set up environment variables

Create a `.dev.vars` or `.env` file locally:

```
OPENWEATHER_API_KEY=your_openweathermap_api_key
```

---

## Running Locally

Start the local development server:

```bash
wrangler dev
```

Example POST request:

```bash
curl -X POST http://127.0.0.1:8787 \
  -H "Content-Type: application/json" \
  -d '{"tool":"getWeather","input":{"city":"Warsaw"}}'
```

---

## Deploying to Cloudflare

```bash
wrangler deploy
```

Your MCP Server will be accessible via the provided `workers.dev` URL.

---

## Usage

### Get current weather

POST request:

```json
{
  "tool": "getWeather",
  "input": { "city": "Warsaw" }
}
```

Response:

```json
{
  "city": "Warsaw",
  "temp": 10.47,
  "description": "broken clouds"
}
```

### Get 5-day forecast

POST request:

```json
{
  "tool": "getForecast",
  "input": { "city": "Warsaw" }
}
```

Response:

```json
{
  "city": "Warsaw",
  "forecast": [
    {"date":"2025-11-03 12:00:00","temp":10.5,"description":"broken clouds"},
    {"date":"2025-11-04 12:00:00","temp":9.8,"description":"light rain"},
    ...
  ]
}
```

---

## Adding New Tools

1. Create a new file in `src/tools/` (e.g., `getAirQuality.ts`).
2. Export a tool object with `name`, `description`, `inputSchema`, and `handler`.
3. Import and add the tool to `index.ts`.

---

## License

MIT License
