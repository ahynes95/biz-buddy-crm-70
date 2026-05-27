import { json } from "@tanstack/react-start/server";
import { createAPIFileRoute } from "@tanstack/react-start/api";

const RESEND_API_KEY = "re_bDTkJTAz_FNUHrXJtieJqVQQWUb5kfQN5";
const FROM = "info@fusionstack.net";
const NOTIFY_EMAILS = ["chrismikeg22@gmail.com", "austinmh95@gmail.com"];

export const Route = createAPIFileRoute("/api/quote")({
  POST: async ({ request }) => {
    const { name, email, business, need } = await request.json();

    if (!name || !email || !business || !need) {
      return json({ error: "Missing fields" }, { status: 400 });
    }

    // Send notification to team
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
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

    // Send confirmation to customer
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
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

    return json({ success: true });
  },
});
