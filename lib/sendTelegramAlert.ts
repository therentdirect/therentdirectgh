export async function sendTelegramAlert(message: string) {
  try {
    await fetch("/api/telegram", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    });
  } catch (error) {
    console.error("Telegram alert failed:", error);
  }
}