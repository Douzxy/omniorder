import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const VALID_ROLES = ["super_admin", "brand_admin", "admin", "outlet_admin", "manager", "kasir"];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header", code: "missing_authorization" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller }, error: authErr } = await supabaseAdmin.auth.getUser(token);
    if (authErr || !caller) {
      return new Response(
        JSON.stringify({ error: "Unauthorized", code: "unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: callerProfile, error: profileGetErr } = await supabaseAdmin
      .from("profiles")
      .select("role, brand_code, outlet_id")
      .eq("id", caller.id)
      .single();
    
    if (profileGetErr || !callerProfile) {
      return new Response(
        JSON.stringify({ error: "Profile not found", code: "caller_profile_not_found" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { email, password, outlet_id, role, brand_code } = await req.json();
    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: "Email and password are required", code: "missing_credentials" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Role input validation
    const targetRole = role || "manager";
    if (!VALID_ROLES.includes(targetRole)) {
      return new Response(
        JSON.stringify({ error: `Invalid role: ${targetRole}`, code: "invalid_role" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify RBAC
    if (callerProfile.role !== "super_admin") {
      if (callerProfile.role === "brand_admin" || callerProfile.role === "admin") {
        if (brand_code !== callerProfile.brand_code) {
          return new Response(
            JSON.stringify({ error: "Forbidden: Cannot create user for another brand", code: "forbidden_brand" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (targetRole === "super_admin" || targetRole === "brand_admin" || targetRole === "admin") {
          return new Response(
            JSON.stringify({ error: "Forbidden: Cannot create this role", code: "forbidden_role" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } else if (callerProfile.role === "outlet_admin") {
        if (outlet_id !== callerProfile.outlet_id) {
          return new Response(
            JSON.stringify({ error: "Forbidden: Cannot create user for another outlet", code: "forbidden_outlet" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (targetRole !== "manager" && targetRole !== "kasir") {
          return new Response(
            JSON.stringify({ error: "Forbidden: Outlet admins can only create managers or cashiers", code: "forbidden_role" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } else {
        return new Response(
          JSON.stringify({ error: "Forbidden: Insufficient privileges", code: "forbidden" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Validate email uniqueness using RPC before creation
    const { data: emailExists, error: rpcErr } = await supabaseAdmin.rpc("check_email_exists", {
      email_to_check: email,
    });

    if (!rpcErr && emailExists) {
      return new Response(
        JSON.stringify({ error: "Email already registered", code: "email_already_exists" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create the new user
    const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createErr || !newUser.user) {
      const errMsg = createErr?.message ?? "Failed to create user";
      const isDuplicate = errMsg.toLowerCase().includes("already registered") || 
                          errMsg.toLowerCase().includes("already exists");
      return new Response(
        JSON.stringify({ 
          error: isDuplicate ? "Email already registered" : errMsg, 
          code: isDuplicate ? "email_already_exists" : "failed_to_create_user" 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Atomically upsert the profile to avoid primary key unique constraint violations
    const { error: profileErr } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: newUser.user.id,
        outlet_id: outlet_id || null,
        role: targetRole,
        brand_code: brand_code || null,
      }, { onConflict: "id" });

    if (profileErr) {
      // Clean up the auth user to keep state consistent and prevent orphan user accounts
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      return new Response(
        JSON.stringify({ error: `Failed to create profile: ${profileErr.message}`, code: "profile_creation_failed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, user_id: newUser.user.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "An unexpected error occurred", code: "unexpected_error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
