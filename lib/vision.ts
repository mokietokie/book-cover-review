import "server-only";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export class VisionRecognitionError extends Error {
  constructor(message = "표지를 인식하지 못했어요") {
    super(message);
    this.name = "VisionRecognitionError";
  }
}

export interface IdentifiedBook {
  title: string;
  author: string;
}

const SYSTEM_PROMPT =
  '이미지는 책 표지 사진이다. 표지에서 책 제목과 저자 이름을 읽어 다음 JSON 형식으로만 답하라: {"title": "...", "author": "..."}. ' +
  "제목이나 저자를 읽을 수 없으면 해당 값을 빈 문자열로 둔다. JSON 외의 다른 텍스트는 출력하지 않는다.";

function extractJson(text: string): { title?: string; author?: string } {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new VisionRecognitionError();
  }
  try {
    return JSON.parse(match[0]);
  } catch {
    throw new VisionRecognitionError();
  }
}

export async function identifyBook(
  imageBase64: string,
  mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif"
): Promise<IdentifiedBook> {
  const message = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 256,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType,
              data: imageBase64,
            },
          },
          {
            type: "text",
            text: "이 책 표지의 제목과 저자를 알려줘.",
          },
        ],
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new VisionRecognitionError();
  }

  const parsed = extractJson(textBlock.text);
  const title = (parsed.title ?? "").trim();
  const author = (parsed.author ?? "").trim();

  if (!title && !author) {
    throw new VisionRecognitionError();
  }

  return { title, author };
}
