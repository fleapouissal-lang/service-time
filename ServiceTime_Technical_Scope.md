# Service Time — Technical Scope (MVP)

> Internal dev handoff. Derived from the signed contract (Pixel × Service Time, 25/04/2026).
> Scope is **fixed** — anything not listed here is out of scope. See section 9.

---

## 1. Project summary

| | |
|---|---|
| **Product** | Car maintenance & spare-parts services platform |
| **Client** | Service Time (Riyadh, KSA) |
| **Type** | MVP, **PWA** (installable, responsive: mobile / tablet / desktop) |
| **Market** | Saudi Arabia — Arabic-first UI (RTL) |


### Stack (our standard)
- **Frontend:** Next.js (App Router) + TypeScript + Tailwind + shadcn/ui, RTL
- **PWA:** manifest + service worker (installable, offline app shell)
- **Backend / DB:** Supabase — Postgres + RLS + Auth + Storage + Realtime
- **Maps:** Google Maps JS API (service locations + live technician location)
- **Notifications:** external provider for WhatsApp / SMS (KSA) — triggered on order events
- **Hosting:** **client-owned domain + hosting** per contract. Build must be portable (Vercel or VPS). Confirm target before deploy.

---

## 2. Roles

| Role | Access |
|---|---|
| **Customer** | Public site, submits a request, tracks it via a tracking link / page (no full account needed for MVP — identify by phone + request ID) |
| **Technician** | Lightweight authenticated view: see assigned orders, update status, share live location |
| **Admin** | Full dashboard (orders, services, parts, technicians, content, reports) |

---

## 3. Data model (Supabase / Postgres)

Sketch — refine column types as needed. All tables protected by **RLS**.

**`profiles`** — admins & technicians
- `id` (uuid, FK auth.users), `full_name`, `phone`, `role` (`admin` | `technician`), `technician_type` (`workshop` | `mobile` | null), `is_active`

**`services`** — service catalog (CMS-managed)
- `id`, `name_ar`, `description_ar`, `category`, `service_type` (`periodic_maintenance` | `emergency` | `spare_parts`), `image_url`, `is_active`, `sort_order`

**`spare_parts`** — parts catalog (CMS-managed)
- `id`, `name_ar`, `description_ar`, `category`, `details`, `image_url`, `is_active`
- ⚠️ Catalog only for MVP — see open question Q1 (no checkout/payment specced)

**`service_requests`** — core table
- `id`, `customer_name`, `customer_phone`, `car_type`, `location_text`, `location_lat`, `location_lng`, `description`, `service_type`, `execution_method` (`workshop_visit` | `mobile_workshop`), `status` (see enum below), `priority` (`low`/`normal`/`high`), `assigned_technician_id` (FK profiles), `created_at`, `tracking_token` (unique, for the public tracking link)

**`request_photos`**
- `id`, `request_id` (FK), `storage_path` → Supabase Storage bucket

**`request_status_history`** — audit trail + drives the tracking timeline
- `id`, `request_id` (FK), `status`, `changed_by`, `created_at`

**`technician_locations`** — for live tracking (or use Realtime broadcast, see §6)
- `technician_id`, `lat`, `lng`, `updated_at`

**`site_content`** — CMS (text / images / contact info)
- `key`, `value` (jsonb), `updated_at`

**`notifications_log`**
- `id`, `request_id`, `channel` (`whatsapp` | `sms`), `event`, `status`, `payload`, `created_at`

### Status enum (single source of truth)
`received` → `in_progress` → `on_the_way` → `arrived` → `completed`
(+ `cancelled`)

> Note: the contract describes a shorter status set for the request form (new/in progress/completed) and a longer one for tracking. Use the **longer/granular** one above everywhere; map "new" = `received`.

---

## 4. Public pages

1. **Home** — hero, services overview, CTA to request service
2. **Services** — list from `services` table
3. **Service Request** — the main form + flow (see §5)
4. **Spare Parts** — catalog from `spare_parts`
5. **Service Locations (Maps)** — branches / workshops on a map
6. **About**
7. **Contact**
8. **Order Tracking** — public page reachable via `tracking_token`, shows live status timeline + live technician location

