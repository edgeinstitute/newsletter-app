export type InviteTemplate = {
  subject: string;
  bodyHtml: string;
};

export const DEFAULT_INVITE_TEMPLATE: InviteTemplate = {
  subject: "Invitație la {{appName}}",
  bodyHtml: `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#fafaf9;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#0a0a0a;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fafaf9;padding:40px 16px;">
      <tr>
        <td align="center">
          <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e4e4e0;border-radius:8px;overflow:hidden;">
            <tr>
              <td style="padding:32px 32px 8px 32px;">
                <h1 style="margin:0;font-size:24px;font-weight:500;letter-spacing:-0.02em;">
                  Bun venit, {{fullName}}
                </h1>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 24px 32px;color:#525252;font-size:15px;line-height:1.6;">
                <p style="margin:0 0 16px 0;">
                  {{inviterName}} te-a invitat să te alături echipei <strong>{{appName}}</strong> cu rolul de <strong>{{role}}</strong>.
                </p>
                <p style="margin:0;">
                  Apasă butonul de mai jos pentru a-ți seta parola și a accesa platforma.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 32px 32px;" align="left">
                <a href="{{inviteLink}}" style="display:inline-block;background:#0a0a0a;color:#fafaf9;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:14px;font-weight:500;">
                  Acceptă invitația
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 32px 32px;border-top:1px solid #efefec;color:#737373;font-size:12px;line-height:1.6;">
                Dacă butonul nu funcționează, copiază acest link în browser:<br/>
                <span style="word-break:break-all;color:#404040;">{{inviteLink}}</span>
              </td>
            </tr>
          </table>
          <p style="margin:16px 0 0 0;color:#737373;font-size:12px;">
            {{appName}} · invitație trimisă lui {{email}}
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`,
};

export const PREVIEW_VARS: Record<string, string> = {
  fullName: "Ana Popescu",
  email: "ana.popescu@example.com",
  role: "Echipă",
  inviteLink: "https://app.edgeinstitute.ro/auth/callback?token=preview",
  inviterName: "Radu Onofrei",
  appName: "EDGE Newsletter",
};

export const TEMPLATE_VARIABLES: { key: string; label: string }[] = [
  { key: "fullName", label: "Numele complet al invitatului" },
  { key: "email", label: "Adresa de email a invitatului" },
  { key: "role", label: "Rolul atribuit" },
  { key: "inviteLink", label: "Linkul de invitație (obligatoriu)" },
  { key: "inviterName", label: "Numele adminului care trimite invitația" },
  { key: "appName", label: "Numele platformei" },
];

export function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => vars[key] ?? "");
}

export function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|tr|h[1-6])>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
