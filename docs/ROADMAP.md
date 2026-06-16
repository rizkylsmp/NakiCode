# Naki Code Pre-Launch Roadmap

**Timeline:** 8 minggu (15 Juni - 15 Agustus 2026)  
**Target:** Soft launch ready  
**Resources:** Solo developer (~20-25h/week)  
**Budget:** Bootstrap (free tier services only)

---

## Overview

Roadmap ini memprioritaskan **production readiness** dengan fokus:
1. Stabilitas & monitoring (error tracking, logging)
2. Core UX improvements (loading states, caching)
3. SEO foundation (meta tags, structured data)
4. Testing minimal untuk critical paths

**Total estimated effort:** ~85 hours untuk tasks prioritas tinggi

---

## Week 1-2: Production Blockers ⚠️

**Goal:** App aman dan observable untuk launch

### Task 1: Error Monitoring Setup
- **Effort:** 4h | **Priority:** P0
- **Files:** `backend/src/server.ts`, `frontend/src/main.tsx`, `frontend/src/ErrorBoundary.tsx`

**Implementation:**
```bash
# Backend
npm install @sentry/node --workspace backend
# Frontend  
npm install @sentry/react --workspace frontend
```

**Acceptance criteria:**
- [ ] Errors logged ke Sentry dashboard
- [ ] Frontend errors captured dengan component stack trace
- [ ] Backend errors captured dengan request context
- [ ] Test error terpantau

**Tool:** Sentry free tier (5k errors/month) - https://sentry.io

---

### Task 2: Environment Validation
- **Effort:** 2h | **Priority:** P0
- **Files:** `backend/src/config.ts`

**Implementation:**
```typescript
import { z } from 'zod';

const configSchema = z.object({
  MYSQL_PASSWORD: z.string().min(1),
  ADMIN_TOKEN_SECRET: z.string().min(32),
  SMTP_PASSWORD: z.string().min(1),
  // ... all critical vars
});

export const config = configSchema.parse(process.env);
```

**Acceptance criteria:**
- [ ] Server fails to start jika critical env vars missing
- [ ] Clear error message untuk invalid vars
- [ ] `ADMIN_TOKEN_SECRET` wajib minimal 32 characters

---

### Task 3: robots.txt + Sitemap
- **Effort:** 1h | **Priority:** P0
- **Files:** `frontend/public/robots.txt` (create), `frontend/public/sitemap.xml` (verify)

**Content:**
```
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /checkout/

Sitemap: https://nakicode.com/sitemap.xml
```

**Acceptance criteria:**
- [ ] robots.txt tersedia di root
- [ ] sitemap.xml include semua public pages
- [ ] sitemap exclude admin routes

---

### Task 4: Password Strength Validation
- **Effort:** 2h | **Priority:** P0
- **Files:** `frontend/src/pages/UserLoginPage.tsx`, `backend/src/routes/auth.ts`

**Acceptance criteria:**
- [ ] Visual password strength indicator (weak/medium/strong)
- [ ] Backend reject passwords score <2
- [ ] Clear feedback: "Password terlalu lemah, tambahkan angka/simbol"

---

### Task 5: Frontend Test Setup
- **Effort:** 4h | **Priority:** P0
- **Files:** `frontend/vitest.config.ts`, `frontend/src/components/__tests__/`, `frontend/package.json`

**Acceptance criteria:**
- [ ] Vitest + Testing Library installed
- [ ] `npm test --workspace frontend` runs successfully
- [ ] Minimal 2 test files, 5+ passing tests
- [ ] CI-ready

---

### Task 6: Health Check Enhancement
- **Effort:** 2h | **Priority:** Medium
- **Files:** `backend/src/routes/health.ts`

**Enhanced response:**
```json
{
  "status": "healthy",
  "services": {
    "database": { "status": "up", "latency": 15 },
    "redis": { "status": "up" },
    "smtp": { "status": "up" }
  }
}
```

**Acceptance criteria:**
- [ ] Check MySQL, Redis, SMTP status
- [ ] Return HTTP 503 jika critical service down
- [ ] Use untuk UptimeRobot monitoring

---

### Task 7: Email Template Structure
- **Effort:** 3h | **Priority:** Medium
- **Files:** `backend/src/email/templates/` (create directory)

**Acceptance criteria:**
- [ ] Template branded (logo, warna Naki Code)
- [ ] Responsive layout (mobile-friendly)
- [ ] Plain text fallback

---

**Week 1-2 Total:** ~18h

---

## Week 3-4: Core User Experience 🎨

**Goal:** User bisa browse → buy dengan smooth

