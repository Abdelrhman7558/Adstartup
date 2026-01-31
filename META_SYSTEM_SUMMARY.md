# Meta Account Selection System - Complete Reference

## 📚 Documentation Overview

This project includes 4 comprehensive documents for building a production-ready Meta integration system:

### 1. **META_SELECTION_SYSTEM.md** (Full Blueprint)
Complete architectural overview with:
- System flow diagrams
- Database schema
- Frontend component structure
- Backend n8n workflow details
- Data flow explanations
- Security implementation
- Testing checklist

**When to use:** Understanding the overall system architecture

---

### 2. **BOLT_PROMPT_META_SELECTION.md** (Detailed Implementation Guide)
Step-by-step implementation instructions with:
- Frontend page component requirements
- Backend endpoint specifications
- n8n workflow steps (4 detailed workflows)
- Security implementation details
- CORS configuration
- Rate limiting setup
- Complete code examples

**When to use:** During development to understand what needs to be built

---

### 3. **META_API_QUICK_REFERENCE.md** (Developer Quick Guide)
Fast lookup reference with:
- API endpoints quick list
- Frontend component template
- n8n setup quick steps
- Supabase query examples
- Common error messages
- Security checklist
- Testing commands

**When to use:** Quick lookup while coding

---

### 4. **META_IMPLEMENTATION_ROADMAP.md** (Step-by-Step Checklist)
Phase-by-phase implementation roadmap:
- Phase 1: Database setup (30 min)
- Phase 2: Frontend development (2-3 hours)
- Phase 3: Backend setup - n8n (1-2 hours)
- Phase 4: Integration (1 hour)
- Phase 5: Testing (1-2 hours)
- Phase 6: Deployment (30 min)

**When to use:** Managing project implementation and tracking progress

---

## 🎯 Quick Start Path

### For Developers
1. Read: **META_SELECTION_SYSTEM.md** (15 min) - Understand the architecture
2. Use: **META_API_QUICK_REFERENCE.md** - Keep open while coding
3. Follow: **META_IMPLEMENTATION_ROADMAP.md** - Track progress through phases

### For Architects
1. Read: **BOLT_PROMPT_META_SELECTION.md** - Full technical specification
2. Review: **META_SELECTION_SYSTEM.md** - Verify security and data flow
3. Plan: Use **META_IMPLEMENTATION_ROADMAP.md** - Timeline and resource planning

### For Project Managers
1. Review: **META_IMPLEMENTATION_ROADMAP.md** - Timeline and deliverables
2. Track: Use checklist to monitor progress
3. Reference: **META_SELECTION_SYSTEM.md** - For status meetings

---

## 🔑 Key System Concepts

### Three Main Components

#### 1. Frontend (`/meta/select`)
- Step 1: Select Ad Account
- Step 2: Select Pixel
- Step 3: Select Catalog (optional)
- Step 4: Confirmation & Save

#### 2. Backend (n8n Webhooks)
- `GET /meta/ad-accounts` - Fetch accounts for user
- `GET /meta/pixels` - Fetch pixels for account
- `GET /meta/catalogs` - Fetch catalogs for user
- `POST /meta/save-selections` - Save selections to database

#### 3. Database (Supabase)
- `meta_account_selections` table stores user selections
- RLS policies ensure data isolation
- Secure token storage (encrypted)

---

## 📊 Data Flow Summary

```
User OAuth
    ↓
Redirect to /meta/select
    ↓
Step 1: Call GET /meta/ad-accounts
    ↓
User Selects Account
    ↓
Step 2: Call GET /meta/pixels
    ↓
User Selects Pixel
    ↓
Step 3: Call GET /meta/catalogs
    ↓
User Optionally Selects Catalog
    ↓
Step 4: Review & Confirm
    ↓
Call POST /meta/save-selections
    ↓
Database Updated
    ↓
Redirect to Dashboard
    ↓
Dashboard Shows Connected Status
```

---

## 🔐 Security Overview

### Token Management
- ✅ Tokens stored encrypted in Supabase
- ✅ All Meta API calls server-side (n8n)
- ✅ Frontend never sees tokens
- ✅ No token logging

### User Verification
- ✅ Every endpoint validates user_id
- ✅ RLS policies enforce data isolation
- ✅ User can only access own data
- ✅ Unauthorized requests return 401

