# HARRY & CO JEANS — ENTERPRISE SECURITY ARCHITECTURE & ORIGIN IP MASKING

This document outlines the production security architecture, network segregation, origin IP masking mechanisms, Web Application Firewall (WAF) policies, and private database isolation for the **Harry & Co Jeans** luxury e-commerce platform.

---

## 1. High-Level Architecture Topology

```text
                           PUBLIC INTERNET
                                  │
                                  ▼
                   ┌──────────────────────────────┐
                   │    Customer / Client Tier    │
                   └──────────────┬───────────────┘
                                  │ HTTPS (Port 443)
                                  ▼
                   ┌──────────────────────────────┐
                   │      Azure Front Door        │
                   │      (Global Edge CDN)       │
                   └──────────────┬───────────────┘
                                  │
                                  ▼
                   ┌──────────────────────────────┐
                   │    Azure WAF Policy (L7)     │
                   │  • Microsoft DRS 2.1         │
                   │  • Bot Manager RuleSet 1.0   │
                   │  • Custom Rate Limiting      │
                   └──────────────┬───────────────┘
                                  │ Inject X-Azure-FDID & X-Origin-Verify
                                  ▼
                   ┌──────────────────────────────┐
                   │   NGINX / App Gateway        │
                   │      (Reverse Proxy)         │
                   │  • SSL Termination (TLS 1.3) │
                   │  • Rate Limiting Zones       │
                   │  • Header Sanitization       │
                   └──────────────┬───────────────┘
                                  │ Internal VNet Routing (Port 3000)
                                  ▼
                   ┌──────────────────────────────┐
                   │     Private Node.js API      │
                   │   (Express Atelier Server)   │
                   │  • Security Headers          │
                   │  • Origin Shield Validation  │
                   │  • In-App WAF Deep Inspector │
                   │  • Sensitive Rate Limiter    │
                   └──────────────┬───────────────┘
                                  │ Private Endpoint / Subnet (Port 5432)
                                  ▼
                   ┌──────────────────────────────┐
                   │   Azure Database for PG      │
                   │ (Private Endpoint Isolated)  │
                   │  • publicNetworkAccess: OFF  │
                   │  • TLS 1.2+ Enforced         │
                   │  • Least Privilege DB User   │
                   └──────────────────────────────┘
```

---

## 2. Origin Server Protection & IP Masking Strategy

### The Threat
If an attacker discovers the origin server's direct IP address (via DNS history, SSL certificate scanning, or port scanning), they might attempt to bypass the CDN, WAF, and rate limits by sending malicious requests directly to `http://<ORIGIN_IP>:3000`.

### Defense-in-Depth Mitigation
1. **Network-Level Access Restrictions**:
   - The App Service / Container host is locked to allow **only** the Azure Front Door backend service tag (`AzureFrontDoor.Backend`).
   - All other public internet traffic (`0.0.0.0/0`) is explicitly denied (`DenyAllDirectInternetTraffic`).
2. **Cryptographic Header Verification (`X-Azure-FDID`)**:
   - Every legitimate request through Front Door includes the tenant-unique `X-Azure-FDID` header.
   - The application middleware [`originShield.js`](../server/middleware/originShield.js) inspects this header. If absent or mismatching, it returns `403 Forbidden` (`DIRECT_ORIGIN_ACCESS_ATTEMPT`) and logs the offender to [`security_audit.log`](../server/data/security_audit.log).
3. **Header Sanitization**:
   - Response headers `Server` and `X-Powered-By` are purged to prevent stack fingerprinting.
   - Internal IP addresses and file paths are never exposed in error responses.

---

## 3. Web Application Firewall (WAF) Specification

### Layer 1: Edge WAF (Azure Front Door WAF)
- **Microsoft Default Rule Set 2.1**:
  - SQL Injection (SQLi) protection
  - Cross-Site Scripting (XSS) protection
  - Remote File Inclusion (RFI) & Local File Inclusion (LFI)
  - HTTP Protocol Violations & Request Smuggling
- **Microsoft Bot Manager Rule Set 1.0**:
  - Distinguishes malicious automated crawlers and scrapers from legitimate search engines.
- **Custom Rate Limiting Rules**:
  - Global IP threshold: Max 200 requests / minute per client IP.

