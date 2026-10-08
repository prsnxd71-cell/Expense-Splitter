# 💸 Expense Splitter

A minimal, full-stack bill splitting web application built for a **45-minute workshop**. 

Designed strictly with **3 Frontend Pages**, **5 Backend Endpoints**, and **3 Database Entities**, featuring passwordless OTP login powered by the **Minimoth API**.

---

## 🚀 Key Highlights & Architecture

- **Frontend:** React + Vite (Custom Mint & Slate fintech styling, fully responsive, zero heavy external UI dependencies).
- **Backend:** Node.js + Express (Lightweight file-based store, standard JWT authentication, native `fetch` requests).
- **Authentication:** Passwordless phone OTP login via [Minimoth API](https://minimoth.dev) (WhatsApp first with SMS fallback; includes a sandbox demo mode).
- **Strictly Minimal Constraints:**
  - **3 Frontend Pages:** Auth/Login Page, Groups Page, Group Detail & Smart Settlement Page.
  - **5 Backend Endpoints:**
    1. `POST /api/auth/send-otp` (Request OTP via Minimoth)
    2. `POST /api/auth/verify-otp` (Verify OTP & authenticate)
    3. `GET /api/groups` (Fetch user groups & balances)
    4. `POST /api/groups` (Create new expense group)
    5. `POST /api/groups/:id/expenses` (Record expense & calculate settlements)
  - **3 Database Entities:** `User`, `Group`, `Expense`.

---

## 📂 Project Structure

```text
Expense Splitter/
├── backend/
│   ├── data/
│   │   └── store.json          # Persistent lightweight JSON store
│   ├── db/
│   │   └── database.js         # Atomic file database manager
│   ├── middleware/
│   │   └── auth.js             # JWT bearer verification middleware
│   ├── models/
│   │   ├── User.js             # Entity 1: User
│   │   ├── Group.js            # Entity 2: Group
│   │   └── Expense.js          # Entity 3: Expense
│   ├── routes/
│   │   ├── auth.js             # Endpoints 1 & 2 (Minimoth OTP)
│   │   └── groups.js           # Endpoints 3, 4, 5 (Groups, Expenses, Splits)
│   ├── .env.example
│   ├── .env
│   ├── package.json
│   └── server.js               # Express entrypoint (:5000)
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── AuthPage.jsx          # Page 1: Phone + OTP Verification
│   │   │   ├── GroupsPage.jsx        # Page 2: Groups List & Create
│   │   │   └── GroupDetailPage.jsx   # Page 3: Expense Splitting & Settlements
│   │   ├── api.js              # Fetch client wrapper
│   │   ├── App.jsx             # Minimal page router & user session
│   │   ├── index.css           # Custom responsive styling
│   │   └── main.jsx
│   ├── .env.example
│   ├── .env
│   ├── index.html
│   ├── package.json
│   └── vite.config.js          # Vite config (:3000)
│
├── .gitignore
└── README.md
```

---

## ⚙️ Quickstart (Running Locally)

### 1. Backend Setup

1. Open a terminal and navigate to `backend`:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables:
   Copy `.env.example` to `.env` (already created with defaults):
   ```ini
   PORT=5000
   MINIMOTH_API_KEY=mock
   JWT_SECRET=super_secret_workshop_jwt_key_2026
   ```
   > 💡 **Minimoth Setup:** If you have an active key from [Minimoth Dashboard](https://app.minimoth.dev), replace `mock` with your `mm_live_...` or `mm_test_...` key. If left as `mock`, the backend operates in **Sandbox Demo Mode** and accepts `123456` as the OTP code.

4. Start the backend:
   ```bash
   npm start
   ```
   Server will run on `http://localhost:5000`.

---

### 2. Frontend Setup

1. In a second terminal, navigate to `frontend`:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Verify `.env` file:
   ```ini
   VITE_API_BASE_URL=http://localhost:5000/api
   ```
4. Start the Vite dev server:
   ```bash
   npm run dev
   ```
5. Open your browser at:
   ```
   http://localhost:3000
   ```

---

## 🧪 Testing the Flow in 2 Minutes

1. **Login with OTP (Page 1):**
   - Enter your phone number (e.g. `+919876543210` or a 10-digit number) and your name.
   - Click **Send OTP via Minimoth**.
   - If using live Minimoth, check your WhatsApp/SMS for the code. If in Sandbox/Demo mode, enter `123456`.
   - Click **Verify & Continue**.

2. **View & Create Groups (Page 2):**
   - See the pre-loaded sample group ("Weekend Goa Trip") with existing balance status.
   - Click **+ New Group** to create a custom group (e.g. "Dinner with Friends" with members "Rahul, Priya").

3. **Split Expenses & See Settlements (Page 3):**
   - Click into any group.
   - Inspect the **Smart Settlement Summary** (e.g. "Rohan owes Demo User ₹250.00").
   - Click **+ Add Expense** to log a bill:
     - Description: `Dinner`
     - Amount: `1200`
     - Paid by: Select who paid
     - Split among: Choose members involved
   - Watch the balances and settlement transfers instantly update!

---

## 🛡️ Input Validation & Error Handling

- **Phone Number:** Validates minimum length and normalizes formats.
- **OTP Code:** Validates exactly 6 numeric digits before verification.
- **Group Creation:** Requires a group title and at least one other member.
- **Expense Amounts:** Validates numerical amounts greater than zero and confirms valid group members.
- **HTTP Status Codes:** `400` for bad input, `401` for unauthorized access, `404` for missing groups, `500` for server issues.

