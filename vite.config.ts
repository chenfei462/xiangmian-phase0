import react from "@vitejs/plugin-react";
import type { IncomingMessage, ServerResponse } from "node:http";
import { defineConfig, loadEnv } from "vite";

import {
  DEEPSEEK_BASE_URL,
  DEEPSEEK_CHAT_COMPLETIONS_PATH,
  DEEPSEEK_PROXY_ENDPOINT,
  normalizeDeepSeekProxyPayload
} from "./src/lib/deepseek";

function readRequestBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    req.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });
    req.on("end", () => {
      resolve(Buffer.concat(chunks).toString("utf8"));
    });
    req.on("error", reject);
  });
}

function jsonResponse(res: ServerResponse, status: number, payload: unknown): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiKey = env.DEEPSEEK_API_KEY;

  return {
    plugins: [
      react(),
      {
        name: "deepseek-dev-proxy",
        configureServer(server) {
          server.middlewares.use(DEEPSEEK_PROXY_ENDPOINT, async (req, res) => {
            if (req.method !== "POST") {
              jsonResponse(res, 405, { error: { message: "Method not allowed" } });
              return;
            }
            if (!apiKey) {
              jsonResponse(res, 500, { error: { message: "Missing DEEPSEEK_API_KEY" } });
              return;
            }

            try {
              const body = await readRequestBody(req);
              const payload = normalizeDeepSeekProxyPayload(JSON.parse(body || "{}"));
              const upstream = await fetch(`${DEEPSEEK_BASE_URL}${DEEPSEEK_CHAT_COMPLETIONS_PATH}`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${apiKey}`
                },
                body: JSON.stringify(payload)
              });
              const responseText = await upstream.text();

              res.statusCode = upstream.status;
              res.setHeader(
                "Content-Type",
                upstream.headers.get("Content-Type") ?? "application/json; charset=utf-8"
              );
              res.end(responseText);
            } catch (error) {
              jsonResponse(res, 500, {
                error: {
                  message: error instanceof Error ? error.message : "DeepSeek proxy failed"
                }
              });
            }
          });
        }
      }
    ],
    server: {
      host: "127.0.0.1"
    }
  };
});
