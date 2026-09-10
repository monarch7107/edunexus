import type { AiErrorClass } from "./types";

export class AiError extends Error {
  readonly className: AiErrorClass;
  readonly httpStatus: number;

  constructor(className: AiErrorClass, message: string, httpStatus = 400) {
    super(message);
    this.name = "AiError";
    this.className = className;
    this.httpStatus = httpStatus;
  }
}

export function isAiError(error: unknown): error is AiError {
  return error instanceof AiError;
}

export function classifyUnknown(error: unknown): AiErrorClass {
  if (isAiError(error)) return error.className;
  const msg = error instanceof Error ? error.message.toLowerCase() : "";
  if (/timeout|abort/.test(msg)) return "timeout";
  if (/network|fetch/.test(msg)) return "network";
  return "provider";
}
