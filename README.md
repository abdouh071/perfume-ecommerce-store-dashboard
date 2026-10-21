L'Essence — Luxury Perfume E-Commerce 🌟

"L'Essence Banner" (https://com2-65de5.web.app/assets/images/image_0.webp)

Live Demo: "https://com2-65de5.web.app" (https://com2-65de5.web.app)

L'Essence is a premium, multilingual e-commerce platform built for the Algerian luxury perfume market. It combines a Liquid Glass-inspired design, a comprehensive administration dashboard, and integrations with local delivery providers such as Yalidine, Maystro, and Ecotrack.

✨ Key Features

🛍️ Customer Experience

- Liquid Glass-inspired UI: Glassmorphism, smooth animations, and a dynamic hero carousel.
- Multilingual support: English, French, and Arabic, including RTL layouts.
- Product catalog: Browse perfumes, fragrance notes, categories, and featured products.
- Smart checkout: Calculate shipping rates based on the customer's Wilaya.
- StopDesk pickup points: Retrieve available pickup locations where supported.
- Order tracking: Follow order status.
- Responsive design: Adapted to different screen sizes.

🖼️ Storefront Screenshots

"Home Page" (https://github.com/abdouh071/perfume-ecommerce-store-dashboard/raw/refs/heads/main/public/assets/images/IMG_2918.png)

"Home Page" (https://github.com/abdouh071/perfume-ecommerce-store-dashboard/raw/refs/heads/main/public/assets/images/IMG_2919.png)

"Home Page" (https://github.com/abdouh071/perfume-ecommerce-store-dashboard/raw/refs/heads/main/public/assets/images/IMG_2921.png)

"Home Page" (https://github.com/abdouh071/perfume-ecommerce-store-dashboard/raw/refs/heads/main/public/assets/images/IMG_2922.png)

"Shop Page" (https://github.com/abdouh071/perfume-ecommerce-store-dashboard/raw/refs/heads/main/public/assets/images/IMG_2923.png)

"Customer Profile" (https://github.com/abdouh071/perfume-ecommerce-store-dashboard/raw/refs/heads/main/public/assets/images/IMG_2924.png)

🛡️ Backend Architecture

- Firebase Cloud Functions: Proxy shipping API requests through server-side functions.
- Secure credential handling: Keep private courier API credentials out of frontend code.
- Cloud Firestore: Store application data and synchronize supported updates.
- Firebase Authentication: Handle user authentication.
- Automated webhooks: Synchronize courier order statuses where supported.

📊 Admin Dashboard

- Product management: Create, update, and delete products, including stock, prices, fragrance notes, and images.
- Order processing: Manage orders and shipping operations.
- Courier integrations: Submit orders and retrieve shipping labels.
- Dynamic content: Customize the hero carousel, categories, and featured products.
- Shipping configuration: Configure supported delivery providers.
- Team management: Manage team-related settings available in the dashboard.

📸 Dashboard Screenshots

"Dashboard" (https://github.com/abdouh071/perfume-ecommerce-store-dashboard/raw/refs/heads/main/public/assets/images/IMG_2925.png)

"Dashboard Orders" (https://github.com/abdouh071/perfume-ecommerce-store-dashboard/raw/refs/heads/main/public/assets/images/IMG_2926.png)

"Dashboard Menu" (https://github.com/abdouh071/perfume-ecommerce-store-dashboard/raw/refs/heads/main/public/assets/images/IMG_2928.png)

"Dashboard Team Management" (https://github.com/abdouh071/perfume-ecommerce-store-dashboard/raw/refs/heads/main/public/assets/images/IMG_2929.png)

"Store Settings" (https://github.com/abdouh071/perfume-ecommerce-store-dashboard/raw/refs/heads/main/public/assets/images/IMG_2930.png)

"Store Settings" (https://github.com/abdouh071/perfume-ecommerce-store-dashboard/raw/refs/heads/main/public/assets/images/IMG_2931.png)

🛠️ Technology Stack

- Frontend: React.js, Vite, Tailwind CSS
- State Management: React Context API
- Backend: Firebase Authentication, Firestore, Cloud Functions, and Hosting
- Image Hosting: ImgBB API
- Animations: Framer Motion
- Icons: Lucide React and Google Material Symbols

🚀 Getting Started

Prerequisites

- Node.js and npm
- Git
- A Firebase project
- Firebase CLI for deploying Cloud Functions

1. Clone the Repository

git clone https://github.com/abdouh071/perfume-ecommerce-store-dashboard.git
cd perfume-ecommerce-store-dashboard

2. Install Dependencies

npm install

3. Configure Environment Variables

Create a ".env" file in the project root and configure the variables expected by your source code.

VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_IMGBB_API_KEY=your_imgbb_api_key

Never place private courier credentials in frontend environment variables. Configure server-side secrets and Firebase security rules separately.

4. Start the Development Server

npm run dev

Open the local URL displayed in your terminal.

5. Deploy Cloud Functions

If required by your setup:

cd cloud-functions-source
npm install
firebase login
firebase use --add
firebase deploy --only functions

Configure your own Firebase project and the required courier credentials before deployment.

🔐 Security

Before deploying your own instance:

- Configure Firestore security rules.
- Restrict administrative actions to authorized users.
- Store private API credentials on the server.
- Validate orders and incoming webhooks.
- Test checkout and courier integrations.

🤝 Contributing

Contributions, bug reports, and feature suggestions are welcome.

1. Fork this repository.
2. Create a branch for your changes.
3. Commit your changes.
4. Open a pull request.

"Report an issue" (https://github.com/abdouh071/perfume-ecommerce-store-dashboard/issues)

📄 License

This project is licensed under the "MIT License" (LICENSE).

You may use, modify, distribute, reuse, and sell this software, including for commercial purposes, subject to the conditions in the license.

👨‍💻 Author

Abdelhak Hichour

- GitHub: "@abdouh071" (https://github.com/abdouh071)

⭐ Support the Project

If you find L'Essence useful, consider giving the repository a ⭐ on GitHub.

---

Built with ❤️ for the Algerian e-commerce ecosystem.