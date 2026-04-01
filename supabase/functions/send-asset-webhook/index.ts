import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const WEBHOOK_URL = 'https://n8n.srv1181726.hstgr.cloud/webhook-test/assets';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

async function sendWebhookWithRetry(
  formData: FormData,
  fileName: string,
  userId: string,
  attempt: number = 1
): Promise<boolean> {
  try {
    console.log(
      `[Webhook] Attempt ${attempt}/${MAX_RETRIES} - Sending file: ${fileName}, user: ${userId}`
    );

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      console.log(
        `[Webhook] SUCCESS - user: ${userId}, file: ${fileName}, status: ${response.status}`
      );
      return true;
    }

    const responseText = await response.text();
    console.error(
      `[Webhook] Failed with status ${response.status} - user: ${userId}, file: ${fileName}, response: ${responseText}`
    );

    if (attempt < MAX_RETRIES && response.status >= 500) {
      console.log(
        `[Webhook] Retrying in ${RETRY_DELAY_MS}ms - user: ${userId}, file: ${fileName}`
      );
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      return sendWebhookWithRetry(formData, fileName, userId, attempt + 1);
    }

    return false;
  } catch (error) {
    console.error(
      `[Webhook] Error attempt ${attempt}/${MAX_RETRIES} - user: ${userId}, file: ${fileName}, error:`,
      error
    );

    if (attempt < MAX_RETRIES) {
      console.log(
        `[Webhook] Retrying in ${RETRY_DELAY_MS}ms - user: ${userId}, file: ${fileName}`
      );
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      return sendWebhookWithRetry(formData, fileName, userId, attempt + 1);
    }

    return false;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const contentType = req.headers.get('content-type') || '';

    if (!contentType.includes('multipart/form-data')) {
      console.error('[Webhook] BLOCKED - Invalid content type:', contentType);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Content-Type must be multipart/form-data',
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

    const formData = await req.formData();
    const userId = formData.get('user_id') as string;
    const fileName = formData.get('file_name') as string;
    const fileType = formData.get('file_type') as string;
    const fileSize = formData.get('file_size') as string;
    const uploadedAt = formData.get('uploaded_at') as string;
    const file = formData.get('file') as File;

    if (!userId) {
      console.error('[Webhook] BLOCKED - Missing user_id');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'user_id is required',
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

    if (!file) {
      console.error(`[Webhook] BLOCKED - Missing file binary for user: ${userId}`);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'file binary is required',
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

    if (!fileName) {
      console.error(`[Webhook] BLOCKED - Missing file_name for user: ${userId}`);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'file_name is required',
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

    console.log(
      `[Webhook] Processing upload - user: ${userId}, file: ${fileName}, size: ${fileSize} bytes`
    );

    const webhookFormData = new FormData();
    webhookFormData.append('user_id', userId);
    webhookFormData.append('file_name', fileName);
    webhookFormData.append('file_type', fileType || 'application/octet-stream');
    webhookFormData.append('file_size', fileSize || '0');
    webhookFormData.append('uploaded_at', uploadedAt || new Date().toISOString());
    webhookFormData.append('file', file, fileName);

    const webhookSuccess = await sendWebhookWithRetry(
      webhookFormData,
      fileName,
      userId
    );

    const message = webhookSuccess
      ? 'File sent to webhook successfully'
      : 'File webhook delivery failed after retries';

    console.log(
      `[Webhook] Final result - user: ${userId}, file: ${fileName}, success: ${webhookSuccess}`
    );

    return new Response(
      JSON.stringify({
        success: webhookSuccess,
        user_id: userId,
        file_name: fileName,
        file_size: fileSize,
        message,
      }),
      {
        status: webhookSuccess ? 200 : 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('[Webhook] Unexpected error:', error);
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