### Task 8: Loading Skeletons
- **Effort:** 4h | **Priority:** High
- **Files:** `frontend/src/components/SkeletonCard.tsx`, `frontend/src/components/TemplateCatalog.tsx`

**Acceptance criteria:**
- [ ] Skeleton untuk template cards saat loading
- [ ] Skeleton untuk template detail page
- [ ] Smooth transition dari skeleton ke content

---

### Task 9: Image Optimization
- **Effort:** 5h | **Priority:** High
- **Files:** Backend image upload routes, database migration

**Implementation:**
- Migrate preview images dari base64 MySQL ke Cloudinary
- Update API untuk serve image URLs, bukan base64
- Add blur placeholder untuk lazy loading

**Acceptance criteria:**
- [ ] Images di Cloudinary, bukan MySQL
- [ ] API response size <500KB untuk 20 templates
- [ ] Blur placeholder saat loading images

---

### Task 10: Dynamic Meta Tags
- **Effort:** 3h | **Priority:** High
- **Files:** Template detail pages, blog pages

**Acceptance criteria:**
- [ ] Each page punya unique title & description
- [ ] Open Graph tags untuk social sharing
- [ ] Twitter Card meta tags

---

### Task 11: Search History + Recently Viewed
- **Effort:** 4h | **Priority:** Medium
- **Files:** `frontend/src/utils/searchHistory.ts`, HomePage

**Implementation:** localStorage-based, no DB changes needed

**Acceptance criteria:**
- [ ] Search history max 10 items
- [ ] Recently viewed max 5 templates
- [ ] Clear history button

---

### Task 12: Social Sharing Buttons
- **Effort:** 2h | **Priority:** Medium
- **Files:** Template detail page

**Acceptance criteria:**
- [ ] Share ke WhatsApp
- [ ] Share ke Twitter/X
- [ ] Copy link button
- [ ] Web Share API support

---

### Task 13: Empty State Improvements
- **Effort:** 2h | **Priority:** Low
- **Files:** Search results, wishlist, orders pages

**Acceptance criteria:**
- [ ] Visual empty state dengan icon
- [ ] Helpful message & CTA

---

**Week 3-4 Total:** ~20h

---

## Week 5-6: SEO & Discovery 🔍

**Goal:** Dapat traffic organik dari Google

### Task 14: Structured Data (JSON-LD)
- **Effort:** 4h | **Priority:** High
- **Files:** Template detail pages

**Implementation:**
```javascript
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Template Portfolio Modern",
  "offers": {
    "@type": "Offer",
    "price": "150000",
    "priceCurrency": "IDR"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "12"
  }
}
```

**Acceptance criteria:**
- [ ] Product schema di template detail
- [ ] Breadcrumb schema
- [ ] Rating schema jika ada reviews

---

### Task 15: Template Detail SEO
- **Effort:** 3h | **Priority:** High

**Acceptance criteria:**
- [ ] Title format: "{Template Name} - Naki Code"
- [ ] Description dengan keywords relevan
- [ ] H1, H2 hierarchy proper

---

### Task 16: Blog SEO Optimization
- **Effort:** 2h | **Priority:** Medium

**Acceptance criteria:**
- [ ] Blog articles punya meta tags
- [ ] Article schema (JSON-LD)
- [ ] Internal linking strategy

---

### Task 17: Analytics Setup
- **Effort:** 2h | **Priority:** Medium
- **Tool:** Umami self-hosted atau Plausible free tier

**Acceptance criteria:**
- [ ] Page view tracking
- [ ] Event tracking (order created, template viewed)
- [ ] No cookies, GDPR-friendly

---

### Task 18: Service Worker Enhancement
- **Effort:** 4h | **Priority:** Medium
- **Files:** `frontend/public/sw.js`

**Acceptance criteria:**
- [ ] Cache API responses (templates, categories)
- [ ] Cache images dengan stale-while-revalidate
- [ ] Offline fallback page

---

### Task 19: Compare Template (Basic)
- **Effort:** 6h | **Priority:** Low

**Acceptance criteria:**
- [ ] Select 2-3 templates untuk compare
- [ ] Side-by-side comparison table
- [ ] Compare price, stack, features

---

**Week 5-6 Total:** ~21h

---

## Week 7-8: Polish & Monitoring 🚀

**Goal:** Launch dengan confidence

### Task 20: CI/CD Pipeline
- **Effort:** 5h | **Priority:** High
- **Files:** `.github/workflows/ci.yml`

**Implementation:**
```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npm run build
```

**Acceptance criteria:**
- [ ] Auto run on push/PR
- [ ] Lint, type-check, test, build
- [ ] Fail PR jika ada errors

---

