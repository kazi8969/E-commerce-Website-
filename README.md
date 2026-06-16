# Nexa BGD Enterprise Commerce

Enterprise AI-powered e-commerce platform architecture prototype designed for the modern market. Features a stunning frontend UI, a robust admin dashboard, and AI-driven workflows like virtual try-ons and smart interactions.

🔗 **Live Demo:** [View Application](https://ais-pre-u3cyyvetibw5y44zaormkp-615241986875.asia-southeast1.run.app)

---

## ✨ Features

### 🛍️ Client Storefront
* **Dynamic Hero Carousel:** Configurable hero slides to highlight featured campaigns.
* **Product Landing Pages:** Detailed product pages featuring rich marketing copy, feature sets, and variants.
* **Smart Cart System:** Slide-out intuitive cart drawer with real-time total calculations and checkout capabilities.
* **User Accounts:** Firebase-powered authentication with user profiles, wallet credit balance, and complete order history.
* **Order Tracking & Invoices:** Users can track orders in real-time and download generated invoices.
* **Special Offers UI:** High-conversion promotional displays and discounted product showcases.

### 🔐 Admin Dashboard
A complete, gated administrative control center for store owners to manage every aspect of the platform:
* **Product Management:** Full CRUD capabilities for products. Update inventory, manage variants, category hierarchies, and rich marketing features.
* **Storefront Customization:** Visually manage the hero slides, banners, categories, and dynamically update the storefront's appearance without touching code.
* **Order Fulfillment:** Comprehensive order management console to view transactions, update order statuses, and track fulfillment metrics.
* **Offers Manager:** Create, update, and manage global store discounts and targeted promotional campaigns.
* **Analytics & Data:** Quick visual insights into store performance and top metrics.

### 🤖 AI Innovations
* **AI Virtual Try-On:** Cutting-edge prototype demonstrating augmented reality apparel fitting (`AITryOnModal`).
* **Interactive AI Chat:** Floating context-aware chat component designed for conversational customer support.

---

## 🛠 Tech Stack

* **Frontend:** React 18, Vite, Typecript
* **Styling:** Tailwind CSS (with responsive, glassmorphic layout designs)
* **Backend:** Firebase (Firestore DB & Firebase Auth)
* **Icons:** Lucide React

---

## 🚀 Getting Started

To run this application locally:

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd nexa-bgd
   ```

2. **Install Application Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment:**
   Create a `.env` file in the root directory and add your Firebase credentials.
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. **Start Development Server:**
   ```bash
   npm run dev
   ```

## 📄 License
This project is for demonstration and architectural prototyping purposes.
