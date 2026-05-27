// @ts-ignore
const getServerEntry = () => import("virtual:react-server-entry").then(m => m.getServerEntry?.() ?? m.default);

const RESEND_API_KEY = "re_bDTkJTAz_FNUHrXJtieJqVQQWUb5kfQN5";
const FROM = "info@fusionstack.net";
const NOTIFY_EMAILS = ["chrismikeg22@gmail.com", "austinmh95@gmail.com"];
const SUPABASE_URL = "https://hdempuicehrxbjwlddpk.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkZW1wdWljZWhyeGJqd2xkZHBrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTU5MjQ2MSwiZXhwIjoyMDk1MTY4NDYxfQ.zj_0jXelk7Jl773ge5_h6QVq1QbMb7Zl2C81GwnSjJg";

function isCatastrophicSsrErrorBody(body: string, status: number) {
  return status === 500 && body.includes("__VITE_ERROR__");
}

function brandedErrorResponse() {
  return new Response("Internal Server Error", { status: 500 });
}

function consumeLastCapturedError() {
  return null;
}

async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;
  const body = await response.clone().text();
  if (!isCatastrophicSsrErrorBody(body, response.status)) {
    return response;
  }
  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return brandedErrorResponse();
}

async function handleQuote(request: Request): Promise<Response> {
  try {
    const { name, email, business, need } = await request.json() as Record<string, string>;

    if (!name || !email || !business || !need) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    // Insert lead into Supabase CRM
    await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
      method: "POST",
      headers: {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
      },
      body: JSON.stringify({ name, email, business, need, status: "new" }),
    });

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

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const url = new URL(request.url);

    if (url.pathname === "/api/quote" && request.method === "POST") {
      return handleQuote(request);
    }

    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return brandedErrorResponse();
    }
  },
};
