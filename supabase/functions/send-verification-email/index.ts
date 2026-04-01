import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

interface VerificationRequest {
  user_id: string;
  email: string;
  redirect_url?: string;
}

async function sendVerificationEmailWithRetry(
  supabase: any,
  email: string,
  redirectUrl: string,
  attempt: number = 1
): Promise<boolean> {
  try {
    console.log(`[VerificationEmail] Attempt ${attempt}/${MAX_RETRIES} - Sending to: ${email}`);

    const { error } = await supabase.auth.admin.sendRawEmail({
      to: email,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2>Verify Your Email</h2>
          <p>Thank you for signing up for Adstartup!</p>
          <p>To complete your registration and access your account, please verify your email address by clicking the button below:</p>
          <p>
            <a href="${redirectUrl}" style="display: inline-block; padding: 12px 24px; background-color: #dc2626; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Verify Email
            </a>
          </p>
          <p>If you didn't create this account, you can ignore this email.</p>
          <p style="color: #999; font-size: 12px;">
            This verification link expires in 24 hours.
          </p>
        </div>
      `,
      subject: 'Verify Your Adstartup Email',
    });

    if (error) {
      console.error(`[VerificationEmail] Error attempt ${attempt}/${MAX_RETRIES} - email: ${email}, error:`, error);
      
      if (attempt < MAX_RETRIES) {
        console.log(`[VerificationEmail] Retrying in ${RETRY_DELAY_MS}ms - email: ${email}`);
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
        return sendVerificationEmailWithRetry(supabase, email, redirectUrl, attempt + 1);
      }
      return false;
    }

    console.log(`[VerificationEmail] SUCCESS - email: ${email}`);
    return true;
  } catch (error) {
    console.error(`[VerificationEmail] Exception attempt ${attempt}/${MAX_RETRIES} - email: ${email}, error:`, error);
    
    if (attempt < MAX_RETRIES) {
      console.log(`[VerificationEmail] Retrying in ${RETRY_DELAY_MS}ms - email: ${email}`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      return sendVerificationEmailWithRetry(supabase, email, redirectUrl, attempt + 1);
    }
    return false;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { user_id, email, redirect_url } = await req.json() as VerificationRequest;

    if (!user_id || !email) {
      console.error('[VerificationEmail] BLOCKED - Missing user_id or email');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'user_id and email are required',
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('[VerificationEmail] Missing Supabase environment variables');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Server configuration error',
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const defaultRedirectUrl = redirect_url || `${supabaseUrl.replace(/\/$/, '')}/auth/confirm`;

    console.log(`[VerificationEmail] Processing - user_id: ${user_id}, email: ${email}`);

    const success = await sendVerificationEmailWithRetry(supabase, email, defaultRedirectUrl);

    const message = success
      ? 'Verification email sent successfully'
      : 'Failed to send verification email after retries';

    console.log(`[VerificationEmail] Final result - user_id: ${user_id}, email: ${email}, success: ${success}`);

    return new Response(
      JSON.stringify({
        success,
        user_id,
        email,
        message,
      }),
      {
        status: success ? 200 : 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('[VerificationEmail] Unexpected error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
