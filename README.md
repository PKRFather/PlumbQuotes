# PlumbQuotes (PlumbQuote & Bill)

> **Offline-first plumbing quotation and invoice engine for field contractors and plumbers.**
> Official Repository: [https://github.com/PKRFather/PlumbQuotes](https://github.com/PKRFather/PlumbQuotes)  
> Owner: **Pareswar Rout (PKRFather)** • `pradeeprout56@gmail.com`  
> Business: **PARESWAR ROUT, P.H.D Contractor**, Bhubaneswar, Odisha

---

## 🌟 Overview

**PlumbQuotes** is designed for plumbing contractors, sanitation engineers, and field technicians to generate professional quotations and GST bills on-site in under two minutes, with 100% offline capability.

It features:
- **Panam Engineers & Plumbing Standards Catalog**: Built-in specifications from the Panam Engineers Pipe Fittings Catalog with dynamic **Size** and **Type (Material)** dropdowns (e.g., 3/4" Elbow in CPVC, UPVC, Brass, SS 316, Carbon Steel, etc.) that automatically recalculate rates and totals on the fly.
- **Pareswar Rout (P.H.D Contractor) Official Letterhead**: Features the sacred Lord Shiva circular seal, bold contractor typography, plum-accented section headers, GST calculations, UPI QR code, and formal bank payment details.
- **Owner Account System**: Verified owner badge for `PKRFather` (`pradeeprout56@gmail.com`), 4-digit PIN lock for pricing and bank details protection, and role switching between Owner Mode and Staff/Technician Mode.
- **100% Offline-First (PWA)**: Full local storage persistence, JSON backup export/restore, and offline caching.

---

## 🛠️ Key Capabilities

### 1. Dynamic Pipe Fittings, Valves & Joints Glossary
- **Items**: Elbow 90°, Equal Tee, Hex Nipple, Socket Weld Couplings, Union, Ball Valves, Gate Valves, Flanges, Compression Fittings, Grooved Mechanical Joints, etc.
- **Material Variants**: CPVC, UPVC, Brass, GI, SS 304, SS 316, Carbon Steel, PPR, HDPE, Copper, Cast Iron, PVC SWR.
- **Sizes**: 1/4", 3/8", 1/2", 3/4", 1", 1-1/4", 1-1/2", 2", 2-1/2", 3", 4", 5", 6".
- **Dynamic Pricing**: Selecting any size or material instantly recalculates item rates, line item totals, GST, and document grand total.

### 2. Default Letterhead & Billing Style
- Pre-configured for **PARESWAR ROUT, P.H.D Contractor**.
- Embedded SVG emblem of Lord Shiva.
- Dual quotation and tax invoice formats.
- UPI QR code for fast on-site customer payments.
- Automatic amount in words conversion (Indian Rupees).

### 3. Owner Account & Security
- **Owner Handle**: `PKRFather`
- **Owner Email**: `pradeeprout56@gmail.com`
- **Security PIN**: 4-digit PIN lock to restrict technician access to bank details or rate tampering.
- **Direct GitHub Sync**: Sync configuration snapshots directly to `PKRFather/PlumbQuotes`.

---

## 🚀 Quick Start (Development)

```bash
# Clone the repository
git clone https://github.com/PKRFather/PlumbQuotes.git
cd PlumbQuotes

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:3000` in your browser.

---

## 📦 Push Commits to GitHub

To push the latest updates from your local workspace to your GitHub repository:

```bash
# 1. Set branch to main
git branch -M main

# 2. Add remote origin if not already set
git remote add origin https://github.com/PKRFather/PlumbQuotes.git || git remote set-url origin https://github.com/PKRFather/PlumbQuotes.git

# 3. Push to GitHub using your personal access token or credentials
git push -u origin main
```

> **Note on Commit Attribution:**  
> All commits in this repository are authored with `pradeeprout56@gmail.com`. Since your GitHub account is registered with `pradeeprout56@gmail.com`, GitHub will automatically attribute all commits to your profile.

---

## 📄 License

Licensed under the Apache-2.0 License.
