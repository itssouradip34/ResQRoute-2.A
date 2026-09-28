import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const EXOTEL_ACCOUNT_SID = Deno.env.get("EXOTEL_ACCOUNT_SID") || "";
const EXOTEL_API_KEY = Deno.env.get("EXOTEL_API_KEY") || "";
const EXOTEL_API_TOKEN = Deno.env.get("EXOTEL_API_TOKEN") || "";
// Default clean ExoPhone, or custom verified enterprise CLI (overriding old recycled PW numbers)
const DEFAULT_CALLER_ID = Deno.env.get("EXOTEL_CALLER_ID") || "08047359243";
const EXOTEL_APP_ID = Deno.env.get("EXOTEL_APP_ID") || "1323304";
const EXOTEL_SUBDOMAIN = Deno.env.get("EXOTEL_SUBDOMAIN") || "api.exotel.com";

serve(async (req) => {
  try {
    const { recipients, callerId, incidentDetails } = await req.json();

    if (!Array.isArray(recipients) || recipients.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing recipients list" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!EXOTEL_ACCOUNT_SID || !EXOTEL_API_KEY) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Exotel credentials not configured in Supabase Edge Function environment.",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Use customized verified Caller ID if passed in request, else fallback to environment variable
    const activeCallerId = callerId || DEFAULT_CALLER_ID;

    const auth = "Basic " + btoa(`${EXOTEL_API_KEY}:${EXOTEL_API_TOKEN}`);
    const url = `https://${EXOTEL_SUBDOMAIN}/v1/Accounts/${EXOTEL_ACCOUNT_SID}/Calls/connect`;

    const results = await Promise.all(
      recipients.map(async (to: string) => {
        const body = new URLSearchParams({
          From: to,
          CallerId: activeCallerId,
          Url: `http://my.exotel.com/exoml/start_voice/${EXOTEL_APP_ID}`,
          // Pass custom emergency parameters to IVR voice prompt
          ...(incidentDetails ? { CustomField: JSON.stringify(incidentDetails) } : {}),
        });

        const res = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: auth,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body,
        });

        const text = await res.text();
        return {
          to,
          ok: res.ok,
          callerIdUsed: activeCallerId,
          raw: text,
        };
      })
    );

    const allOk = results.every((r) => r.ok);
    return new Response(
      JSON.stringify({
        success: allOk,
        callerId: activeCallerId,
        results,
        tip: "If caller ID is tagged as 'PW' in Truecaller, register the number on Truecaller for Business or update EXOTEL_CALLER_ID to an unassigned number.",
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
