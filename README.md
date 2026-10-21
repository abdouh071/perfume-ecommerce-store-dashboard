L'Essence --- Luxury Perfumes E-Commerce 🌟

if you find it helpful don't forget to 🌟 


L'Essence

Banner


Live Demo: https://com2-65de5.web.app


L'Essence is a premium, fully localized e-commerce platform tailored for
the Algerian luxury perfume market. Built with modern web technologies,
it features a sophisticated Liquid Glass-inspired design, a
comprehensive administration dashboard, and integrations with local
delivery providers such as Yalidine, Maystro, and Ecotrack.


✨ Key Features

🛍️ Premium Customer Experience


Liquid Glass UI/UX: A modern design featuring glassmorphism, smooth animations, and a dynamic Ken Burns hero carousel.

Multilingual Support: English, French, and Arabic, including right-to-left (RTL) support.

Smart Checkout: Calculates shipping rates based on the customer's Wilaya.

StopDesk Pickup Points: Retrieves available pickup points dynamically where supported.

Order Tracking: Customers can track their orders.

Responsive Design: A modern shopping interface for different screen sizes.


🖼️ Storefront Screenshots

Home Page


Home Page


Home Page


Home Page


Shop Page


Customer Profile


🛡️ Secure Backend Architecture


Firebase Cloud Functions Proxy: Shipping API requests are routed through server-side Cloud Functions to help keep private courier API credentials out of frontend code and avoid browser CORS issues.

Automated Webhooks: Processes courier webhooks to update order statuses where supported.

Cloud Database & Authentication: Uses Firebase Firestore for application data and Firebase Authentication for user accounts.


📊 Powerful Admin Dashboard


Product Management: Create, update, and delete fragrances, including stock, pricing, fragrance notes, and images.

Order Processing: View orders, print courier shipping labels, and dispatch orders to supported couriers.

Dynamic Content Control: Customize the hero carousel, categories, and featured products from the dashboard.

Shipping Configuration: Configure supported Algerian couriers and synchronize shipping rates.

Team Management: Includes team-related administration features.


📸 Dashboard Screenshots

Dashboard


Dashboard Orders


Dashboard Menu


Dashboard Team Management


Store Settings


Store Settings


🛠️ Technology Stack


Frontend: React.js, Vite, Tailwind CSS

State Management: React Context API

Backend/BaaS: Firebase Authentication, Firestore, Cloud Functions, and Hosting

Image Hosting: ImgBB API

Animations: Framer Motion

Icons: Lucide React and Google Material Symbols


🚀 Getting Started

Prerequisites


Node.js and npm

Git

A Firebase project with the services required by the application

Firebase CLI (for deploying Cloud Functions)


1. Clone the Repository

git clone https://github.com/abdouh071/perfume-ecommerce-store-dashboard.git
cd perfume-ecommerce-store-dashboard

2. Install Dependencies

npm install

3. Configure Environment Variables

Create a .env file in the project root. The following names are
examples based on the project's configuration and should be checked
against the source code:


VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_IMGBB_API_KEY=your_imgbb_api_key

Important: - Verify that the environment variable names match those
used by the application. - Variables prefixed with VITE_ are exposed
in the frontend bundle. Do not put private courier API tokens or other
server-only secrets in them. - Configure your own Firebase Security
Rules and authorization before deployment.


4. Run the Development Server

npm run dev

Open the local URL printed by Vite in your terminal.


5. Deploy Cloud Functions

If your project uses the cloud-functions-source directory for shipping
integrations:


cd cloud-functions-source
npm install
firebase login
firebase use --add
firebase deploy --only functions

Configure the required server-side environment values and courier
credentials before deployment. Firebase deployment requirements and
billing depend on the services used.


🔐 Security Notes

Before deploying your own instance:



Configure Firestore Security Rules.

Restrict administrative operations to authorized users.

Keep private courier credentials on the server.

Validate incoming orders and webhook requests.

Test checkout, shipping calculations, order creation, and tracking.


🤝 Contributing

Contributions, bug reports, and feature suggestions are welcome.



Fork the repository.

Create a branch for your changes.

Commit your changes.

Open a pull request describing your contribution.


Report an
issue.


📄 License

This project is licensed under the MIT License. You may use, modify,
distribute, reuse, and sell this software, including for commercial
purposes, subject to the conditions in the LICENSE file.


👨‍💻 Author

Abdelhak Hichour



GitHub: @abdouh071

Email: hichourabdelhak1@gmail.com


⭐ Support the Project

If you find L'Essence useful, consider giving the repository a ⭐ on
GitHub. It helps other developers discover the project.



Built with ❤️ for the Algerian e-commerce ecosystem.

