# LifeHelp — Community Emergency & Blood Donor Network

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-dc2626?style=for-the-badge&logo=github)](https://afsalcricket-a11y.github.io/Lifehelp-app-/)
[![Backend](https://img.shields.io/badge/Backend-Supabase-3ecf8e?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Security](https://img.shields.io/badge/Security-PostgreSQL%20RLS%20%26%20RPC-1e293b?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)

---

## 1. Overview & Live Demo Link

**Live Application:** [https://afsalcricket-a11y.github.io/Lifehelp-app-/](https://afsalcricket-a11y.github.io/Lifehelp-app-/)

**LifeHelp** is a responsive, mobile-first civic emergency and blood donation coordination platform built to connect patients, hospitals, and verified local blood donors in real time. During medical emergencies, searching through fragmented social media posts wastes critical minutes. LifeHelp centralizes urgent blood requests, location-aware donor discovery, and verified administrative moderation into a single streamlined web application.

### Core Capabilities
* **Home & Explore Feed:** Real-time directory of active blood requests and available donors, filterable by blood group (`A+`, `A-`, `B+`, `B-`, `O+`, `O-`, `AB+`, `AB-`), urgency level, and district/city.
* **Blood Donor Request Flow:** Guided request creation workflow capturing patient details, required blood group, units needed, hospital location, and emergency contact information, paired with donor registration and availability toggles.
* **Admin Dashboard:** Restricted moderation console allowing authorized administrators to verify donor profiles, audit urgent requests, flag duplicate/resolved cases, and manage platform safety.

---

## 2. Screenshots

> **Setup Note:** Place your captured desktop and mobile screenshots inside the `./screenshots/` directory using the filenames below.

### Desktop & Mobile Views

| Home / Explore Feed | Blood Donor Request Flow |
| :---: | :---: |
| ![Home and Explore](./screenshots/home-explore.png) | ![Blood Donor Request Flow](./screenshots/donor-request-flow.png) |
| *Live emergency feed with blood-group and location filters* | *Step-by-step urgent blood request and donor response flow* |

| Admin Dashboard | Mobile Responsive View |
| :---: | :---: |
| ![Admin Dashboard](./screenshots/admin-dashboard.png) | ![Mobile View](./screenshots/mobile-responsive.png) |
| *Role-gated moderation panel for verifying donors & requests* | *On-the-go emergency access optimized for mobile viewports* |

---

## 3. System Architecture & Security

LifeHelp uses a **serverless Jamstack architecture** hosted on GitHub Pages with **Supabase (PostgreSQL + Auth + PostgREST)** acting as the backend and security enforcement layer. Rather than trusting client-side UI routing for access control, all data permissions are enforced directly inside PostgreSQL.

```text
+-----------------------------------+        HTTPS / JWT         +--------------------------------------+
|     Frontend SPA (GitHub Pages)   | -------------------------> |         Supabase API Gateway         |
|  - Home / Explore Directory       |                            +--------------------------------------+
|  - Blood Request & Donor Flows    |                                               |
|  - Protected Admin Dashboard      |                                               v
+-----------------------------------+                            +--------------------------------------+
                                                                 |      PostgreSQL Security Layer       |
                                                                 |  - Row-Level Security (RLS) Policies |
                                                                 |  - Security-Definer RPC Functions    |
                                                                 |  - Database-Level is_admin() Checks  |
                                                                 +--------------------------------------+
```

### Database Schema (Supabase Tables)
* **`profiles`:** Stores authenticated user metadata, full name, phone number, city/district, blood group, `is_available` donor toggle, `last_donation_date`, and the protected `is_admin` boolean flag.
* **`blood_requests`:** Tracks emergency blood requirements including `requester_id`, `patient_name`, `blood_group`, `units_required`, `hospital_name`, `location`, `urgency_level`, `contact_phone`, and lifecycle `status` (`open`, `fulfilled`, `cancelled`).
* **`donor_responses` (or `request_pledges`):** Links volunteer donors to specific `blood_requests` with response timestamps and commitment status so requesters can track incoming help without exposing private donor records publicly.
* **`audit_logs`:** Records administrative approvals, request status overrides, and user moderation events for accountability.

### Row-Level Security (RLS) Policies
RLS is enabled across all public tables so direct API calls via the Supabase `anon` key cannot bypass business rules:
* **Public / Authenticated Read Scopes:** Active `blood_requests` (`status = 'open'`) and opted-in available donors (`is_available = true`) are readable for emergency discovery, while sensitive personal fields remain protected.
* **Owner-Scoped Mutations:** Users can `INSERT` new requests tied to their own `auth.uid()`, and can only `UPDATE` or `DELETE` their own profile or blood requests (`auth.uid() = user_id`).
* **Privilege Escalation Prevention:** Column-level restrictions and `WITH CHECK` policies prevent standard users from modifying their own `is_admin` or `is_verified` flags via direct `PATCH` requests.

### PostgreSQL RPC Functions
* **`is_admin()`:** A `SECURITY DEFINER` helper function that queries `public.profiles` for `auth.uid()` and returns a strict boolean (`true` only when `is_admin = true`), reused cleanly across RLS policies without recursive policy evaluation.
* **`admin_verify_donor(target_user_id uuid)` & `admin_resolve_request(request_id uuid, new_status text)`:** Encapsulated RPC endpoints that validate `is_admin()` at the top of the transaction, perform atomic status updates, and append an entry to `audit_logs` in a single round-trip.
* **`match_compatible_donors(req_blood_group text, req_city text)`:** Server-side lookup function applying blood-type compatibility rules (e.g., matching `O-` universal donors to critical requests) and filtering out donors in mandatory post-donation cooldown windows.

---

## 4. Key Engineering Challenges Solved

### 1. Preventing Unauthorized Admin Access via Database-Level `is_admin` Checks
* **Problem:** In Single Page Applications hosted on static platforms like GitHub Pages, hiding an `/admin` route in frontend JavaScript is purely cosmetic—any user inspecting the network bundle can discover API endpoints and attempt direct mutations against Supabase.
* **Solution:** Implemented defense-in-depth authorization anchored in PostgreSQL. Frontend route guards provide clean UX redirects, while every administrative `SELECT`, `UPDATE`, and `DELETE` policy—and every admin RPC function—enforces `public.is_admin()` against the authenticated `auth.uid()` JWT claim. Even if a malicious actor crafts raw REST or RPC calls outside the UI, PostgreSQL rejects unauthorized requests with `42501 (insufficient_privilege)`.

### 2. Accurate Blood-Type Compatibility & Cooldown Filtering
* **Problem:** Emergency requesters often search strictly for an exact blood group match, missing compatible donors (such as `O-` or `O+` donors for compatible recipients), or contacting donors who donated too recently to safely donate again.
* **Solution:** Built structured compatibility mapping and availability filtering so emergency searches surface medically compatible, currently eligible donors in the target locality first, reducing time-to-first-response during critical hours.

### 3. Frictionless Mobile-First UX Under High-Stress Conditions
* **Problem:** Users submitting or responding to blood emergencies are frequently on mobile devices with unstable connectivity and high cognitive stress.
* **Solution:** Designed high-contrast, touch-friendly forms with immediate blood-group chip selectors, one-tap phone/contact actions, and optimistic UI feedback so both requesters and donors can complete actions in seconds across desktop and mobile screens.
