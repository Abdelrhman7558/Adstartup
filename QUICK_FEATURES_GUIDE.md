# Quick Features Guide

## Trial 14-Days Free (4-Day Trial)

### How to Start Trial:
1. Go to Homepage
2. Scroll to Pricing section
3. Click "Trial 14-days Free" button (green button in SOLO plan)
4. You'll be redirected to Signup page
5. Fill in signup form
6. Check email for verification link
7. Click verification link
8. Sign in
9. Complete Brief
10. Access Dashboard

### Trial Features:
- **Duration:** 4 days
- **Countdown:** Displayed in Dashboard header next to username
- **Format:** Orange badge showing "Trial: X days left"
- **On Expiry:**
  - Email notification sent automatically
  - Dashboard locks
  - Redirected to Plans page
  - Trial button becomes disabled
- **Cannot Restart:** Trial is one-time only per user

---

## New Campaign Creation

### How to Create Campaign:
1. Sign in to Dashboard
2. Click "New Campaign" button (top-right)
3. Follow 5-step process:

#### Step 1: Campaign Basics
- Campaign Name
- Objective (select from dropdown)
- Goal (select from dropdown)

#### Step 2: Budget & Details
- **Daily Budget:** Fixed at 500 EGP (cannot change)
- Description (required)
- Start Time (required)
- End Time (optional)
- **Offer** (optional) - NEW!

#### Step 3: Assets
**Choice 1: Catalog**
- Select Meta Catalog from dropdown

**Choice 2: Upload Assets**
- Select Existing: Choose from previously uploaded files
- Upload New:
  - Click to upload files
  - **Minimum 3 files required**
  - **Maximum 10 files allowed**
  - Error shown if out of range
  - Accepts images and videos

#### Step 4: Page Selection
- Select Meta Page from dropdown
- This page will be used for the campaign

#### Step 5: Review
- Review all campaign details
- Shows: Name, Objective, Goal, Budget, Description, Offer (if provided), Times, Asset Type, Selected Page
- Click "Create Campaign" to submit

### Important Notes:
- Daily Budget is fixed at 500 EGP for all campaigns
- Upload Assets requires 3-10 files (validation enforced)
- Offer field is optional
- Selected Page shown in final review

---

## Homepage "See How It Works" Button

### How to Use:
1. Go to Homepage
2. In Hero section (top of page), you'll see two buttons:
   - "Start Free" (red button)
   - **"See How It Works"** (white button with Play icon)
3. Click "See How It Works"
4. Page smoothly scrolls to "From Brief to Live Campaigns in Minutes" section
5. Read through the 6-step workflow

### What It Shows:
The "How It Works" section explains:
1. Connect Meta Business Manager
2. Select Ad Account, Pixel & Catalog
3. Fill Campaign Brief
4. AI Generates & Deploys
5. Continuous Optimization
6. Complete transparency with your Meta Business Manager

---

## Common Questions

### Q: Can I change the Daily Budget?
**A:** No, the Daily Budget is fixed at 500 EGP for all campaigns and cannot be modified.

### Q: What if I upload less than 3 files?
**A:** You'll see an error: "Please upload at least 3 files" and cannot proceed to the next step.

### Q: What if I upload more than 10 files?
**A:** You'll see an error: "Maximum 10 files allowed" and cannot proceed to the next step.

### Q: Is the Offer field required?
**A:** No, the Offer field is optional. You can leave it blank if you don't have an offer.

### Q: Can I restart my trial?
**A:** No, the trial is one-time only per user and cannot be restarted.

### Q: What happens when my trial expires?
**A:** You'll receive an email notification, the Dashboard will lock, and you'll be redirected to the Plans page to choose a subscription.

### Q: How do I know how many trial days I have left?
**A:** Look at the Dashboard header next to your username. You'll see an orange badge showing "Trial: X days left".

### Q: Where is the selected Page displayed?
**A:** The selected Page is shown in Step 5 (Review) before you create the campaign.

---

## Quick Start Workflows

### Start Trial:
Homepage → Pricing → "Trial 14-days Free" → Signup → Verify Email → Sign In → Brief → Dashboard

### Create Campaign:
Dashboard → "New Campaign" → Name/Objective/Goal → Budget/Description/Times/Offer → Assets (Catalog or Upload 3-10 files) → Select Page → Review → Create

### See How Platform Works:
Homepage → "See How It Works" button → Smooth scroll to explanation section

---

## File Uploads Reference

### Accepted File Types:
- Images: PNG, JPG, JPEG, GIF, WebP
- Videos: MP4, MOV, AVI, etc.

### Requirements:
- Minimum: 3 files
- Maximum: 10 files
- Each file is saved with its file_type (e.g., "image/png", "video/mp4")

### Where Files Are Stored:
- Campaign assets saved in `campaign_assets` table
- Linked to specific campaign_id
- Includes campaign_name and file_type

---

## Troubleshooting

### Issue: Can't proceed in New Campaign Step 3
**Solution:** Make sure you've uploaded between 3-10 files (not less, not more).

### Issue: Trial countdown not showing
**Solution:** Make sure you signed up using the "Trial 14-days Free" button from the Pricing page.

### Issue: "See How It Works" button doesn't work
**Solution:** Make sure you're on the Homepage (Landing page), not Dashboard or other pages.

### Issue: Dashboard locked after trial expires
**Solution:** This is expected behavior. Go to Plans page and select a subscription to continue using the platform.

---

## Support

For additional help or questions, contact support with:
- Your email
- What you were trying to do
- Error message (if any)
- Screenshots (helpful but optional)

All features are production-ready and fully functional!
