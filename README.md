# 🏕️ CivicLedger

**CivicLedger** is a **full-stack grievance tracking and transparency platform** designed for a Government. Built as part of **Codesangam – Webster**, it streamlines citizen complaint handling, departmental accountability, and real-time monitoring.

---

## 🌟 Features

- **Complaint Management System:**  
  Lodge complaints with categories, attach images, and track status in real-time.

- **Role-Based Access Control:**  
  Separate dashboards for **Admins**, **Staff**, and **Citizens** with tailored access.

- **Reports & Analytics:**  
  Visualize complaint trends, generate department-wise reports, and track performance.

- **Heatmaps & SLA Monitoring:**  
  Identify hotspots using geolocation and track complaint resolution timelines.

- **Escalation & Transparency:**  
  Automatic escalations for pending complaints and public transparency portal for citizens.

- **Notifications:**  
  Get real-time updates on complaint status through email/SMS alerts.

---

## 🛠️ Tech Stack

| Layer           | Technology                      |
|-----------------|--------------------------------|
| Frontend        | React, Tailwind CSS, Recharts   |
| Backend         | Node.js, Express.js             |
| Database        | PostgreSQL                     |
| Authentication  | Google OAuth 2.0, JWT          |
| Deployment      | Docker, Cloud Hosting           |

---

## ICP Add-On Layer

Primary architecture remains unchanged:

`React -> Express -> PostgreSQL`

ICP/DFINITY is integrated as a verification extension for:

- Immutable complaint audit logs.
- Blockchain-backed transparency verification hashes.

If local ICP runtime is unavailable, keep `ICP_ENABLED=false` and the app continues operating normally.
Deploy details are in [backend/icp/README.md](backend/icp/README.md).
