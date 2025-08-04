# QueueWise

**Smart, low-tech patient queue management for South African PHC clinics**

---

## 🌍 Overview

QueueWise is a lightweight, secure, and accessible digital system designed to ease overcrowding in public health clinics (PHCs). It empowers both **patients** and **staff** through a hybrid booking platform, live queue tracking, and a simple admin interface.

Built with real-world constraints in mind, QueueWise works in **low-bandwidth environments**, supports **non-smartphone users**, and ensures **fair, transparent service delivery** at clinics.

---

## 🚀 Features

### 💡 Hybrid Booking System

- Patients can book appointments via a web interface
- Paperless booking queue eliminates early-morning congestion
- Works even on low-end smartphones or feature phones (via staff-assisted entry)

### 🕓 Live Queue Tracking

- Patients see their position and estimated wait time
- Reduces frustration, pushing, and uncertainty
- Admins can view real-time load and upcoming patients

### 🎯 Smart Admin Panel

- Prioritize vulnerable patients with tagging (e.g., elderly, chronic conditions)
- Detects overbooking and warns of potential bottlenecks
- Color-coded load indicators for efficient queue management

### 📶 Offline-Friendly

- Built for clinics with poor internet connectivity
- Simple UIs for both staff and patients
- No complex app installs needed

---

## 📊 Lean Business Canvas

### **Problem Statement**

Overcrowding in PHC clinics leads to long queues, dissatisfaction, and operational stress. Patients arrive early without guaranteed service order, and staff lack tools for live queue control. (Source: SA Health Review)

### **Solution**

QueueWise is a web-based booking and live queue management system tailored to local clinics. It supports time-slot appointments, live tracking, staff dashboards, and fairness in service.

Patients benefit from:

- Avoiding unnecessary waiting and travel
- Predictable service timing
- Simple interface access (via mobile or staff assistance)

Clinics benefit from:

- Better load distribution
- Reduced congestion
- Enhanced patient satisfaction

### **Customer Segments**

- Low-income patients visiting public clinics
- Elderly and chronic patients needing priority care
- PHC nurses and admin staff
- Clinic managers at Department of Health

### **Unique Value Proposition**

QueueWise bridges communication gaps between patients and clinics. It’s more than a booking system — it's a live queue tracker that ensures fairness, reduces pushing, and improves experience even in low-connectivity areas. Designed for simplicity, inclusivity, and transparency.

### **Distribution Channels**

- Direct outreach to Tshwane clinics
- Health district meetings and partnerships
- Word-of-mouth through patients and community workers

### **Growth Metrics**

- 2,000 users in the first 6 months
- 25+ clinics onboarded
- 75% reduction in average waiting complaints
- 10,000 appointment slots managed

### **Unfair Advantage**

- Designed with feedback from South African clinics
- Works on low bandwidth, no installs required
- Staff-first workflows with clear data visuals

### **Cost Structure**

- R30,000: Hosting and Infrastructure
- R100,000: Development & Support
- R40,000: Training & Outreach Materials

### **Revenue Streams**

- Government procurement or municipal contracts
- Monthly licensing per clinic
- Data insights for health system optimization

---

## 🔐 Secure System Development Lifecycle (SSDLC)

| Phase                             | Activities                                                               |
| --------------------------------- | ------------------------------------------------------------------------ |
| **1. Security Requirements**      | Risk assessment based on patient data, clinic networks, and admin roles. |
| **2. Threat Modelling**           | STRIDE-based model for queue abuse, data leakage, impersonation.         |
| **3. Design Review**              | Minimalist UI/UX to reduce input errors and spoofing.                    |
| **4. Secure Coding Practices**    | Input validation, hashed passwords, OTP verification via Twilio/email.   |
| **5. Security Testing**           | Manual + automated testing for auth, access control, data validation.    |
| **6. Secure Integration**         | Role-based access, secure DB transactions, HTTPS enforcement.            |
| **7. Post-Deployment Monitoring** | Admin log tracking, token validation, limited session timeouts.          |

---

## 🛠️ Technologies Used

- **Frontend**: HTML, CSS, Bootstrap
- **Backend**: Node.js with Express
- **Database**: SQLite (for quick deployment) and PostgreSQL-ready
- **Authentication**: OTP-based two-step verification (via Twilio & Nodemailer)
- **Deployment**: Can be hosted on lightweight Linux servers (e.g., DigitalOcean)

---

## 🗃️ Database Schema Highlights

- `users`: Patient and staff registration
- `appointments`: Booking records, time slots, linked user & clinic
- `clinics`: PHC clinic info including weekday & weekend hours
- `queue`: Active queue session tracking
- `otp`: One-time passwords for 2FA login security

---

## 🧪 Running the Project Locally

### 📦 Install Dependencies

```bash
npm install
```

### ▶️ Start Server

```bash
node server/app.js
```

### 🧱 Setup Database

```bash
node db/setup.js
```

Ensure you have `.env` configured for Twilio, Gmail, and DB access.

---

## 📬 Contact

**Team TechnoBytes**\
📍 Tshwane | SMU Digital Health Hackathon 2025\

---

## 📜 License

This project is open-source under the MIT License.

