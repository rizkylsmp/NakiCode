# Naki Code Gap Analysis

**Tanggal analisis:** 15 Juni 2026  
**Status:** Pre-launch preparation (2 bulan ke soft launch)  
**Sumber:** Comprehensive codebase exploration

---

## Executive Summary

Aplikasi Naki Code sudah memiliki foundation solid dengan fitur core lengkap (katalog, auth, payment, admin panel). Namun ditemukan beberapa gap yang perlu diperbaiki sebelum production launch, terutama:

1. **Performance bottleneck:** Image storage di MySQL sebagai base64 (bloat database & API response)
2. **Payment reliability:** Belum ada webhook auto-confirmation dari Midtrans
3. **Observability gap:** Tidak ada error monitoring atau structured logging
4. **SEO readiness:** Meta tags minimal, tidak ada structured data detail
5. **Testing coverage:** Hampir tidak ada automated tests

---

## Critical Findings (Production Blockers)

### 1. Image Storage Architecture Issue

**Problem:**
- Template preview images disimpan sebagai base64 string di MySQL column `preview` (JSON type)
- Setiap API call `/api/templates` mengirim **semua images** dalam response
- Typical image 100KB-2MB → base64 encoding +33% size → database bloat

**Impact:**
- API response size sangat besar (bisa 5-10MB untuk 20 templates)
- Database size membengkak (1GB+ untuk 100 templates dengan 5 preview each)
- Tidak bisa di-cache oleh CDN
- Slow loading time untuk katalog

**Solution:** Migrate ke Cloudinary (free tier: 25 credits/month) atau S3, simpan hanya URL di database.

---

### 2. Payment Webhook Missing

**File:** `backend/src/routes/orders.ts`, `docs/SECURITY_CHECKLIST.md:20`

**Problem:**
- Konfirmasi pembayaran bergantung pada tombol manual user
- Midtrans webhook endpoint ada tapi belum fully tested
- Jika user bayar tapi tidak klik tombol, order stuck di `waiting_payment`

**Impact:** User experience buruk, revenue loss risk, support overhead tinggi.

**Solution:** Test & activate Midtrans webhook di dashboard Midtrans, add webhook logging.

---

### 3. Error Monitoring & Logging

**Problem:**
- Hanya `console.log` dan `console.error`
- Tidak ada error tracking service
- Production errors tidak tercatat & tidak ter-alert

**Impact:** Impossible to debug production issues, no visibility into error rates.

**Solution:** Add Sentry free tier (5k errors/month) atau LogSnag, add structured logging (pino).

---

### 4. Environment Validation Missing

**File:** `backend/src/config.ts`

**Problem:**
- Semua env vars punya fallback defaults
- Server bisa start dengan empty `ADMIN_TOKEN_SECRET` atau `MYSQL_PASSWORD`
- Tidak ada validation bahwa critical vars set di production

**Solution:** Add Zod schema validation, server harus fail to start jika critical vars missing/invalid.

---

### 5. Testing Infrastructure

**Problem:**
- Frontend: 0 test files
- Backend: 1 integration test file only
- E2E: None

**Solution:** Setup Vitest + Testing Library, write 2-3 critical path tests (auth flow, order creation).

---

## High Priority

### 6. SEO Optimization

**Missing:**
- Dynamic meta tags per page (hanya static title)
- Structured data (JSON-LD) untuk template detail
- robots.txt di root
- Sitemap verification

**Impact:** Poor discoverability di Google, no rich snippets.

---

### 7. Performance Issues

**Missing:**
- HTTP cache headers di API responses
- React Query atau SWR untuk client-side caching
- Image lazy loading dengan blur placeholder
- Code splitting optimization (HomePage & TemplateDetailPage belum lazy)

**Impact:** Slow perceived performance, high bandwidth usage.

---

### 8. Accessibility Issues