All public text/images editable from the dashboard CMS.

---

## 5. Service request flow

Form fields: customer name, phone, car type, location, description, optional photo upload.
Customer selects:
- **Service type:** periodic maintenance / emergency / spare-parts request
- **Execution method:** workshop visit / mobile workshop

Logic:
1. Client-side + server-side validation
2. **Dedup check** — block duplicate/spam submissions (same phone + same request within short window)
3. Insert into `service_requests` (status = `received`) + upload photos to Storage
4. Auto-appear in admin dashboard
5. **Notify technical team** (dashboard + WhatsApp/SMS)
6. **Notify customer** with tracking link
7. Admin sets **priority** + can sort/filter by priority and geographic location

---

## 6. Tracking system (live)

Customer tracking page shows the status timeline (`received → in_progress → on_the_way → arrived → completed`) updating in real time, plus the technician's location on the map while en route.

Implementation:
- **Status updates:** Supabase Realtime subscription on `service_requests` / `request_status_history`
- **Live location:** technician's view captures browser geolocation and pushes to a **Supabase Realtime broadcast channel** per request; customer page subscribes and renders the marker on Google Maps.

**Contractual caveats — bake these into the UX (disclaimer on the map):**
- Location depends on the technician's internet connection
- It is **approximate** — not a commitment to exact arrival time or 100% accurate real-time tracking

---

## 7. Admin dashboard

- Orders list + status management
- Assign orders to technicians + track execution
- Services CRUD (add / edit / delete)
- Spare parts CRUD
- Technicians & mobile-workshops management
- Site content CMS (text, images, contact info)
- **Simple reports** on orders & performance (counts, status breakdown, basic time metrics — keep it light)

---

## 8. Non-functional requirements

**Notifications / integrations**
- WhatsApp + SMS via external provider, on: (a) order created, (b) status updated. Provider linked technically; we don't own deliverability.

**SEO (basic only — no ranking guarantees)**
- Loading-speed optimization, image/file compression, **lazy loading**, meta tags / titles / descriptions, sitemap, clean URL structure.

**Security**
- SSL, Supabase **RLS** with scoped permissions, secure auth, form protection (rate limiting / captcha), periodic backups, in-system operation logging (audit).

**Visual identity (basic, in-platform only)**
- Logo, primary color palette, basic visual elements (icons / backgrounds / patterns), applied to the UI.
- ❌ NOT a full Brand Book, NOT print/marketing assets.

---

## 9. OUT OF SCOPE (do not build)

Protect against scope creep — these require a separate quote:
- Native Android / iOS apps
- Any integration/system not named in this doc
- Marketing campaigns, paid ads, social media management, marketing content
- **Full data entry** of services/parts content (client provides content)
- Marketing materials (profiles, brochures, social), Brand Book
- New features/developments after delivery
- Changes beyond agreed scope or after final design sign-off
- Technical support after the free 30-day period

---

## 10. Deliverables (handed over only after full payment)

- Working PWA (deployed to client hosting)
- Admin dashboard
- Configured database + hosting environment
- Access credentials (platform + dashboard)

---

## 11. Revisions

- **2 revision rounds** on the initial version, within scope.
- Revisions = tweaks within the agreed scope — NOT redesigns or new functionality.

---

## 12. Open questions — clarify before/early in dev

**Q1 — Payment gateway?** The scope-of-work section specs **no checkout/payment flow** (spare parts = request, not purchase). But two boilerplate clauses mention "technical linking of payment gateway." This is contradictory. **Confirm with client:** if real payment/checkout is expected, it's additional scope and needs a separate price. Default assumption for now: **no payment, request-based only.**

**Q2 — Spare parts:** catalog + request only (no cart/pricing/checkout)? Assuming yes per Q1.

**Q3 — Technician location capture:** confirmed approach = technician opens an authenticated web view that requests geolocation permission and broadcasts while "on the way." OK to require the technician to keep the page open?

**Q5 — Notification provider:** which WhatsApp/SMS provider does the client have/want in KSA? (affects setup + templates, esp. WhatsApp template approval lead time).

**Q6 — Auth for customers:** confirmed = no customer accounts for MVP, identify by phone + tracking token. OK?
