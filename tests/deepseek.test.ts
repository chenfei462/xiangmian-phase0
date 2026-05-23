import { describe, expect, it, vi } from "vitest";

import {
  DEEPSEEK_BASE_URL,
  DEEPSEEK_CHAT_COMPLETIONS_PATH,
  DEEPSEEK_MODEL,
  buildDeepSeekCardReadingMessages,
  createDeepSeekChatRequest,
  extractDeepSeekReply,
  normalizeDeepSeekProxyPayload,
  requestDeepSeekCardReading,
  type DeepSeekCardReadingInput
} from "../src/lib/deepseek";

const cardInput: DeepSeekCardReadingInput = {
  cardTitle: "眉眼舒展",
  cardCopy: "以轻松的姿态开始一次观察。",
  modernGloss: "用于描述表情给人的温和印象。",
  actionSuggestion: "先把呼吸放慢，再整理当下任务。",
  sourceTitle: "相理衡真",
  triggerLabel: "微笑",
  toneLabel: "更轻松"
};

describe("DeepSeek API wiring", () => {
  it("uses the OpenAI-compatible DeepSeek v4 Flash settings", () => {
    const messages = buildDeepSeekCardReadingMessages(cardInput);
    const request = createDeepSeekChatRequest(messages);

    expect(DEEPSEEK_BASE_URL).toBe("https://api.deepseek.com");
    expect(DEEPSEEK_CHAT_COMPLETIONS_PATH).toBe("/chat/completions");
    expect(request.model).toBe(DEEPSEEK_MODEL);
    expect(request.model).toBe("deepseek-v4-flash");
    expect(request.stream).toBe(false);
    expect(request.messages[0].role).toBe("system");
    expect(request.messages[1].content).toContain("眉眼舒展");
    expect(JSON.stringify(request)).not.toContain("raw_image");
  });

  it("normalizes proxy payloads to the fixed model and non-streaming mode", () => {
    const normalized = normalizeDeepSeekProxyPayload({
      model: "user-supplied-model",
      stream: true,
      temperature: 1.2,
      messages: [{ role: "user", content: "hello" }],
      raw_image: "data:image/png;base64,unsafe"
    });

    expect(normalized).toEqual({
      model: "deepseek-v4-flash",
      messages: [{ role: "user", content: "hello" }],
      temperature: 1.2,
      max_tokens: 420,
      stream: false
    });
  });

  it("extracts the first OpenAI-compatible chat completion message", () => {
    expect(
      extractDeepSeekReply({
        choices: [{ message: { role: "assistant", content: "  可以把它理解为一种轻量提醒。 " } }]
      })
    ).toBe("可以把它理解为一种轻量提醒。");
  });

  it("posts card context to the local proxy endpoint", async () => {
    const fetchMock = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          choices: [{ message: { role: "assistant", content: "模型解读已生成。" } }]
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    });

    const reply = await requestDeepSeekCardReading(cardInput, fetchMock as unknown as typeof fetch);

    expect(reply).toBe("模型解读已生成。");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/deepseek/chat",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" }
      })
    );
    const calls = fetchMock.mock.calls as unknown as Array<[string, RequestInit]>;
    const [, init] = calls[0];
    const body = JSON.parse(init.body as string);

    expect(body.model).toBe("deepseek-v4-flash");
    expect(body.messages[1].content).toContain("相理衡真");
    expect(JSON.stringify(body)).not.toContain("raw_image");
  });
});
