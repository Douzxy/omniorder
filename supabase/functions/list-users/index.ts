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

    // Fetch all users from auth.admin
    // In production with >1000 users, we'd need pagination. For now, listUsers fetches up to 50 or 500 depending on Supabase version. We can specify perPage.
    const { data: authUsers, error: listErr } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    if (listErr) throw new Error(listErr.message);

    // Fetch all profiles
    const { data: allProfiles, error: profErr } = await supabaseAdmin.from("profiles").select("*");
    if (profErr) throw new Error(profErr.message);

    // Merge users
    let users = allProfiles.map(p => {
      const authUser = authUsers.users.find(u => u.id === p.id);
      return {
        id: p.id,
        email: authUser?.email || "Unknown",
        profile: p
      };
    });

    // Apply RBAC filtering
    if (callerProfile.role !== "super_admin") {
      if (callerProfile.role === "brand_admin") {
        // Brand admin sees users belonging to their brand OR their outlets
        users = users.filter(u => u.profile.brand_code === callerProfile.brand_code);
      } else if (callerProfile.role === "outlet_admin") {
        // Outlet admin sees users belonging to their outlet
        users = users.filter(u => u.profile.outlet_id === callerProfile.outlet_id);
      } else {
        // Regular managers cannot list users
        throw new Error("Forbidden: Insufficient privileges");
      }
    }

    return new Response(
      JSON.stringify(users),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
