import { db } from './firebase';
import { doc, getDoc, setDoc, collection, getDocs, addDoc } from 'firebase/firestore';

export async function seedDatabase() {
  try {
    // 1. Store Settings
    const settingsRef = doc(db, 'settings', 'store');
    const settingsSnap = await getDoc(settingsRef);
    if (!settingsSnap.exists()) {
      await setDoc(settingsRef, {
        general: { storeName: 'Aura Luxe', contactEmail: 'contact@auraluxe.com', contactPhone: '+8801700000000', industry: 'Fashion & Apparel', currency: 'BDT', timezone: 'Asia/Dhaka', storeAddress: 'Banani, Dhaka, Bangladesh' },
        paymentProviders: {
          bkash: { active: true, appKey: '', appSecret: '' },
          sslcommerz: { active: true, storeId: 'auraluxe', storePassword: '' },
          rocket: { active: false, apiUser: '', apiPass: '' }
        },
        shipping: { zones: [{ name: 'Inside Dhaka', rate: 60, courier: 'Pathao' }] },
        smsConfig: { active: true, provider: 'Twilio', apiKey: 'demo', senderId: 'AURALUXE' },
        couriers: {
           pathao: { active: true, apiKey: 'mock-pathao' },
           steadfast: { active: true, apiKey: 'mock-steadfast', secretKey: 'dev' },
           redx: { active: false },
           ecourier: { active: false },
           paperfly: { active: false }
        }
      });
      console.log('Store settings seeded.');
    }

    // 2. Storefront Layout
    const storefrontRef = doc(db, 'settings', 'storefront');
    const storefrontSnap = await getDoc(storefrontRef);
    if (!storefrontSnap.exists()) {
      await setDoc(storefrontRef, {
        hero: {
          title: 'Discover Pure Elegance',
          subtitle: 'The Summer Collection 2026 is here. Embrace the new standard.',
          buttonText: 'Shop New Arrivals',
          buttonLink: '/shop',
          imageUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&q=80'
        },
        footer: {
          aboutText: 'Aura Luxe is redefining premium commerce with cutting-edge technology and timeless aesthetics.',
          socialLinks: { facebook: 'https://facebook.com', instagram: 'https://instagram.com', twitter: 'https://twitter.com' }
        },
        brands: [
          { name: 'Nike', logo: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=200' },
          { name: 'Rolex', logo: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&q=80&w=200' },
          { name: 'Gucci', logo: 'https://images.unsplash.com/photo-1564859228273-274232fdb516?auto=format&fit=crop&q=80&w=200' }
        ],
        productMarketing: {
           title: 'Designed for Excellence',
           text: 'Every detail of the {product.name} has been meticulously crafted to offer unparalleled quality and style. Our commitment to excellence ensures that you receive a product that not only looks stunning but stands the test of time.',
           features: [
              { title: 'Premium Materials', description: 'Sourced from the finest global artisans, the materials used represent the pinnacle of luxury and durability.', icon: 'Sparkles' },
              { title: 'Expert Craftsmanship', description: 'Hand-finished by master craftspeople bringing decades of experience and passion to every stitch.', icon: 'ShieldCheck' },
              { title: 'Timeless Design', description: 'A modern classic that transcends fleeting trends, becoming a staple in your personal collection.', icon: 'Play' }
           ]
        }
      });
      console.log('Storefront config seeded.');
    }

    // 3. Pages Layouts
    const pagesRef = collection(db, 'pages');
    const pagesSnap = await getDocs(pagesRef);
    if (pagesSnap.empty) {
      const mockPages = [
        { title: 'About Us', slug: '/about', status: 'Published', content: 'Welcome to Aura Luxe. We provide premium fashion items...', date: 'Oct 24, 2026' },
        { title: 'Contact Us', slug: '/contact', status: 'Published', content: 'Contact us at contact@auraluxe.com...', date: 'Oct 22, 2026' },
        { title: 'Privacy Policy', slug: '/privacy-policy', status: 'Published', content: 'We value your privacy. All your data is securely stored...', date: 'Oct 15, 2026' },
        { title: 'Terms & Conditions', slug: '/terms', status: 'Published', content: 'By using this store, you agree to our terms and conditions...', date: 'Oct 15, 2026' },
        { title: 'FAQ', slug: '/faq', status: 'Draft', content: 'Frequently asked questions: ...', date: 'Today' }
      ];
      for (const page of mockPages) {
        await addDoc(pagesRef, page);
      }
      console.log('Pages seeded.');
    }

    // 4. Products
    const productsRef = collection(db, 'products');
    const productsSnap = await getDocs(productsRef);
    if (productsSnap.empty) {
      const mockProducts = [
        {
          name: 'Royal Panjabi Elite',
          price: 12500,
          category: 'Fashion - Men',
          description: 'A premium panjabi designed for ultimate luxury.',
          brand: 'Gucci',
          imageUrl: 'https://images.unsplash.com/photo-1594938384824-0ce4562b8eee?w=800&q=80',
          sku: 'RPE-001',
          stock: 50,
          weight: 1.5,
          rating: 4.8,
          reviews: 12,
          isNewArrival: true,
          supportsAITryOn: false,
          has3DView: false,
          marketing: {
             title: 'A Touch of Royalty',
             text: 'Experience the unparalleled elegance of the {product.name}. Designed to turn heads and keep you comfortable all day long.',
             features: [
                 { title: 'Premium Fabric', description: 'Made from 100% fine silk cotton.', icon: 'Sparkles' },
                 { title: 'Comfort Fit', description: 'Tailored perfectly for every shape.', icon: 'Check' },
                 { title: 'Exclusive Design', description: 'Available for a limited time.', icon: 'Star' }
             ]
          }
        },
        {
          name: 'Silk Saree Collection',
          price: 24990,
          category: 'Fashion - Women',
          description: 'Exquisite silk saree representing heritage.',
          brand: 'Gucci',
          imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&q=80',
          sku: 'SSC-102',
          stock: 20,
          weight: 2.0,
          rating: 4.9,
          reviews: 34,
          isNewArrival: false,
          supportsAITryOn: false,
          has3DView: false
        }
      ];
      for (const prod of mockProducts) {
        await addDoc(productsRef, prod);
      }
      console.log('Products seeded.');
    }
  } catch (error) {
    console.error('Failed to seed database:', error);
  }
}