### Data Protection
- ✅ HTTPS enforced
- ✅ CORS properly configured
- ✅ Input validation on all requests
- ✅ SQL injection prevention
- ✅ XSS prevention

---

## 📝 Implementation Timeline

| Phase | Duration | Tasks |
|-------|----------|-------|
| 1: Database | 30 min | Create table, RLS policies |
| 2: Frontend | 2-3 hrs | Build component, state management |
| 3: Backend | 1-2 hrs | Create 4 n8n webhooks |
| 4: Integration | 1 hr | Connect everything, test |
| 5: Testing | 1-2 hrs | Comprehensive testing |
| 6: Deploy | 30 min | Build, deploy, verify |

**Total: 5-7 hours for complete implementation**

---

## 🚀 API Reference

### Endpoint: Get Ad Accounts
```
GET /api/meta/ad-accounts?user_id=UUID

Response:
{
  "success": true,
  "data": [
    {"id": "act_123", "name": "Account", "currency": "USD"}
  ],
  "error": null
}
```

### Endpoint: Get Pixels
```
GET /api/meta/pixels?user_id=UUID&ad_account_id=ACCOUNT_ID

Response:
{
  "success": true,
  "data": [
    {"id": "1234567890", "name": "Pixel"}
  ],
  "error": null
}
```

### Endpoint: Get Catalogs
```
GET /api/meta/catalogs?user_id=UUID

Response:
{
  "success": true,
  "data": [
    {"id": "123", "name": "Catalog", "shop_name": "Shop"}
  ],
  "error": null
}
```

### Endpoint: Save Selections
```
POST /api/meta/save-selections

Body:
{
  "user_id": "UUID",
  "ad_account_id": "act_123",
  "pixel_id": "1234567890",
  "catalog_id": "123" (optional)
}

Response:
{
  "success": true,
  "message": "Selections saved successfully"
}
```

---

## 🗂️ File Structure

```
Project Root/
├── Documentation/
│   ├── META_SELECTION_SYSTEM.md (Architecture)
│   ├── BOLT_PROMPT_META_SELECTION.md (Implementation)
│   ├── META_API_QUICK_REFERENCE.md (Quick guide)
│   ├── META_IMPLEMENTATION_ROADMAP.md (Checklist)
│   └── META_SYSTEM_SUMMARY.md (This file)
│
├── src/
│   ├── pages/
│   │   └── MetaSelect.tsx (Main component)
│   ├── lib/
│   │   └── metaSelectionApi.ts (API calls)
│   └── App.tsx (Add route: /meta/select)
│
├── Database/
│   └── Supabase/
│       └── meta_account_selections (Table)
│
└── Backend/
    └── n8n/
        ├── meta-ad-accounts (GET webhook)
        ├── meta-pixels (GET webhook)
        ├── meta-catalogs (GET webhook)
        └── meta-save-selections (POST webhook)
```

---

## ✅ Pre-Implementation Checklist

### Prerequisites
- [ ] Supabase project created
- [ ] Supabase database access configured
- [ ] n8n instance available
- [ ] Meta API app created with credentials
- [ ] Meta access token stored in database
- [ ] React project set up with routing

### Environment Setup
- [ ] `.env` file configured
- [ ] `VITE_API_BASE` set to n8n URL
- [ ] Supabase credentials configured
- [ ] Meta API credentials secured

### Tools Ready
- [ ] Text editor / IDE
- [ ] Terminal / CLI access
- [ ] Postman or curl for API testing
- [ ] Browser dev tools
- [ ] Git for version control

---

## 🧪 Testing Checklist

### Frontend Tests
- [ ] Component renders without errors
- [ ] All buttons functional
- [ ] Dropdowns populate correctly
- [ ] Can progress through all 4 steps
- [ ] Error banner displays
- [ ] Loading states show
- [ ] Redirect works on success
- [ ] Mobile responsive
- [ ] No console errors

### Backend Tests
- [ ] All 4 endpoints respond
- [ ] Correct response format
- [ ] Error handling works
- [ ] Database updates correctly
- [ ] User verification works
- [ ] No tokens exposed

### Integration Tests
- [ ] Full flow: Step 1 → Step 4
- [ ] Database has saved data
- [ ] Dashboard detects connection
- [ ] Can't access without authentication

