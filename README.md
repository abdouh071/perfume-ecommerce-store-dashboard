# 💎 L'Essence — Luxury Perfumes E-Commerce 🌟

L'Essence Banner : ![L'Essence Banner](https://com2-65de5.web.app/assets/images/image_0.webp)

🌐 Live Demo: https://com2-65de5.web.app

---

## 💼 Built for Real Use

L'Essence is a production-ready e-commerce platform tailored for the Algerian luxury Perfumes market.

It is designed to provide a modern online store experience while allowing business owners to efficiently manage products, orders, and deliveries.

---

## 🚀 Overview

L'Essence is a premium, fully-localized e-commerce platform specifically built for perfume businesses.

It features a modern "Liquid Glass" design, a complete admin dashboard, and secure integration with local delivery couriers (Yalidine, Maystro, Ecotrack, etc.).

The project simulates a real-world business environment and focuses on practical usability, performance, and scalability.

---

## ✨ Key Features

### 🛍️ Premium Customer Experience
- "Liquid Glass" UI/UX: Modern design with glassmorphism, smooth animations, and a dynamic hero carousel  
- Multi-Language Support: English, French, and Arabic (RTL support)  
- Smart Checkout: Shipping cost calculated dynamically based on Wilaya  
- StopDesk Integration: Fetches available pickup points dynamically  
- Order Tracking: Customers can track their orders in real-time  

---

### 🛡️ Secure Backend Architecture
- Firebase Cloud Functions Proxy:  
  All courier API requests are handled server-side to protect sensitive keys and avoid CORS issues  

- Automated Webhooks:  
  Automatically updates order status (e.g., shipped → delivered)  

- Cloud Database & Authentication:  
  Firestore for real-time data + Firebase Auth for secure login  

---

### 📊 Admin Dashboard
- Product Management: Full CRUD system with stock, pricing, and images  
- Order Processing: View, confirm, and dispatch orders with one click  
- Dynamic Content Control: Update homepage content without modifying code  
- Shipping Configuration: Switch couriers and sync shipping data  
- Team Management: Manage admins and workers with activity tracking  

---

## 🛠️ Technology Stack

- Frontend: React.js, Vite, TailwindCSS  
- State Management: React Context API  
- Backend / BaaS: Firebase (Auth, Firestore, Cloud Functions, Hosting)  
- Image Hosting: ImgBB API  
- Animations: Framer Motion  
- Icons: Lucide React & Material Symbols  

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)  
- Firebase CLI (npm install -g firebase-tools)  
- Firebase project (Firestore + Auth enabled)  

---

### Installation

bash git clone https://github.com/yourusername/lessence-luxury-perfumes.git cd lessence-luxury-perfumes npm install 

---

### Environment Variables

Create a .env file:

env VITE_FIREBASE_API_KEY=your_api_key VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain VITE_FIREBASE_PROJECT_ID=your_project_id VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id VITE_FIREBASE_APP_ID=your_app_id VITE_IMGBB_API_KEY=your_imgbb_api_key 

---

### Run Development Server

bash npm run dev 

---

### Deploy Cloud Functions

bash cd cloud-functions-source npm install firebase deploy --only functions 

---

## 📸 Screenshots
(Add screenshots here)

---

## 🔧 Customization

This project is built specifically for perfume e-commerce, but it can be adapted with minor modifications to fit other business types if needed.

---

## 📄 License (Important)

This project is available for:

✔ Personal use  
✔ Learning purposes  
✔ Modification and customization  
✔ Use in freelance/client projects  

You are allowed to:
- Use the code  
- Modify it  
- Build your own version  

However:

❗ You are NOT allowed to:
- Resell or redistribute this project as-is  
- Claim the original project as your own  

---

## 📬 Contact

- Email: your-email@example.com  
- GitHub: https://github.com/your-username  

---

## ⭐ Final Note

This project represents a practical implementation of a real-world e-commerce system focused on usability, performance, and scalability.

If you found it useful, feel free to ⭐ the reposito
