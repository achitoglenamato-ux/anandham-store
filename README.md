# Anandham Store

Online grocery ordering for Anandham Store. Customers register, browse the catalogue and place **pay-on-delivery** orders (Cash or UPI at the door). The shop owner manages orders and daily prices on the Owner desk.

It is a **plain static website** (React + Vite) hosted on **GitHub Pages**, with **Firebase** as the database and login system. There is no server of your own to run.

| What | Where it lives |
| --- | --- |
| Website pages | GitHub Pages |
| Customer login (email + password, password reset) | Firebase Authentication |
| Products, prices, customer details, orders | Firebase Firestore |
| Who is the owner | Firestore collection `admins` (set once, by hand) |

Website addresses use `#`, for example `https://YOURNAME.github.io/anandham-store/#/admin`. This makes refresh and shared links work on GitHub Pages.

---

## One-time setup

### 1. Create the Firebase project
1. Go to <https://console.firebase.google.com> → **Add project** (Google Analytics is not needed).
2. **Build → Authentication → Get started → Sign-in method → Email/Password → Enable → Save.**
3. **Build → Firestore Database → Create database** → choose a location near your customers (for India: `asia-south1 (Mumbai)`) → **Production mode**.
4. **Firestore Database → Rules** tab → delete everything → paste the whole content of `firestore.rules` from this project → **Publish**.
   *These rules are what keep your data safe, so do not skip this step.*

### 2. Connect the website to Firebase
1. Firebase console → ⚙ **Project settings → General → Your apps → Web (`</>`)** → register an app (skip Hosting).
2. Copy the `firebaseConfig` values into **`src/lib/firebase-config.ts`** (`apiKey`, `authDomain`, `projectId`, `appId`).
   These values are public by design, so it is fine to commit them to GitHub.
3. Firebase console → **Authentication → Settings → Authorized domains → Add domain** → `YOURNAME.github.io`.

### 3. Put the website on GitHub
1. Create a new repository on GitHub (for example `anandham-store`) and upload this project to the `main` branch.
2. Repository **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. The workflow in `.github/workflows/deploy.yml` builds and publishes on every push. Your site appears at `https://YOURNAME.github.io/anandham-store/` after about a minute (see the **Actions** tab).

### 4. Make yourself the shop owner
1. Open your website → **Register** with the owner's email.
2. Open `https://YOURNAME.github.io/anandham-store/#/admin`. It says "Owner access only" and shows your **account ID**. Copy it.
3. Firebase console → **Firestore Database → Start collection** → Collection ID: `admins` → Document ID: *paste the account ID* → add any field (for example `owner` = `true`) → **Save**.
4. Refresh `#/admin` (log out and in again if needed). You are now in the Owner desk.
5. **Product prices** tab → **Load the starting catalogue**. Your 18 starting products appear for customers straight away.

Only people with a document in `admins` can see orders or change prices. Nobody can create that document from the website.

---

## Everyday use
- **Orders**: Owner desk → Orders. New orders appear automatically; set the status (New / Called / Completed / Cancelled).
- **Prices**: Owner desk → Product prices. Type the new price → **Save price**. Customers see it immediately.
- **New products**: same tab → "Add a new product" at the bottom. **Remove** deletes a product (past orders keep their prices).
- **Customer accounts** are listed in Firebase console → Authentication; their delivery details are in Firestore → `users`.
- A customer who forgets their password taps **Forgot password?** on the login page.

## Running it on your own computer (optional)
```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # creates the dist/ folder
npm run typecheck
```

## Good to know
- **Prices at checkout** are re-read from the database when an order is placed, and each order stores a snapshot of the prices at that time. Because there is no server, the browser calculates the total; the owner always sees the full item list and collects payment on delivery.
- **Free plan**: the Firebase free (Spark) plan is enough for a neighbourhood shop.
- **Optional hardening**: Google Cloud console → APIs & Services → Credentials → your browser key → *HTTP referrers* → allow only `https://YOURNAME.github.io/*` and `http://localhost:5173/*`.