### Task 21: Error Boundary Fallback UI
- **Effort:** 2h | **Priority:** Medium
- **Files:** `frontend/src/ErrorBoundary.tsx`

**Acceptance criteria:**
- [ ] Branded error page (tidak blank screen)
- [ ] "Refresh page" button
- [ ] Error logged ke Sentry

---

### Task 22: Integration Tests
- **Effort:** 6h | **Priority:** Medium
- **Files:** `backend/src/__tests__/integration/`

**Test coverage:**
- [ ] Auth flow (register → verify email → login)
- [ ] Order flow (create order → payment → rating)
- [ ] Template CRUD

---

### Task 23: Admin Dashboard Analytics
- **Effort:** 5h | **Priority:** Medium
- **Files:** `frontend/src/pages/AdminDashboard.tsx`, `backend/src/routes/admin/stats.ts`

**Acceptance criteria:**
- [ ] Total orders count
- [ ] Revenue chart (weekly)
- [ ] Top templates (by orders)
- [ ] Order status breakdown

---

### Task 24: Invoice PDF Generation
- **Effort:** 4h | **Priority:** Medium
- **Files:** `backend/src/utils/generateInvoice.ts`

**Tool:** `pdfkit` atau `puppeteer`

**Acceptance criteria:**
- [ ] Generate PDF invoice untuk paid orders
- [ ] Include order details, payment info
- [ ] Download link di order detail

---

### Task 25: Performance Audit
- **Effort:** 4h | **Priority:** Medium

**Implementation:**
- Run Lighthouse CI
- Fix issues untuk score >80
- Optimize bundle size

**Acceptance criteria:**
- [ ] LCP <2.5s
- [ ] FID <100ms
- [ ] CLS <0.1
- [ ] Lighthouse score >80 all pages

---

**Week 7-8 Total:** ~26h

---

## Post-Launch Backlog (Week 9+)

Defer sampai setelah launch, iterate based on real user feedback:

### Features
- [ ] Template comparison advanced (side-by-side full detail)
- [ ] In-app chat/support (Crisp atau Tawk.to)
- [ ] Push notifications (Web Push API)
- [ ] Admin bulk operations
- [ ] Order export CSV
- [ ] Template duplicate/clone
- [ ] 2FA/MFA
- [ ] Multi-currency
- [ ] Subscription model

### Testing
- [ ] E2E test suite (Playwright)
- [ ] Component test coverage >50%
- [ ] Visual regression tests

### DevOps
- [ ] Docker setup
- [ ] Staging environment
- [ ] Database backup automation

---

## Free Tools Stack

| Service | Tool | Free Tier | Usage |
|---------|------|-----------|-------|
| Error Monitoring | Sentry | 5k errors/mo | Frontend + backend |
| Analytics | Umami Cloud | Unlimited | Page views, events |
| Logging | Better Stack | 1GB/mo | Structured logs |
| CI/CD | GitHub Actions | 2000 min/mo | Build, test, deploy |
| Images | Cloudinary | 25 credits/mo | ~500-1000 images |
| Uptime | UptimeRobot | 50 monitors | Health check 5min |
| Email | Brevo | 300/day | OTP, notifications |

---

## Progress Tracking

- [ ] **Week 1:** Task 1, 2, 3 completed
- [ ] **Week 2:** Task 4, 5, 6, 7 completed
- [ ] **Week 3:** Task 8, 9, 10 completed
- [ ] **Week 4:** Task 11, 12, 13 completed
- [ ] **Week 5:** Task 14, 15, 16 completed
- [ ] **Week 6:** Task 17, 18, 19 completed
- [ ] **Week 7:** Task 20, 21, 22 completed
- [ ] **Week 8:** Task 23, 24, 25 completed

---

## Success Metrics

Track post-launch untuk validate impact:

| Metric | Baseline | Target Month 1 | Tool |
|--------|----------|---------------|------|
| Organic traffic | 0 | 100 sessions/week | Umami |
| Bounce rate | TBD | <60% | Umami |
| Template → Order | TBD | >5% | Custom event |
| Error rate | TBD | <1% sessions | Sentry |
| Page load (LCP) | TBD | <2.5s | Lighthouse |
| Payment success | TBD | >90% | Database |

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Cloudinary free tier habis | High | Monitor usage, ready upgrade $18/mo |
| Sentry free tier habis | Medium | Filter noise, ready self-hosted |
| Deadline slip | High | Cut scope, focus P0/P1 only |
| Payment webhook gagal | Critical | Keep manual confirm fallback |

---

**Next Steps:** Mulai dari Week 1 Task 1 (Error Monitoring Setup)

Lihat gap analysis detail di `docs/GAP_ANALYSIS.md`.
