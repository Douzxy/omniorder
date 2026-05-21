import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { orderId, grossAmount, outletName } = await req.json();

    if (!orderId || !grossAmount) {
      throw new Error("Missing orderId or grossAmount");
    }

    const midtransServerKey = Deno.env.get("MIDTRANS_SERVER_KEY");
    if (!midtransServerKey) {
      throw new Error("Midtrans Server Key is not configured");
    }

    // Determine environment based on key prefix
    const isProduction = midtransServerKey.startsWith("Mid-server-");
    const apiUrl = isProduction
      ? "https://api.midtrans.com/v2/charge"
      : "https://api.sandbox.midtrans.com/v2/charge";

    const authString = btoa(`${midtransServerKey}:`);

    const midtransPayload = {
      payment_type: "qris",
      transaction_details: {
        order_id: orderId,
        gross_amount: Math.round(grossAmount),
      },
      custom_field1: outletName || "OmniOrder"
    };

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": `Basic ${authString}`,
      },
      body: JSON.stringify(midtransPayload),
    });

    const midtransResult = await response.json();

    if (!response.ok || midtransResult.status_code !== "201") {
      console.error("Midtrans API Error:", midtransResult);
      throw new Error(midtransResult.status_message || "Midtrans payment failed");
    }

    // Midtrans returns actions array for QRIS. QR code URL is usually action[0].url
    const qrUrl = midtransResult.actions?.find((a: any) => a.name === "generate-qr-code")?.url;

    if (!qrUrl) {
      throw new Error("No QR code returned from Midtrans");
    }

    return new Response(
      JSON.stringify({ qrUrl, transactionId: midtransResult.transaction_id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
