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
    auth: { user: opts.user, pass: opts.password.replace(/\s+/g, "") },
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
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { orderId } = await req.json();
    if (!orderId) throw new Error("orderId is required");

    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .select("*, items:order_items(*, product:products(*), modifiers:order_item_modifiers(*))")
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
    const itemsHtml = order.items?.map((item: any) => {
      const notesText = item.notes ? `<br><small style="color: #555;">Catatan: ${item.notes}</small>` : "";
      const modifiersText = item.modifiers && item.modifiers.length > 0
        ? `<br><small style="color: #555;">Pilihan: ${item.modifiers.map((m: any) => `${m.modifier_name} (${m.option_name})`).join(", ")}</small>`
        : "";
      return `
        <li>
          <strong>${item.product?.name || "Item"}</strong> x${item.quantity} - Rp ${Number(item.total_price).toLocaleString("id-ID")}
          ${notesText}
          ${modifiersText}
        </li>
      `;
    }).join("") || "";

    const brandName = outlet?.name || "Restoran";

    const emailHtml = `
      <h2>Detail Pesanan - ${brandName}</h2>
      <p>Halo ${order.customer_name}, pesanan Anda telah diterima.</p>
      <p>
        <strong>Kode Pesanan:</strong> ${orderCode}<br>
        <strong>Tipe Pemesanan:</strong> ${order.order_type === "dinein" ? "Makan di Tempat" : order.order_type === "takeaway" ? "Bawa Pulang" : "Pengiriman"}<br>
        ${order.table_number ? `<strong>Nomor Meja:</strong> Meja ${order.table_number}<br>` : ""}
        <strong>Status Pembayaran:</strong> ${order.payment_status === "paid" ? "Lunas" : "Menunggu Pembayaran"}<br>
        ${order.customer_notes ? `<strong>Catatan Pesanan:</strong> ${order.customer_notes}<br>` : ""}
      </p>
      <h3>Detail Item:</h3>
      <ul>
        ${itemsHtml}
      </ul>
      <p>
        Subtotal: Rp ${Number(Number(order.total_amount) - Number(order.tax_amount)).toLocaleString("id-ID")}<br>
        ${Number(order.tax_amount) > 0 ? `Pajak & Layanan (PPN): Rp ${Number(order.tax_amount).toLocaleString("id-ID")}<br>` : ""}
        <strong>Total Pembayaran: Rp ${Number(order.total_amount).toLocaleString("id-ID")}</strong>
      </p>
      <p>Terima kasih atas pesanan Anda di ${brandName}!</p>
    `;

    const gmailPassword = Deno.env.get("GMAIL_APP_PASSWORD") || "rgwh eoni gukt eclc";
    await sendEmail({
      to: order.customer_email,
      subject: `Pesanan #${orderCode} - ${brandName}`,
      html: emailHtml,
      user: "edopriyatna.tech@gmail.com",
      password: gmailPassword,
    });

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
