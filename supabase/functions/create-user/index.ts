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

    const { email, password, outlet_id, role, brand_code } = await req.json();
    if (!email || !password) throw new Error("email and password required");

    // Verify RBAC
    if (callerProfile.role !== "super_admin") {
      if (callerProfile.role === "brand_admin") {
        if (brand_code !== callerProfile.brand_code) {
          throw new Error("Forbidden: Cannot create user for another brand");
        }
        if (role === "super_admin" || role === "brand_admin") {
           throw new Error("Forbidden: Cannot create this role");
        }
      } else if (callerProfile.role === "outlet_admin") {
        if (outlet_id !== callerProfile.outlet_id) {
          throw new Error("Forbidden: Cannot create user for another outlet");
        }
        if (role !== "manager") {
          throw new Error("Forbidden: Outlet admins can only create managers");
        }
      } else {
        throw new Error("Forbidden: Insufficient privileges");
      }
    }

    // Create the new user
    const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (createErr || !newUser.user) throw new Error(createErr?.message ?? "Failed to create user");

    // Insert profile
    const { error: profileErr } = await supabaseAdmin.from("profiles").insert({
      id: newUser.user.id,
      outlet_id: outlet_id || null,
      role: role || "manager",
      brand_code: brand_code || null,
    });
    if (profileErr) throw new Error(profileErr.message);

    return new Response(
      JSON.stringify({ success: true, user_id: newUser.user.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
