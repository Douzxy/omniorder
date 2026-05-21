import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
    const { data: { user: caller }, error: authErr } = await supabaseAdmin.auth.getUser(token);
    if (authErr || !caller) throw new Error("Unauthorized");

    const { data: callerProfile } = await supabaseAdmin
      .from("profiles").select("role, brand_code, outlet_id").eq("id", caller.id).single();
    
    if (!callerProfile) throw new Error("Profile not found");

    const { target_user_id, new_password } = await req.json();
    if (!target_user_id || !new_password) {
      throw new Error("target_user_id and new_password are required");
    }

    // Verify RBAC
    const { data: targetProfile, error: targetErr } = await supabaseAdmin
      .from("profiles").select("role, brand_code, outlet_id").eq("id", target_user_id).single();
    
    if (targetErr || !targetProfile) throw new Error("Target user profile not found");

    if (callerProfile.role !== "super_admin") {
      if (callerProfile.role === "brand_admin") {
        if (targetProfile.brand_code !== callerProfile.brand_code) {
          throw new Error("Forbidden: User not in your brand");
        }
      } else if (callerProfile.role === "outlet_admin") {
        if (targetProfile.outlet_id !== callerProfile.outlet_id) {
          throw new Error("Forbidden: User not in your outlet");
        }
      } else {
        throw new Error("Forbidden: Insufficient privileges");
      }
    }

    // Update password
    const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(target_user_id, {
      password: new_password
    });

    if (updateErr) throw new Error(updateErr.message);

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