**Problem:**
- Color contrast `text-naki-smoke` (#808388) on `bg-naki-frost` (#f0f4f5) = ~3.5:1 (fails WCAG AA, needs 4.5:1)
- Form errors tidak di-announce ke screen reader (missing `aria-live` regions)

**Solution:** Fix color contrast, add proper ARIA attributes.

---

### 9. Developer Experience

**Missing:**
- ESLint + Prettier configuration
- Pre-commit hooks (Husky + lint-staged)
- API documentation (Swagger/OpenAPI)
- Database migration system (hanya ad-hoc `ensureColumn`)

---

## Medium Priority

### 10. UX Enhancements

**Missing features:**
- Loading skeletons untuk katalog (hanya "Memuat halaman...")
- Related templates section di detail page
- Search history & recently viewed
- Template comparison feature
- Social sharing buttons
- Breadcrumb navigation enhancement

---

### 11. Admin Features

**Missing:**
- Dashboard analytics (order count, revenue chart)
- Bulk operations (bulk delete, bulk status update)
- Template duplicate/clone feature
- Order export (CSV/Excel)
- Invoice PDF generation

---

### 12. Email & Notifications

**Issues:**
- Email sent synchronously di request handlers (blocks response jika SMTP lambat)
- Email templates hardcoded, tidak ada customization

**Solution:** Add email queue (BullMQ), create proper email template system.

---

## Low Priority (Post-Launch)

- 2FA/MFA
- Multi-currency support
- Subscription model
- Advanced PWA (offline mode, background sync)
- In-app chat/support
- Push notifications
- Template version history
- Dark mode support

---

## Cost-Benefit Matrix

| Item | Effort | Impact | Priority |
|------|--------|--------|----------|
| Image migration to Cloudinary | 8h | Very High | P0 |
| Payment webhook activation | 3h | High | P0 |
| Error monitoring (Sentry) | 4h | High | P0 |
| Environment validation (Zod) | 2h | High | P0 |
| React Query caching | 5h | High | P1 |
| SEO meta tags + structured data | 6h | High | P1 |
| Loading skeletons | 4h | Medium | P1 |
| Related templates section | 6h | Medium | P1 |
| ESLint + Prettier setup | 5h | Medium | P1 |
| CI/CD pipeline (GitHub Actions) | 5h | High | P1 |

---

## Free Tools Stack (Bootstrap Budget)

| Service | Tool | Free Tier Limit | Usage |
|---------|------|----------------|--------|
| Error Monitoring | Sentry | 5k errors/month | Frontend + backend errors |
| Analytics | Umami Cloud | Unlimited | Page views, events |
| Logging | Better Stack | 1GB/month | Structured logs |
| CI/CD | GitHub Actions | 2000 min/month | Build, test, deploy |
| Image Storage | Cloudinary | 25 credits/month | ~500-1000 images |
| Uptime Monitor | UptimeRobot | 50 monitors | Health check every 5 min |
| Email | Brevo/SendGrid | 300 emails/day | OTP, notifications |

---

## Success Criteria

**Pre-Launch (Week 8):**
- ✅ Zero critical security issues
- ✅ Error monitoring active
- ✅ Payment webhook tested & working
- ✅ Core user flows tested (auth, order, payment)
- ✅ Lighthouse score >80 for all pages
- ✅ Meta tags & structured data on all public pages

**Post-Launch (Month 1):**
- 100+ organic sessions/week
- <1% error rate
- >90% payment success rate
- >5% browse → order conversion

---

## Constraints & Risk Mitigation

**Budget:** Bootstrap mode (free tier only)
- **Risk:** Cloudinary free tier habis
- **Mitigation:** Monitor usage, optimize image sizes, ready untuk upgrade $18/mo

**Timeline:** 8 weeks to soft launch, solo developer
- **Risk:** Deadline slip
- **Mitigation:** Cut scope (defer low priority), focus P0/P1 only

**Payment:**
- **Risk:** Webhook gagal di production
- **Mitigation:** Keep manual confirm as fallback, extensive testing di sandbox

---

Untuk roadmap detail 8-minggu, lihat `docs/ROADMAP.md`.
