import { getDb } from './mongodb.js';
import bcrypt from 'bcryptjs';

export const INITIAL_PRODUCTS = [
  {
    title: 'The 1968 Vintage Straight Selvedge',
    slug: '1968-vintage-straight-selvedge',
    sku: 'HC-VSS-001',
    description: '14oz raw Kaihara denim from Hiroshima, woven on vintage Toyoda G9 shuttle looms. Cut in a timeless mid-rise straight leg with red-line selvedge ID, custom brass hardware, and hand-stamped vegetable-tanned leather patch.',
    basePrice: 4990,
    compareAtPrice: 6490,
    fit: 'straight',
    productType: 'Jeans',
    gender: 'unisex',
    status: 'active',
    isNew: true,
    rating: 4.9,
    reviewCount: 48,
    fitStyling: [
      'Mid-rise classic straight leg from hip to hem',
      'True to size; waistband yields 0.5 inches with break-in',
      'Pairs perfectly with Chelsea boots or low-top canvas sneakers',
      'Standard 32" inseam with clean chainstitch hem'
    ],
    fabricCare: '14oz 100% Cotton raw Kaihara Japanese selvedge. Wear daily for 6 months before first cold water soak. Hang dry only.',
    tags: ['selvedge', 'kaihara', 'raw denim', 'bestseller', 'vintage straight'],
    images: [
      { url: 'https://images.unsplash.com/photo-1542272604-780c96856592?q=80&w=1000&auto=format&fit=crop', isMain: true, sortOrder: 0 },
      { url: 'https://images.unsplash.com/photo-1582552938357-32b906df40cb?q=80&w=1000&auto=format&fit=crop', isMain: false, sortOrder: 1 }
    ],
    variants: [
      { size: '28', color: 'Raw Indigo', price: 4990, stock: 12 },
      { size: '30', color: 'Raw Indigo', price: 4990, stock: 24 },
      { size: '32', color: 'Raw Indigo', price: 4990, stock: 35 },
      { size: '34', color: 'Raw Indigo', price: 4990, stock: 20 },
      { size: '36', color: 'Raw Indigo', price: 4990, stock: 15 },
      { size: '38', color: 'Raw Indigo', price: 4990, stock: 8 }
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    title: 'The Chelsea Tapered Kuroki Black',
    slug: 'chelsea-tapered-kuroki-black',
    sku: 'HC-CTK-002',
    description: '13.5oz Kuroki Mills sulfur-dyed black warp and black weft denim from Okayama. Tailored with a slim tapered profile from the knee down, matte black oxide rivets, and a tonal selvedge ticker line.',
    basePrice: 5490,
    compareAtPrice: 6990,
    fit: 'slim',
    productType: 'Jeans',
    gender: 'unisex',
    status: 'active',
    isNew: true,
    rating: 4.8,
    reviewCount: 36,
    fitStyling: [
      'Roomy thigh tapering sharply to a narrow 6.75" leg opening',
      'Medium-high rise designed for structured modern tailoring',
      'Stay-black sulfur dye resistant to washing fade'
    ],
    fabricCare: '13.5oz 100% Cotton Kuroki Mills double black selvedge. Wash inside out with dark detergent.',
    tags: ['black denim', 'kuroki', 'slim tapered', 'selvedge', 'okayama'],
    images: [
      { url: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=1000&auto=format&fit=crop', isMain: true, sortOrder: 0 },
      { url: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?q=80&w=1000&auto=format&fit=crop', isMain: false, sortOrder: 1 }
    ],
    variants: [
      { size: '28', color: 'Sulfur Black', price: 5490, stock: 10 },
      { size: '30', color: 'Sulfur Black', price: 5490, stock: 18 },
      { size: '32', color: 'Sulfur Black', price: 5490, stock: 28 },
      { size: '34', color: 'Sulfur Black', price: 5490, stock: 16 },
      { size: '36', color: 'Sulfur Black', price: 5490, stock: 12 },
      { size: '38', color: 'Sulfur Black', price: 5490, stock: 6 }
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    title: 'The Shibuya Wide-Leg Rigid',
    slug: 'shibuya-wide-leg-rigid',
    sku: 'HC-SWR-003',
    description: '15oz heavyweight Kurabo rigid selvedge crafted in an authentic Japanese streetwear silhouette. Relaxed through the seat with a dramatic full straight leg and green-line selvedge edge.',
    basePrice: 5990,
    compareAtPrice: 7490,
    fit: 'baggy',
    productType: 'Jeans',
    gender: 'unisex',
    status: 'active',
    isNew: false,
    rating: 5.0,
    reviewCount: 29,
    fitStyling: [
      'High-rise loose fit with voluminous architectural drape',
      'Heavyweight 15oz drape creates sharp stacking over bulky sneakers',
      'True vintage workwear five-pocket detailing'
    ],
    fabricCare: '15oz Heavyweight 100% Kurabo cotton. Dry clean or cold tub soak only.',
    tags: ['wide leg', 'baggy', 'kurabo', 'heavyweight', '15oz'],
    images: [
      { url: 'https://images.unsplash.com/photo-1555689502-c4b22d76c56f?q=80&w=1000&auto=format&fit=crop', isMain: true, sortOrder: 0 },
      { url: 'https://images.unsplash.com/photo-1604176354204-9268737828e4?q=80&w=1000&auto=format&fit=crop', isMain: false, sortOrder: 1 }
    ],
    variants: [
      { size: '28', color: 'Deep Indigo', price: 5990, stock: 8 },
      { size: '30', color: 'Deep Indigo', price: 5990, stock: 15 },
      { size: '32', color: 'Deep Indigo', price: 5990, stock: 22 },
      { size: '34', color: 'Deep Indigo', price: 5990, stock: 14 },
      { size: '36', color: 'Deep Indigo', price: 5990, stock: 9 },
      { size: '38', color: 'Deep Indigo', price: 5990, stock: 4 }
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    title: 'The Artisan Trucker Jacket — 90s Relaxed Classic',
    slug: 'artisan-trucker-jacket-90s-relaxed',
    sku: 'HC-ATJ-004',
    description: '13oz Candiani Italian washed organic denim. A boxy retro trucker jacket featuring front pleats, twin flap chest pockets, adjustable waist tabs, and solid antiqued brass shank buttons.',
    basePrice: 4490,
    compareAtPrice: 5990,
    fit: 'relaxed',
    productType: 'Jackets',
    gender: 'unisex',
    status: 'active',
    isNew: false,
    rating: 4.9,
    reviewCount: 42,
    fitStyling: [
      'Boxy drop-shoulder cut designed for layering over hoodies',
      'Dual welt hand warmer pockets + deep interior phone pocket',
      'Slight vintage stone washing for immediate broken-in comfort'
    ],
    fabricCare: '13oz 100% Organic Candiani denim. Machine wash cold with like colors.',
    tags: ['trucker jacket', 'candiani', 'denim jacket', 'vintage wash'],
    images: [
      { url: 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?q=80&w=1000&auto=format&fit=crop', isMain: true, sortOrder: 0 },
      { url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=1000&auto=format&fit=crop', isMain: false, sortOrder: 1 }
    ],
    variants: [
      { size: 'S', color: 'Vintage Wash', price: 4490, stock: 14 },
      { size: 'M', color: 'Vintage Wash', price: 4490, stock: 26 },
      { size: 'L', color: 'Vintage Wash', price: 4490, stock: 30 },
      { size: 'XL', color: 'Vintage Wash', price: 4490, stock: 18 }
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  }
];

export async function seedMongoIfEmpty() {
  try {
    const db = await getDb();
    const productsCol = db.collection('products');
    const count = await productsCol.countDocuments();

    if (count === 0) {
      console.log('Seeding initial 4 flagship products to MongoDB Atlas...');
      await productsCol.insertMany(INITIAL_PRODUCTS);
      console.log(' 4 Flagship products seeded successfully!');
    }

    // Seed default users if missing
    const usersCol = db.collection('users');
    const adminUser = await usersCol.findOne({ email: 'admin@hcjeans.com' });
    if (!adminUser) {
      await usersCol.insertOne({
        fullName: 'Harry Admin',
        email: 'admin@hcjeans.com',
        passwordHash: bcrypt.hashSync('admin123', 10),
        role: 'admin',
        phone: '+91 99999 00001',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(' Seeded default admin: admin@hcjeans.com');
    }

    const customerUser = await usersCol.findOne({ email: 'customer@hcjeans.com' });
    if (!customerUser) {
      await usersCol.insertOne({
        fullName: 'Arjun Verma',
        email: 'customer@hcjeans.com',
        passwordHash: bcrypt.hashSync('customer123', 10),
        role: 'customer',
        phone: '+91 98765 43210',
        loyaltyPoints: 500,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(' Seeded default customer: customer@hcjeans.com');
    }

    return true;
  } catch (err) {
    console.error('Mongo seed error:', err.message);
    return false;
  }
}
