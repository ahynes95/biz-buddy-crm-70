import "./lib/error-capture";
import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

const FROM = "info@fusionstack.net";
const NOTIFY_EMAILS = ["chrismikeg22@gmail.com", "austinmh95@gmail.com"];

type Env = { RESEND_API_KEY?: string };

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;
async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => ((m as { default?: ServerEntry }).default ?? (m as unknown as ServerEntry)),
    );
  }
  return serverEntryPromise;
}

function brandedErrorResponse(): Response {
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isCatastrophicSsrErrorBody(body: string, responseStatus: number): boolean {
  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return false;
  }
  if (!payload || Array.isArray(payload) || typeof payload !== "object") {
    return false;
  }
  const fields = payload as Record<string, unknown>;
  const expectedKeys = new Set(["message", "status", "unhandled"]);
  if (!Object.keys(fields).every((key) => expectedKeys.has(key))) {
    return false;
  }
  return (
    fields.unhandled === true &&
    fields.message === "HTTPError" &&
    (fields.status === undefined || fields.status === responseStatus)
  );
}

async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;
  const body = await response.clone().text();
  if (!isCatastrophicSsrErrorBody(body, response.status)) {
    return response;
  }
  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return brandedErrorResponse();
}

async function handleQuote(request: Request, apiKey: string): Promise<Response> {
  try {
    const { name, email, business, need } = await request.json() as Record<string, string>;

    if (!name || !email || !business || !need) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
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
        "Authorization": `Bearer ${apiKey}`,
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
  async fetch(request: Request, env: Env, ctx: unknown) {
    const url = new URL(request.url);

    if (url.pathname === "/api/quote" && request.method === "POST") {
      const apiKey = env.RESEND_API_KEY ?? "re_bDTkJTAz_FNUHrXJtieJqVQQWUb5kfQN5";
      return handleQuote(request, apiKey);
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
