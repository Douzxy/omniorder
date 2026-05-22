import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function sendEmail(opts: {
  to: string; subject: string; html: string;
  user: string; password: string;
}): Promise<void> {
  const nodemailer = await import("npm:nodemailer@6.9.9");
  const transporter = nodemailer.default.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: { user: opts.user, pass: opts.password },
    tls: { rejectUnauthorized: false },
  });
  await transporter.sendMail({
    from: `OmniOrder <${opts.user}>`,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller }, error: authErr } = await supabaseAdmin.auth.getUser(token);
    if (authErr || !caller) throw new Error("Unauthorized");

    const { orderId } = await req.json();
    if (!orderId) throw new Error("orderId is required");

    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .select("*, items:order_items(*, product:products(*))")
      .eq("id", orderId)
      .single();

    if (orderErr || !order) throw new Error("Order not found");

    const { data: outlet } = await supabaseAdmin
      .from("outlets")
      .select("*")
      .eq("id", order.outlet_id)
      .single();

    if (!order.customer_email) {
      return new Response(
        JSON.stringify({ success: false, message: "No customer email" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const orderCode = order.order_code || order.id.substring(0, 8).toUpperCase();
    const itemsHtml = order.items?.map((item: any) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;">${item.product?.name || "Item"} x${item.quantity}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">Rp ${Number(item.total_price).toLocaleString("id-ID")}</td>
      </tr>
    `).join("") || "";

    const emailHtml = `
      <div style="max-width:600px;margin:0 auto;font-family:sans-serif;padding:20px;">
        <div style="text-align:center;padding:20px 0;">
          <h1 style="color:#f97316;margin:0;">OmniOrder</h1>
          <p style="color:#666;font-size:14px;">${outlet?.name || "Restoran"}</p>
        </div>
        <div style="background:#f97316;color:white;padding:20px;border-radius:12px;text-align:center;">
          <h2 style="margin:0 0 8px;">Pesanan Diterima!</h2>
          <p style="margin:0;font-size:14px;opacity:0.9;">Kode Pesanan: <strong>${orderCode}</strong></p>
        </div>
        <div style="padding:20px;background:#f9f9f9;border-radius:12px;margin-top:16px;">
          <p><strong>Pelanggan:</strong> ${order.customer_name}</p>
          <p><strong>Tipe:</strong> ${order.order_type === "dinein" ? "Makan di Tempat" : order.order_type === "takeaway" ? "Bawa Pulang" : "Delivery"}</p>
          ${order.table_number ? `<p><strong>Meja:</strong> ${order.table_number}</p>` : ""}
          <p><strong>Status:</strong> ${order.payment_status === "paid" ? "Lunas" : "Menunggu Pembayaran"}</p>
        </div>
        <table style="width:100%;border-collapse:collapse;margin-top:16px;">
          <thead>
            <tr style="background:#f97316;color:white;">
              <th style="padding:10px 12px;text-align:left;">Item</th>
              <th style="padding:10px 12px;text-align:right;">Harga</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
          <tfoot>
            <tr>
              <td style="padding:10px 12px;font-weight:bold;">Total</td>
              <td style="padding:10px 12px;text-align:right;font-weight:bold;color:#f97316;">Rp ${Number(order.total_amount).toLocaleString("id-ID")}</td>
            </tr>
          </tfoot>
        </table>
        <div style="text-align:center;padding:20px;color:#999;font-size:12px;">
          <p>Terima kasih telah memesan melalui OmniOrder.</p>
        </div>
      </div>
    `;

    const gmailPassword = Deno.env.get("GMAIL_APP_PASSWORD");
    if (gmailPassword) {
      await sendEmail({
        to: order.customer_email,
        subject: `Pesanan #${orderCode} - ${outlet?.name || "OmniOrder"}`,
        html: emailHtml,
        user: "edopriyatna.tech@gmail.com",
        password: gmailPassword,
      });
    } else {
      console.log("GMAIL_APP_PASSWORD not configured. Email not sent.");
    }

    return new Response(
      JSON.stringify({ success: true, email: order.customer_email }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("send-order-email error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
