export function formatNotificationDisplay(input: {
  actorName?: string | null;
  actorEmail?: string | null;
  message?: string | null;
  fallbackMessage: string;
}): { actorText: string | null; messageText: string } {
  const actorText = (input.actorName ?? input.actorEmail ?? "").trim() || null;
  const fallbackMessage = input.fallbackMessage;
  const rawMessage = (input.message ?? "").trim();

  let messageText = rawMessage || fallbackMessage;

  if (actorText) {
    // If DB stored a message with the actor already inside it, strip it.
    const actorLower = actorText.toLowerCase();

    if (messageText.toLowerCase().startsWith("someone ")) {
      messageText = messageText.slice("someone ".length).trimStart();
    }

    if (messageText.toLowerCase().startsWith(actorLower + " ")) {
      messageText = messageText.slice(actorText.length).trimStart();
    }

    return { actorText, messageText };
  }

  // No actor name/email available: prefix with "Someone" unless already present.
  if (!messageText.toLowerCase().startsWith("someone")) {
    messageText = `Someone ${messageText}`.trim();
  }

  return { actorText: null, messageText };
}
