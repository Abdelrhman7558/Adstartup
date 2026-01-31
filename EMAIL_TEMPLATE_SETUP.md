# Email Template Customization for Adstartup

## Overview
This document provides instructions for customizing the Supabase email verification template to match Adstartup branding.

## Steps to Customize Email Template

### 1. Access Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Email Templates**

### 2. Customize Confirmation Email

#### Email Subject
```
Welcome to Adstartup! Confirm your email
```

#### Email Body (HTML)
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', sans-serif;
      background-color: #000000;
      color: #ffffff;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .logo {
      font-size: 32px;
      font-weight: bold;
      color: #dc2626;
      margin-bottom: 30px;
      text-align: center;
    }
    .content {
      background-color: #1a1a1a;
      border: 1px solid #333333;
      border-radius: 12px;
      padding: 40px;
    }
    h1 {
      font-size: 24px;
      margin: 0 0 20px 0;
      color: #ffffff;
    }
    p {
      font-size: 16px;
      line-height: 1.6;
      color: #cccccc;
      margin: 0 0 20px 0;
    }
    .button {
      display: inline-block;
      background-color: #dc2626;
      color: #ffffff;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      color: #666666;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">Adstartup</div>
    <div class="content">
      <h1>مرحباً بك في Adstartup!</h1>
      <p>شكراً لتسجيلك معنا. يرجى تأكيد بريدك الإلكتروني للبدء باستخدام حسابك.</p>
      <p>Hello {{ .Email }},</p>
      <p>Thank you for signing up with Adstartup! Please confirm your email address to activate your account and start creating powerful advertising campaigns.</p>
      <center>
        <a href="{{ .ConfirmationURL }}" class="button">تأكيد البريد الإلكتروني / Confirm Email</a>
      </center>
      <p style="font-size: 14px; color: #999999; margin-top: 30px;">
        إذا لم تقم بإنشاء هذا الحساب، يمكنك تجاهل هذه الرسالة.<br>
        If you didn't create this account, you can safely ignore this email.
      </p>
    </div>
    <div class="footer">
      <p>© 2024 Adstartup. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
```

#### Available Template Variables
- `{{ .Email }}` - User's email address
- `{{ .ConfirmationURL }}` - Auto-generated confirmation link
- `{{ .Token }}` - Confirmation token
- `{{ .TokenHash }}` - Hashed token
- `{{ .SiteURL }}` - Your site URL

### 3. Configure Redirect URL

In **Authentication** → **URL Configuration**, set:
- **Site URL**: `https://adstartup.ai` (or your production domain)
- **Redirect URLs**: Add `https://adstartup.ai/auth/confirm`

For local development, also add:
- `http://localhost:5173/auth/confirm`

### 4. Email Settings

In **Authentication** → **Providers** → **Email**:
- ✅ Enable Email provider
- ✅ Confirm email (Enable email confirmations)
- Set confirmation email template to the custom template above

### 5. SMTP Configuration (Optional but Recommended)

For production, configure custom SMTP in **Project Settings** → **Auth** → **SMTP Settings**:
- Use a service like SendGrid, AWS SES, or Mailgun
- This ensures better deliverability and branded sender address

Example SMTP settings for SendGrid:
```
Host: smtp.sendgrid.net
Port: 587
User: apikey
Password: [Your SendGrid API Key]
Sender email: noreply@adstartup.ai
Sender name: Adstartup
```

## Testing the Email Flow

1. Sign up with a test email address
2. Check your inbox for the confirmation email
3. Verify the email has Adstartup branding
4. Click the confirmation link
5. Verify redirect to `/auth/confirm` page
6. Verify automatic redirect to dashboard

## Troubleshooting

### Email not received
- Check spam/junk folder
- Verify email provider is enabled
- Check Supabase logs in Dashboard → Authentication → Logs

### Confirmation link not working
- Verify redirect URLs are configured correctly
- Check that the `/auth/confirm` route exists in your app
- Ensure site URL matches your domain

### Styling issues
- Test email in different email clients (Gmail, Outlook, Apple Mail)
- Some email clients strip certain CSS - keep styles simple
- Use inline styles for better compatibility

## Notes

- Email templates are configured per Supabase project
- Changes to email templates are immediate (no deployment needed)
- Test thoroughly before using in production
- Consider different languages if you have international users
