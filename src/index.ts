import { z } from "zod";

// MCP Tool: Get current weather
const getWeatherTool = {
  name: "getWeather",
  description: "Fetches current weather for the specified city",
  inputSchema: z.object({
    city: z.string(),
  }),
  async handler(input: { city: string }, apiKey: string) {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
        input.city
      )}&appid=${apiKey}&units=metric`
    );
    const data = await res.json();

    if (!res.ok) return { error: data.message };

    return {
      city: data.name,
      temp: data.main.temp,
      description: data.weather[0].description,
    };
  },
};

// MCP Tool: Get 5-day forecast
const getForecastTool = {
  name: "getForecast",
  description: "Fetches 5-day weather forecast for the specified city",
  inputSchema: z.object({
    city: z.string(),
  }),
  async handler(input: { city: string }, apiKey: string) {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(
        input.city
      )}&appid=${apiKey}&units=metric`
    );
    const data = await res.json();

    if (!res.ok) return { error: data.message };

    // Extract forecast every 24 hours (every 8 records of 3h intervals)
    const forecast = data.list
      .filter((_: any, i: number) => i % 8 === 0)
      .map((item: any) => ({
        date: item.dt_txt,
        temp: item.main.temp,
        description: item.weather[0].description,
      }));

    return {
      city: data.city.name,
      forecast,
    };
  },
};

// MCP Server
export default {
  async fetch(request: Request, env: any) {
    try {
      const req = await request.json();
      const { tool, input } = req;

      if (tool === "getWeather") {
        const parsed = getWeatherTool.inputSchema.parse(input);
        const result = await getWeatherTool.handler(parsed, env.OPENWEATHER_API_KEY);
        return new Response(JSON.stringify(result), { status: 200 });
      }

      if (tool === "getForecast") {
        const parsed = getForecastTool.inputSchema.parse(input);
        const result = await getForecastTool.handler(parsed, env.OPENWEATHER_API_KEY);
        return new Response(JSON.stringify(result), { status: 200 });
      }

      return new Response(JSON.stringify({ error: "Tool not found" }), { status: 404 });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: 400 });
    }
  },
};
