import type { PosterRenderModel } from "./phase6-launch";

export type PosterCanvasFactory = () => HTMLCanvasElement;

export type PosterRenderOptions = {
  createCanvas?: PosterCanvasFactory;
  width?: number;
  height?: number;
};

const DEFAULT_WIDTH = 900;
const DEFAULT_HEIGHT = 1200;
const PADDING = 72;

function defaultCreateCanvas(): HTMLCanvasElement {
  return document.createElement("canvas");
}

function ensureContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas 2D context is not available");
  }

  return context;
}

function fillWrappedText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number
): number {
  const words = Array.from(text);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const nextLine = `${currentLine}${word}`;

    if (context.measureText(nextLine).width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = nextLine;
    }

    if (lines.length === maxLines) {
      break;
    }
  }

  if (lines.length < maxLines && currentLine) {
    lines.push(currentLine);
  }

  lines.slice(0, maxLines).forEach((line, index) => {
    context.fillText(line, x, y + index * lineHeight);
  });

  return y + lines.length * lineHeight;
}

function drawQrPlaceholder(context: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  context.fillStyle = "#111827";
  context.fillRect(x, y, size, size);
  context.fillStyle = "#ffffff";

  const cell = size / 7;

  for (let row = 1; row < 6; row += 1) {
    for (let col = 1; col < 6; col += 1) {
      if ((row + col) % 2 === 0 || row === col) {
        context.fillRect(x + col * cell, y + row * cell, cell * 0.72, cell * 0.72);
      }
    }
  }
}

export function renderPosterPngDataUrl(
  model: PosterRenderModel,
  options: PosterRenderOptions = {}
): string {
  if (model.includes_raw_face) {
    throw new Error("Poster rendering rejects raw face imagery");
  }

  const width = options.width ?? DEFAULT_WIDTH;
  const height = options.height ?? DEFAULT_HEIGHT;
  const canvas = (options.createCanvas ?? defaultCreateCanvas)();
  canvas.width = width;
  canvas.height = height;

  const context = ensureContext(canvas);

  context.fillStyle = "#f8efe2";
  context.fillRect(0, 0, width, height);
  context.fillStyle = "#7c2d12";
  context.fillRect(0, 0, width, 20);
  context.fillRect(0, height - 20, width, 20);

  context.fillStyle = "#111827";
  context.font = "700 34px system-ui, sans-serif";
  context.fillText(model.theme_name, PADDING, 112);

  context.fillStyle = "#9a3412";
  context.font = "500 24px system-ui, sans-serif";
  context.fillText(model.template_id, PADDING, 154);

  context.fillStyle = "#111827";
  context.font = "800 64px system-ui, sans-serif";
  const afterTitle = fillWrappedText(context, model.card_title, PADDING, 280, width - PADDING * 2, 78, 3);

  context.fillStyle = "#374151";
  context.font = "400 32px system-ui, sans-serif";
  const afterCopy = fillWrappedText(
    context,
    model.safe_copy,
    PADDING,
    afterTitle + 56,
    width - PADDING * 2,
    48,
    4
  );

  context.fillStyle = "#7c2d12";
  context.font = "700 30px system-ui, sans-serif";
  context.fillText("行动建议", PADDING, afterCopy + 72);
  context.fillStyle = "#111827";
  context.font = "400 30px system-ui, sans-serif";
  fillWrappedText(context, model.action_suggestion, PADDING, afterCopy + 122, width - PADDING * 2, 46, 4);

  drawQrPlaceholder(context, width - PADDING - 150, height - PADDING - 150, 150);

  context.fillStyle = "#4b5563";
  context.font = "400 22px system-ui, sans-serif";
  fillWrappedText(context, model.disclaimer, PADDING, height - 230, width - PADDING * 2 - 190, 32, 4);

  context.fillStyle = "#6b7280";
  context.font = "400 18px system-ui, sans-serif";
  context.fillText(`QR: ${model.qr_target}`, PADDING, height - 64);

  return canvas.toDataURL("image/png");
}

export async function renderPosterPngBlob(
  model: PosterRenderModel,
  options: PosterRenderOptions = {}
): Promise<Blob> {
  const dataUrl = renderPosterPngDataUrl(model, options);
  const response = await fetch(dataUrl);

  return response.blob();
}
