export const DEEPSEEK_BASE_URL = "https://api.deepseek.com";
export const DEEPSEEK_CHAT_COMPLETIONS_PATH = "/chat/completions";
export const DEEPSEEK_MODEL = "deepseek-v4-flash";
export const DEEPSEEK_PROXY_ENDPOINT = "/api/deepseek/chat";

export type DeepSeekMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type DeepSeekChatRequest = {
  model: typeof DEEPSEEK_MODEL;
  messages: DeepSeekMessage[];
  temperature: number;
  max_tokens: number;
  stream: false;
};

export type DeepSeekCardReadingInput = {
  cardTitle: string;
  cardCopy: string;
  modernGloss: string;
  actionSuggestion: string;
  sourceTitle: string;
  triggerLabel: string;
  toneLabel: string;
};

type DeepSeekChatCompletionResponse = {
  choices?: Array<{
    message?: {
      role?: string;
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

function asMessages(value: unknown): DeepSeekMessage[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item): DeepSeekMessage[] => {
    if (!item || typeof item !== "object") {
      return [];
    }
    const role = "role" in item ? item.role : undefined;
    const content = "content" in item ? item.content : undefined;

    if (
      (role === "system" || role === "user" || role === "assistant") &&
      typeof content === "string" &&
      content.trim().length > 0
    ) {
      return [{ role, content }];
    }

    return [];
  });
}

export function buildDeepSeekCardReadingMessages(
  input: DeepSeekCardReadingInput
): DeepSeekMessage[] {
  return [
    {
      role: "system",
      content:
        "你是一个中文 H5 相面互动里的安全文案助手。只基于给定卡牌文本做轻量解读，不做身份识别、医学判断、命运断言或绝对化预测。输出 2-3 句中文，语气温和、可行动。"
    },
    {
      role: "user",
      content: [
        `动作：${input.triggerLabel}`,
        `表达风格：${input.toneLabel}`,
        `卡牌标题：${input.cardTitle}`,
        `原始卡牌文案：${input.cardCopy}`,
        `现代释义：${input.modernGloss}`,
        `行动建议：${input.actionSuggestion}`,
        `出处：${input.sourceTitle}`,
        "请生成一段可直接展示在结果页的模型解读。"
      ].join("\n")
    }
  ];
}

export function createDeepSeekChatRequest(
  messages: DeepSeekMessage[]
): DeepSeekChatRequest {
  return {
    model: DEEPSEEK_MODEL,
    messages,
    temperature: 0.7,
    max_tokens: 420,
    stream: false
  };
}

export function normalizeDeepSeekProxyPayload(payload: unknown): DeepSeekChatRequest {
  const source = payload && typeof payload === "object" ? payload : {};
  const messages = asMessages("messages" in source ? source.messages : undefined);
  const normalizedMessages =
    messages.length > 0
      ? messages
      : [{ role: "user", content: "请生成一段简短、安全的中文结果解读。" } satisfies DeepSeekMessage];
  const temperature =
    "temperature" in source && typeof source.temperature === "number"
      ? Math.max(0, Math.min(2, source.temperature))
      : 0.7;

  return {
    ...createDeepSeekChatRequest(normalizedMessages),
    temperature
  };
}

export function extractDeepSeekReply(response: DeepSeekChatCompletionResponse): string {
  const reply = response.choices?.[0]?.message?.content?.trim();

  if (reply) {
    return reply;
  }

  throw new Error(response.error?.message ?? "DeepSeek did not return a message.");
}

export async function requestDeepSeekCardReading(
  input: DeepSeekCardReadingInput,
  fetcher: typeof fetch = fetch
): Promise<string> {
  const response = await fetcher(DEEPSEEK_PROXY_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(createDeepSeekChatRequest(buildDeepSeekCardReadingMessages(input)))
  });

  const payload = (await response.json()) as DeepSeekChatCompletionResponse;

  if (!response.ok) {
    throw new Error(payload.error?.message ?? `DeepSeek request failed: ${response.status}`);
  }

  return extractDeepSeekReply(payload);
}
