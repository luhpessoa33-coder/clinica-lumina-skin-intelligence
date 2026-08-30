import { ENV } from "./env";

export type NotificationPayload = {
  title: string;
  content: string;
};

const TITLE_MAX_LENGTH = 1200;
const CONTENT_MAX_LENGTH = 20000;

const trimValue = (value: string): string => value.trim();
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const validatePayload = (input: NotificationPayload): NotificationPayload => {
  if (!isNonEmptyString(input.title)) {
    throw new Error("Notification title is required.");
  }
  if (!isNonEmptyString(input.content)) {
    throw new Error("Notification content is required.");
  }

  const title = trimValue(input.title);
  const content = trimValue(input.content);

  if (title.length > TITLE_MAX_LENGTH) {
    throw new Error(`Notification title must be at most ${TITLE_MAX_LENGTH} characters.`);
  }

  if (content.length > CONTENT_MAX_LENGTH) {
    throw new Error(`Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`);
  }

  return { title, content };
};

/**
 * Dispatches an alert to any HTTPS webhook compatible with a JSON payload.
 */
export async function notifyOwner(
  payload: NotificationPayload
): Promise<boolean> {
  const { title, content } = validatePayload(payload);

  if (!ENV.alertWebhookUrl) return false;

  try {
    const response = await fetch(ENV.alertWebhookUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ title, content }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${
          detail ? `: ${detail}` : ""
        }`
      );
      return false;
    }

    return true;
  } catch (error) {
    console.warn("[Notification] Error calling alert webhook:", error);
    return false;
  }
}
