import "server-only";

export type MailgunConfig = {
  apiKey: string;
  domain: string;
  fromEmail: string;
  fromName: string;
  region: "us" | "eu";
};

export async function postToMailgun(
  cfg: MailgunConfig,
  payload: { to: string; subject: string; html: string; text: string },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const base = cfg.region === "eu" ? "https://api.eu.mailgun.net" : "https://api.mailgun.net";
  const url = `${base}/v3/${encodeURIComponent(cfg.domain)}/messages`;

  const fromHeader = cfg.fromName ? `${cfg.fromName} <${cfg.fromEmail}>` : cfg.fromEmail;

  const body = new URLSearchParams();
  body.set("from", fromHeader);
  body.set("to", payload.to);
  body.set("subject", payload.subject);
  body.set("html", payload.html);
  body.set("text", payload.text);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`api:${cfg.apiKey}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return {
      ok: false,
      error: `Mailgun ${res.status}: ${text.slice(0, 200) || res.statusText}`,
    };
  }
  return { ok: true };
}
