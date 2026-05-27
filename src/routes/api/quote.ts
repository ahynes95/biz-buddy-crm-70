import { createServerFn } from "@tanstack/react-start";

const RESEND_API_KEY = "re_bDTkJTAz_FNUHrXJtieJqVQQWUb5kfQN5";
const FROM = "info@fusionstack.net";
const NOTIFY_EMAILS = ["chrismikeg22@gmail.com", "austinmh95@gmail.com"];

type QuoteData = { name: string; email: string; business: string; need: string };

export const submitQuote = createServerFn({ method: "POST" })
  .validator((data: unknown) => data as QuoteData)
  .handler(async ({ data }) => {
    const { name, email, business, need } = data;

    if (!name || !email || !business || !need) {
      throw new Error("Missing fields");
    }

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: NOTIFY_EMAILS,
        subject: `New quote request from ${name} — ${business}`,
        html: `
          <h2>New Quote Request</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Business:</strong> ${business}</p>
          <p><strong>Need:</strong> ${need}</p>
        `,
      }),
    });

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [email],
        subject: "We received your request — FusionStack",
        html: `
          <h2>Thanks, ${name}!</h2>
          <p>We've received your request for a <strong>${need}</strong> and will get back to you within 24 hours.</p>
          <p>In the meantime, feel free to reply to this email with any questions.</p>
          <br/>
          <p>— The FusionStack Team</p>
        `,
      }),
    });

    return { success: true };
  });
