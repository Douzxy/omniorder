import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const midtransServerKey = Deno.env.get("MIDTRANS_SERVER_KEY");
    if (!midtransServerKey) {
      throw new Error("Midtrans Server Key is not configured");
    }

    const body = await req.json();
    console.log("Webhook received:", JSON.stringify(body));

    const { order_id, transaction_id, transaction_status, fraud_status, gross_amount, status_code, signature_key } = body;

    if (!order_id || !transaction_status) {
      throw new Error("Missing required fields: order_id, transaction_status");
    }

    // Verify signature
    const serverKey = midtransServerKey.replace("Mid-server-", "").replace("SB-Mid-server-", "");
    const hashInput = `${order_id}${status_code}${gross_amount}${serverKey}`;
    const hashBytes = await crypto.subtle.digest("SHA-512", new TextEncoder().encode(hashInput));
    const hashArray = Array.from(new Uint8Array(hashBytes));
    const expectedSignature = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

    const providedSignature = signature_key || req.headers.get("x-midtrans-signature") || "";

    // In development, skip strict signature verification
    if (!serverKey.startsWith("SB-")) {
      if (providedSignature && expectedSignature !== providedSignature) {
        console.error("Signature mismatch:", { expected: expectedSignature, provided: providedSignature });
        throw new Error("Invalid signature");
      }
    }

    // Map Midtrans status to our status
    let paymentStatus = "pending";
    let orderStatus = "pending";

    switch (transaction_status) {
      case "capture":
        if (fraud_status === "accept") {
          paymentStatus = "paid";
          orderStatus = "preparing";
        }
        break;
      case "settlement":
        paymentStatus = "paid";
        orderStatus = "preparing";
        break;
      case "pending":
        paymentStatus = "pending";
        orderStatus = "pending";
        break;
      case "deny":
      case "cancel":
      case "expire":
        paymentStatus = "failed";
        orderStatus = "cancelled";
        break;
      case "failure":
        paymentStatus = "failed";
        orderStatus = "cancelled";
        break;
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const updateData: Record<string, unknown> = {
      payment_status: paymentStatus,
      status: orderStatus,
      transaction_id: transaction_id || null,
      midtrans_response: body,
    };

    if (paymentStatus === "paid") {
      updateData.payment_settled_at = new Date().toISOString();
    }

    const { error: updateErr } = await supabaseAdmin
      .from("orders")
      .update(updateData)
      .eq("id", order_id);

    if (updateErr) {
      console.error("Failed to update order:", updateErr);
      throw updateErr;
    }

    console.log(`Order ${order_id} updated: payment=${paymentStatus}, status=${orderStatus}`);

    // If order is paid, trigger the email receipt sending programmatically in the background
    if (paymentStatus === "paid") {
      try {
        const { data: orderRow } = await supabaseAdmin
          .from("orders")
          .select("send_receipt, customer_email")
          .eq("id", order_id)
          .single();

        if (orderRow?.send_receipt && orderRow?.customer_email) {
          console.log(`Triggering send-order-email for order ${order_id}`);
          await supabaseAdmin.functions.invoke("send-order-email", {
            body: { orderId: order_id }
          }).then(({ data, error }) => {
            if (error) console.error("Failed to invoke send-order-email via webhook:", error);
            else console.log("Successfully invoked send-order-email via webhook:", data);
          });
        }
      } catch (err: any) {
        console.error("Error triggering send-order-email inside webhook:", err.message);
      }
    }

    return new Response(
      JSON.stringify({ success: true, order_id, payment_status: paymentStatus }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Webhook error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