### Security Tests
- [ ] No tokens in localStorage
- [ ] No tokens in console logs
- [ ] No tokens in API responses
- [ ] User verification enforced
- [ ] Unauthorized access blocked

---

## 🔧 Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| "No meta connection found" | User missing OAuth | User needs to complete OAuth first |
| "Failed to fetch ad accounts" | Invalid token | Check token storage and validity |
| Pixels not loading | Ad account ID wrong | Verify account ID in request |
| Save fails | RLS policy issue | Check Supabase RLS configuration |
| Tokens visible in console | Debugging logs | Remove all token logging |
| CORS error | CORS not configured | Add CORS headers to n8n responses |
| Page doesn't redirect | Navigation issue | Check React Router setup |

---

## 📞 Support Resources

### Meta API Documentation
- **Graph API**: https://developers.facebook.com/docs/graph-api
- **Ad Accounts**: https://developers.facebook.com/docs/marketing-api/reference/ad-account
- **Owned Pixels**: https://developers.facebook.com/docs/marketing-api/reference/owned-pixel
- **Product Catalogs**: https://developers.facebook.com/docs/marketing-api/reference/business-owned-product-catalog

### Framework Documentation
- **React**: https://react.dev
- **React Router**: https://reactrouter.com
- **Tailwind CSS**: https://tailwindcss.com

### Service Documentation
- **Supabase**: https://supabase.com/docs
- **n8n**: https://docs.n8n.io
- **Framer Motion**: https://www.framer.com/motion

---

## 🎓 Learning Path

### For Frontend Developers
1. Understand React hooks (useState, useEffect)
2. Learn async/await for API calls
3. Master conditional rendering
4. Practice state management
5. Build form handling
6. Implement error boundaries

### For Backend Developers
1. Understand REST API design
2. Learn Supabase queries
3. Master n8n workflows
4. Practice error handling
5. Implement validation
6. Learn OAuth patterns

### For DevOps/Infrastructure
1. Understand deployment pipelines
2. Configure environment variables
3. Set up monitoring
4. Plan scaling strategy
5. Implement backup strategy
6. Monitor API performance

---

## 📈 Performance Targets

- **Page Load**: < 2 seconds
- **Ad Accounts Fetch**: < 1 second
- **Pixels Fetch**: < 1 second
- **Save Operation**: < 2 seconds
- **Redirect**: < 1 second
- **API Response**: < 500ms

---

## 🔄 Future Enhancements

1. **Multi-Account Support**
   - Allow users to manage multiple ad accounts
   - Switch between accounts without re-login

2. **Token Refresh**
   - Automatic token refresh before expiry
   - Handle token expiration gracefully

3. **Advanced Filtering**
   - Filter by account status
   - Filter by currency
   - Search functionality

4. **Bulk Operations**
   - Update multiple accounts at once
   - Batch operations

5. **Analytics Integration**
   - Track conversion funnel
   - Monitor selection rates
   - Analyze user behavior

---

## 📋 Success Metrics

### User Experience
- ✅ 95% success rate for users completing flow
- ✅ < 5% error rate
- ✅ Average 2-3 minutes for completion
- ✅ Mobile completion rate > 80%

### System Performance
- ✅ 99.9% uptime
- ✅ < 500ms API response time
- ✅ < 100ms database queries
- ✅ < 2 second page load time

### Security
- ✅ 0 token leaks
- ✅ 0 unauthorized access attempts successful
- ✅ 100% data encrypted in transit
- ✅ 0 SQL injection vulnerabilities

---

## 🚀 Ready to Build!

You now have everything needed to implement a production-ready Meta account selection system. Follow these steps:

1. **Read** META_SELECTION_SYSTEM.md to understand the architecture
2. **Use** META_IMPLEMENTATION_ROADMAP.md to track progress
3. **Reference** META_API_QUICK_REFERENCE.md while coding
4. **Follow** BOLT_PROMPT_META_SELECTION.md for detailed instructions

**Estimated time to completion: 5-7 hours**

Good luck! 🎉

---

**Last Updated:** 2024-12-20
**Version:** 1.0
**Status:** Production-Ready
**Estimated Effort:** 5-7 hours
**Complexity:** Medium
**Team Size:** 1-2 developers