### Layer 2: Application WAF ([`waf.js`](../server/middleware/waf.js))
- Operates inside the Node.js runtime as defense-in-depth:
  - Deep inspection of query strings, route parameters, and request bodies for SQLi constructs (`UNION SELECT`, `information_schema`, comment injection).
  - Sanitization of HTML/Script payloads (`<script>`, `javascript:`, event handler exploits).
  - Path traversal and local file inclusion attempts (`../`, `%2e%2e`, `/etc/passwd`).
  - Known exploit tools and scanner blocks (`sqlmap`, `nikto`, `acunetix`, `dirbuster`, `nmap`).
  - Automatic IP reputation ban: 5 violations within 10 minutes triggers an automatic 15-minute lockout.

---

## 4. Multi-Tier Rate Limiting Strategy ([`rateLimiter.js`](../server/middleware/rateLimiter.js))

| Tier | Target Endpoints | Threshold | Action on Breach |
| :--- | :--- | :--- | :--- |
| **General API** | `/api/v1/*` | 180 req / 1 min | HTTP 429 Too Many Requests |
| **Admin Authentication** | `/api/v1/admin/login` | 6 attempts / 15 min | HTTP 429 + Brute Force Audit Log |
| **Checkout & Orders** | `/api/v1/orders` | 12 orders / 10 min | HTTP 429 (Inventory Flood Guard) |
| **Search & Autocomplete** | `/api/v1/search` | 75 req / 1 min | HTTP 429 |
| **Public Order Tracking** | `/api/v1/orders/track` | 30 lookups / 10 min | HTTP 429 |

---

## 5. Network Port & Service Isolation Matrix

| Port | Service | Public Exposure | Network Placement |
| :--- | :--- | :--- | :--- |
| **443** | HTTPS | **Public** | Azure Front Door / Reverse Proxy only |
| **80** | HTTP | **Public** (Redirect only) | 301 Redirect to HTTPS |
| **3000** | Express API | **Private** | Subnet `10.10.1.0/24` (No Public IP) |
| **5432** | PostgreSQL | **Private** | Subnet `10.10.2.0/24` via Private Link (No Public IP) |
| **6379** | Redis (Cache) | **Private** | Subnet `10.10.3.0/24` (Internal only) |
| **22 / 3389** | SSH / RDP | **Closed** | Azure Bastion / Just-In-Time access only |

---

## 6. Database Isolation & Zero Public Access ([`postgres.js`](../server/config/postgres.js))

1. **Private Networking**:
   - `publicNetworkAccess: 'Disabled'`.
   - Accessible only via private IP allocated from `postgres-subnet` through Azure Private DNS Zone (`harryandco.private.postgres.database.azure.com`).
2. **Encrypted Transport**:
   - Mandatory SSL (`require_secure_transport = on`).
   - TLS 1.2+ minimum cipher standard.
3. **Role Segregation**:
   - `harryandco_app`: Production application user with strictly DML privileges (`SELECT`, `INSERT`, `UPDATE`, `DELETE`).
   - `atelier_admin`: Dedicated migration user executed only during deployment pipelines.
4. **Key Vault Secrets**:
   - Zero hardcoded connection strings.
   - Credentials injected into runtime environment variables via Azure Key Vault references (`@Microsoft.KeyVault(SecretUri=...)`).

---

## 7. Production Deployment Runbook

### Deploying the Azure Infrastructure
```bash
# 1. Login to Azure
az login

# 2. Set active subscription
az account set --subscription "<SUBSCRIPTION_ID>"

# 3. Create Resource Group
az group create --name "rg-harryandco-prod" --location "centralindia"

# 4. Deploy Bicep Infrastructure
az deployment group create \
  --resource-group "rg-harryandco-prod" \
  --template-file "./azure/azure-deploy.bicep" \
  --parameters \
      appName="harryandco" \
      environment="prod" \
      dbAdminPassword="<SUPER_STRONG_PASSWORD>"
```

### Verifying Origin IP Shielding
Execute an unauthorized direct probe to test origin rejection:
```bash
# Direct access to origin without Front Door header should receive 403 Forbidden:
curl -I http://localhost:3000/api/v1/products -H "Host: origin.internal"

# Access with correct edge signature:
curl -I http://localhost:3000/api/v1/products -H "X-Azure-FDID: <EXPECTED_FDID>"
```
