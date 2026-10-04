# Nextora Mini POS — Netlify & Domain Setup Guide

Target Production Domain: `https://pos.nextoracreations.co.in`  
Corporate Website (unaffected): `https://nextoracreations.co.in`  
Repository: `https://github.com/Gorkesaikumar/nextora_creations`

---

## 1. Architecture Overview

The Nextora repository uses an **isolated subdirectory multi-site deployment** architecture:
- **Corporate Website (`https://nextoracreations.co.in`)**: Deployed from the repository root via `netlify.toml` with publish directory `dist` and Netlify Functions (`netlify/functions/internships.js`).
- **Nextora Mini POS Product Website (`https://pos.nextoracreations.co.in`)**: Deployed as an **independent Netlify site** connected to the same Git repository, with **Base directory** set to `pos` and publish directory set to `dist` (resolving to `pos/dist`).

This architecture guarantees that:
1. Zero changes or deployments to the POS website can disrupt the main corporate website or its serverless backend functions.
2. Build triggers, environment variables, headers, and SSL certificates are completely isolated.

---

## 2. Step-by-Step Netlify Site Creation

1. Log into your [Netlify Dashboard](https://app.netlify.com).
2. Click **Add new site** > **Import an existing project**.
3. Select **GitHub** and authorize access to `Gorkesaikumar/nextora_creations`.
4. In the **Site configuration** screen, configure the following:
   - **Site name**: `nextora-mini-pos` (or your preferred Netlify subdomain, e.g. `nextora-mini-pos.netlify.app`)
   - **Branch to deploy**: `main`
   - **Base directory**: `pos`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
5. Click **Deploy nextora-mini-pos**.

> **Alternative (Root Base Directory):**  
> If you choose not to set a Base directory in Netlify and leave it as repository root:
> - **Build command**: `npm --prefix pos run build`
> - **Publish directory**: `pos/dist`

---

## 3. Environment Variables Configuration

In the Netlify dashboard for the newly created POS site:
Go to **Site configuration** > **Environment variables** > **Add a variable**:

| Variable Name | Example / Recommended Value | Description |
|---|---|---|
| `NODE_VERSION` | `22` | Pins Node runtime for build |
| `VITE_SITE_URL` | `https://pos.nextoracreations.co.in` | Canonical site origin for SEO, sitemaps, and meta tags |
| `VITE_GOOGLE_PLAY_URL` | `""` (leave empty until live) | When set, Android CTA activates "Get it on Google Play" |
| `VITE_WINDOWS_DOWNLOAD_URL` | `""` (leave empty until live) | When set, activates direct installer download button |
| `VITE_SUPPORT_EMAIL` | `support@nextoracreations.co.in` | Official customer support email |
| `VITE_SUPPORT_PHONE` | `+91 76749 81970` | Official customer support phone number |
| `VITE_WHATSAPP_URL` | `https://wa.me/917674981970?...` | Direct WhatsApp customer support link |
| `VITE_GA_MEASUREMENT_ID` | `""` (leave empty by default) | Optional Google Analytics GA4 ID (no tracking by default) |

*(Note: `NEXT_PUBLIC_*` equivalents are also supported by `pos/vite.config.js` and `pos/scripts/build-meta.mjs`).*

---

## 4. Custom Domain Configuration in Netlify

1. In the POS site dashboard, navigate to **Site configuration** > **Domain management**.
2. Under **Custom domains**, click **Add a domain**.
3. Enter `pos.nextoracreations.co.in` and click **Verify**.
4. Confirm by clicking **Add domain**.

Netlify will assign a DNS target subdomain for this site, typically:  
`<your-pos-site-name>.netlify.app`

---

## 5. DNS Configuration (At Your DNS Provider)

Log into the DNS manager where `nextoracreations.co.in` is registered (e.g. Cloudflare, Hostinger, GoDaddy, Namecheap):

Create a new DNS record:

```text
Type:    CNAME
Host:    pos
Value:   <your-pos-site-name>.netlify.app
TTL:     Auto (or 300 seconds)
```

### If using Cloudflare:
- Set **Proxy status** to **DNS Only (Gray cloud)** during initial setup so Netlify can automatically provision the Let's Encrypt SSL certificate.
- Once verified, you may either keep DNS Only or enable Proxied mode with Cloudflare SSL mode set to **Full (Strict)**.

---

## 6. SSL / TLS Certificate Provisioning

1. In Netlify, go to **Site configuration** > **Domain management** > **HTTPS**.
2. Once the DNS CNAME record has propagated, click **Verify DNS configuration**.
3. Click **Provision certificate** to issue a free, auto-renewing Let's Encrypt SSL certificate.
4. Verify that **Force HTTPS** is active (enforced automatically in `pos/netlify.toml`).

---

## 7. Verification & Health Checks

Run these commands in PowerShell or Terminal to verify:

### 1. Verify DNS CNAME Resolution
```powershell
Resolve-DnsName -Name pos.nextoracreations.co.in -Type CNAME
```
*Expected result:* Points to `<your-pos-site-name>.netlify.app`.

### 2. Verify HTTPS & HTTP-to-HTTPS 301 Redirect
```powershell
curl.exe -I http://pos.nextoracreations.co.in
```
*Expected result:* `HTTP/1.1 301 Moved Permanently` -> `Location: https://pos.nextoracreations.co.in/`

### 3. Verify Clean URL Routing
```powershell
curl.exe -I https://pos.nextoracreations.co.in/privacy
```
*Expected result:* `HTTP/2 200 OK`, `content-type: text/html`.

### 4. Verify Security Headers
```powershell
curl.exe -I https://pos.nextoracreations.co.in
```
*Expected headers present:*
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Content-Security-Policy: default-src 'self' ...`

---

## 8. Google Play Console Configuration

For submitting the Nextora Mini POS Android app to Google Play Store:

1. **App Content > Privacy Policy**:
   - URL: `https://pos.nextoracreations.co.in/privacy`
   - *Requirement checked:* Publicly accessible, no login wall, no cookies required, `robots: index, follow`.
2. **Store Presence > Store Listing Contact Details**:
   - Website: `https://pos.nextoracreations.co.in`
   - Email: `support@nextoracreations.co.in`
   - Phone: `+91 76749 81970`
3. **App Content > Data Safety Form**:
   - Data stored locally on device: Customer names/phones in bills, item catalogs, offline transaction logs.
   - Data collected/transmitted to server: **None** (except device identifier during online annual license activation).
   - Data sharing: **No user data shared with third parties**.
