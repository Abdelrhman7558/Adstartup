# User Guide - Quick Reference

## New User Registration (Signup)

### How It Works:
1. Go to `/signup` page
2. Fill in all required fields:
   - Full Name
   - Email
   - Phone Number
   - Password
3. Click "Sign Up"
4. System automatically:
   - Creates your account
   - Saves your data to database (with automatic retry if needed)
   - Sends verification email to your inbox
5. Check your email inbox
6. Click the verification link in the email
7. Your account is now verified and ready to use

### Important Notes:
- You **cannot sign in** until you verify your email
- If you try to sign in before verification, you'll see: "Your email is not verified. Please check your inbox and click the verification link."
- If signup fails, the system will automatically retry 3 times
- If all retries fail, you'll need to start over

---

## Email Verification

### After Signup:
1. Check your email inbox (including spam folder)
2. Look for email from Adstartup
3. Click the verification link
4. You'll be redirected to confirmation page
5. Your account is now verified
6. You can now sign in

### If Email Doesn't Arrive:
- Wait 2-3 minutes (system retries automatically)
- Check spam/junk folder
- Try signing up again with same email
- Contact support if issue persists

---

## Sign In

### Normal Sign In:
1. Go to `/signin` page
2. Enter your email and password
3. Click "Sign In"
4. If verified → Access granted to Dashboard
5. If not verified → Error message shown

### Error Messages:
- "Your email is not verified" → Check your inbox for verification email
- "Your email is not confirmed" → Supabase email confirmation required
- Invalid credentials → Check your email/password

---

## Forgot Password

### How to Reset Your Password:
1. Go to Sign In page (`/signin`)
2. Click "Forgot password?" link (red text, bottom right)
3. Enter your email address
4. Click "Send Reset Link"
5. Check your email inbox
6. Click the password reset link
7. Enter your new password
8. Click "Reset Password"
9. You can now sign in with your new password

### Important:
- Reset link expires after certain time
- Use a strong password
- Remember your new password
- You'll be redirected to `/reset-password` page from email

---

## Dashboard - Campaign Section

### Accessing Campaigns:
1. Sign in to your account
2. You'll see Dashboard with Sidebar on the left
3. Click "Campaigns" in the Sidebar
4. Campaign section opens **inside** Dashboard
5. Sidebar remains visible (does not hide)

### Campaign Features:

#### View Campaigns:
- All your campaigns displayed as cards
- Each card shows:
  - Campaign Name
  - Campaign ID
  - Status (Active/Paused/Completed) with colored badge
  - Results: Profit or Loss in dollars
  - Start Date (if available)
  - End Date (if available)

#### Reload Campaigns:
- Click "Reload" button (refresh icon) in top-right corner
- System fetches latest campaigns from server
- Loading spinner shows while fetching
- Data updates automatically

#### Remove Campaign:
- Click trash icon on any campaign card
- Confirmation dialog appears
- Click "OK" to confirm removal
- Campaign removed from list immediately

#### Empty State:
- If you have no campaigns yet, you'll see:
  - Folder icon
  - "No campaigns found" message

#### Error Handling:
- If fetch fails, you'll see error banner at top
- Click "Try again" to retry
- Error message explains what went wrong

---

## Dashboard Navigation

### Sidebar Menu Items:
1. **Home** - Dashboard overview with stats
2. **Campaigns** - All your campaigns list
3. **Active Ads** - Currently running ads
4. **Assets** - Your uploaded assets
5. **Ads** - All ads management
6. **Insights** - Analytics and insights

### Top Bar Actions:
- **New Campaign** button - Create new campaign
- **Refresh** button - Reload dashboard data
- **Connect Meta** button - Connect Facebook/Instagram account (if not connected)
- **Notifications** icon - View notifications
- **User Menu** - Account settings

### Settings:
- Click "Settings" in Sidebar (bottom section)
- Update your profile information
- Change display name
- Manage account preferences

### Theme Toggle:
- Click Moon/Sun icon in Sidebar (bottom section)
- Switch between Light and Dark mode
- Preference saved automatically

### Sign Out:
- Click "Sign Out" in Sidebar (bottom section)
- You'll be signed out and redirected to Sign In page

---

## Trial System

### Trial Status:
- If you're on a trial, you'll see trial badge in top bar
- Shows remaining days
- Format: "Trial: X days left"
- Orange badge for visibility

### Trial Expiration:
- When trial expires, you'll be redirected to Plans page
- Choose a subscription plan to continue
- All your data remains safe

---

## Important Features

### Data Integrity:
- All your data is saved securely in Supabase
- Automatic retries prevent data loss
- Your campaigns, assets, and settings are always safe

### Error Recovery:
- System automatically retries failed operations
- Clear error messages help you understand issues
- Support is available if you need help

### Security:
- Passwords are encrypted
- Email verification required
- Secure password reset process
- Row Level Security (RLS) protects your data

---

## Common Issues & Solutions

### Issue: Cannot Sign In
**Solutions:**
1. Check if you verified your email
2. Try "Forgot Password" if you forgot password
3. Check if you're using correct email
4. Clear browser cache and try again

### Issue: Didn't Receive Verification Email
**Solutions:**
1. Check spam/junk folder
2. Wait 2-3 minutes (system retries automatically)
3. Try signup again with same email
4. Contact support

### Issue: Campaigns Not Loading
**Solutions:**
1. Click "Reload" button to retry
2. Check your internet connection
3. Refresh the page
4. Make sure you're connected to Meta account

### Issue: Remove Campaign Not Working
**Solutions:**
1. Make sure you confirmed the removal
2. Refresh the page to see updated list
3. Check your permissions
4. Contact support if issue persists

---

## Quick Tips

1. Always verify your email after signup
2. Use strong passwords
3. Remember to click confirmation in dialogs
4. Use Reload button if data seems outdated
5. Check Settings for customization options
6. Toggle theme for comfortable viewing
7. Connect Meta account for full functionality

---

## Support

If you encounter any issues:
1. Check this guide first
2. Look at error messages carefully
3. Try the suggested solutions
4. Contact support with:
   - Your email
   - What you were trying to do
   - Error message you saw
   - Screenshots (if possible)

---

## Next Steps After Setup

1. Verify your email
2. Sign in to Dashboard
3. Connect your Meta account
4. Upload your assets
5. Create your first campaign
6. Monitor performance in Insights

Welcome to Adstartup!
