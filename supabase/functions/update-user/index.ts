import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller } } = await supabaseAdmin.auth.getUser(token);
    if (!caller) throw new Error("Unauthorized");

    const { data: callerProfile } = await supabaseAdmin
      .from("profiles").select("role, brand_code, outlet_id").eq("id", caller.id).single();

    if (!callerProfile) throw new Error("Profile not found");

    const { user_id, email, brand_code, outlet_id, role } = await req.json();
    if (!user_id) throw new Error("user_id required");

    // Verify RBAC
    const { data: targetProfile } = await supabaseAdmin
      .from("profiles").select("role, brand_code, outlet_id").eq("id", user_id).single();

    if (callerProfile.role !== "super_admin") {
      if (callerProfile.role === "brand_admin") {
        if (targetProfile?.brand_code !== callerProfile.brand_code) {
          throw new Error("Forbidden: User not in your brand");
        }
        if (targetProfile?.role === "super_admin" || targetProfile?.role === "brand_admin") {
          throw new Error("Forbidden: Cannot update this role");
        }
        if (brand_code && brand_code !== callerProfile.brand_code) {
          throw new Error("Forbidden: Cannot change brand_code");
        }
      } else if (callerProfile.role === "outlet_admin") {
        if (targetProfile?.outlet_id !== callerProfile.outlet_id) {
          throw new Error("Forbidden: User not in your outlet");
        }
        if (targetProfile?.role !== "manager") {
          throw new Error("Forbidden: Can only update managers");
        }
      } else {
        throw new Error("Forbidden: Insufficient privileges");
      }
    }

    const updates: Record<string, any> = {};

    if (email) {
      const { error: authErr } = await supabaseAdmin.auth.admin.updateUserById(user_id, { email });
      if (authErr) throw new Error(authErr.message);
    }

    if (brand_code !== undefined) {
      updates.brand_code = brand_code || null;
    }

    if (outlet_id !== undefined) {
      updates.outlet_id = outlet_id || null;
    }

    if (role !== undefined) {
      updates.role = role;
    }

    if (Object.keys(updates).length > 0) {
      const { error: profileErr } = await supabaseAdmin.from("profiles").update(updates).eq("id", user_id);
      if (profileErr) throw new Error(profileErr.message);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
