const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const db = require('./db');
const routes = require('./routes');

const app = reportApp = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Seeding Initial Expanded FashionHub Catalog with Single-Product Multi-Angle & Zoom Galleries
function seedDatabase() {
  const users = db.find('users');
  if (users.length > 0) {
    console.log('Database already has data. Skipping seeder.');
    return;
  }

  console.log('Database is empty. Seeding multiple-image clothing catalog...');

  // 1. Seed Customer / Designer Accounts
  const admin = db.insert('users', {
    username: 'FashionHub_Curator',
    email: 'curator@fashionhub.in',
    passwordHash: crypto.createHash('sha256').update('password123').digest('hex'),
    college: 'Fashion Design Studio',
    course: 'Creative Stylist',
    semester: 'National',
    isTopSeller: true,
    rating: 4.9,
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=FashionHub_Curator'
  });

  const shopper1 = db.insert('users', {
    username: 'AnanyaSharma',
    email: 'ananya@fashion.in',
    passwordHash: crypto.createHash('sha256').update('password123').digest('hex'),
    college: 'Delhi University',
    course: 'B.Com Hons',
    semester: '5th',
    isTopSeller: false,
    rating: 4.7,
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=AnanyaSharma'
  });

  const shopper2 = db.insert('users', {
    username: 'RahulVarma',
    email: 'rahul@varma.in',
    passwordHash: crypto.createHash('sha256').update('password123').digest('hex'),
    college: 'IIT Bombay',
    course: 'Computer Science',
    semester: '7th',
    isTopSeller: false,
    rating: 4.5,
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=RahulVarma'
  });

  // 2. Seed Products with Multiple Images (Representing views of the single product)
  const prod1 = db.insert('products', {
    sellerId: admin.id,
    title: 'Men Solid Cotton Casual Roadster Shirt',
    description: 'A classic Roadster casual shirt woven from 100% organic breathable cotton. Features a spread collar, curved hemline, button placket, and single patch pocket. Ideal for smart-casual wear.',
    type: 'clothing',
    category: 'Tops',
    brand: 'Roadster',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Washed Blue', 'Olive Green', 'Crimson Red'],
    gender: 'Men',
    price: 799,
    mrp: 1999,
    discount: 60,
    imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=400',
    images: [
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=400', // Front View
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=400#zoom=2', // Macro Fabric Weave Close-up
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=400#zoom=1.4'  // Collar & Neckline Focus
    ],
    reviewsCount: 4,
    averageRating: 4.5
  });

  const prod2 = db.insert('products', {
    sellerId: admin.id,
    title: 'Men Rapid-Dry Breathable Sports T-shirt',
    description: 'Designed by HRX by Hrithik Roshan. Engineered with Rapid-Dry and Anti-Microbial sweat-wicking technology to keep you dry and comfortable. Features a slim fit with reflecting branding.',
    type: 'clothing',
    category: 'Tops',
    brand: 'HRX by Hrithik Roshan',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Midnight Black', 'Slate Grey', 'Electric Yellow'],
    gender: 'Men',
    price: 499,
    mrp: 999,
    discount: 50,
    imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=400',
    images: [
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=400', // Model Front view
      'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=400', // Model Back view of the same shirt
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=400#zoom=2' // Fabric Weave zoom
    ],
    reviewsCount: 5,
    averageRating: 4.7
  });

  const prod3 = db.insert('products', {
    sellerId: admin.id,
    title: 'Women Indigo Block-Printed A-Line Kurta',
    description: 'Woven A-line ethnic Kurta from Anouk. Beautifully hand block-printed indigo patterns, mock keyhole neck, three-quarter sleeves, and straight side slits. Crafted in soft-drape cotton.',
    type: 'clothing',
    category: 'Tops',
    brand: 'Anouk',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Indigo Blue', 'Teal Green'],
    gender: 'Women',
    price: 699,
    mrp: 1799,
    discount: 61,
    imageUrl: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=400',
    images: [
      'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=400', // Front View
      'https://images.unsplash.com/photo-1608748010899-18f300247112?q=80&w=400', // Macro Print Zoom detail
      'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=400#zoom=1.4'  // Neckline Focus
    ],
    reviewsCount: 3,
    averageRating: 4.6
  });

  const prod4 = db.insert('products', {
    sellerId: admin.id,
    title: 'Men Slim Fit Mid-Rise Clean Stretchable Jeans',
    description: 'Urban stretchable denim jeans from Wrogn. Cut in a modern slim silhouette with mild whiskers. 5-pocket detail with zip fly and button closure. Highly elastic for daily flex.',
    type: 'clothing',
    category: 'Bottoms',
    brand: 'Wrogn',
    sizes: ['M', 'L', 'XL'],
    colors: ['Midnight Black', 'Classic Indigo'],
    gender: 'Men',
    price: 1299,
    mrp: 3299,
    discount: 60,
    imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=400',
    images: [
      'https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=400', // Denim Front layout
      'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=400', // Denim Folded / Back pocket view
      'https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=400#zoom=2'  // Stitching close-up zoom
    ],
    reviewsCount: 2,
    averageRating: 4.4
  });

  const prod5 = db.insert('products', {
    sellerId: admin.id,
    title: 'Men Colorblocked Kangaroo Pocket Sweatshirt',
    description: 'Modern urban wear from Here&Now. Features a beautiful colorblocked print, cozy drawstring hood, kangaroo front pockets, ribbed cuffs, and hem. Warm fleece lining inside.',
    type: 'clothing',
    category: 'Outerwear',
    brand: 'Here&Now',
    sizes: ['M', 'L', 'XL'],
    colors: ['Mustard Yellow', 'Forest Green', 'Navy Blue'],
    gender: 'Unisex',
    price: 899,
    mrp: 2199,
    discount: 59,
    imageUrl: 'https://images.unsplash.com/photo-1611312449412-6cefac5dc3e4?q=80&w=400',
    images: [
      'https://images.unsplash.com/photo-1611312449412-6cefac5dc3e4?q=80&w=400', // Front view
      'https://images.unsplash.com/photo-1611312449412-6cefac5dc3e4?q=80&w=400#zoom=2', // Knit Macro Zoom
      'https://images.unsplash.com/photo-1611312449412-6cefac5dc3e4?q=80&w=400#zoom=1.4'  // Pocket & Hood detail zoom
    ],
    reviewsCount: 1,
    averageRating: 4.0
  });

  const prod6 = db.insert('products', {
    sellerId: admin.id,
    title: 'Unisex Canvas Travel Laptop Backpack',
    description: 'Minimalist vintage canvas backpack from Mast & Harbour. Includes a secure padded compartment for laptops up to 15.6 inches, padded backstraps, water bottle slots, and magnetic buckles.',
    type: 'clothing',
    category: 'Accessories',
    brand: 'Mast & Harbour',
    sizes: ['One Size'],
    colors: ['Olive Green', 'Charcoal Grey'],
    gender: 'Unisex',
    price: 999,
    mrp: 2499,
    discount: 60,
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=400',
    images: [
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=400', // Front view of bag
      'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?q=80&w=400', // Back view / straps detail of same bag
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=400#zoom=2'  // Metal buckles close-up zoom
    ],
    reviewsCount: 1,
    averageRating: 5.0
  });

  const prod7 = db.insert('products', {
    sellerId: admin.id,
    title: 'Unisex Cushion Breathable Running Shoes',
    description: 'Designed for active jogging and gym training by HRX. Ultra-light mesh knit upper for breathable ventilation. Soft cushioned EVA midsole protects heels during running impacts.',
    type: 'clothing',
    category: 'Accessories',
    brand: 'HRX by Hrithik Roshan',
    sizes: ['7', '8', '9', '10'],
    colors: ['Navy Blue', 'Neon Green', 'Solid Black'],
    gender: 'Unisex',
    price: 1799,
    mrp: 3999,
    discount: 55,
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=400',
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=400', // Side View
      'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?q=80&w=400', // Top mesh view of same red shoe
      'https://images.unsplash.com/photo-1608231387042-66d1773070a5?q=80&w=400'  // Heel sole cushioning view of same red shoe
    ],
    reviewsCount: 2,
    averageRating: 4.8
  });

  // --- NEWLY ADDED CATALOG PRODUCTS ---
  const prod8 = db.insert('products', {
    sellerId: admin.id,
    title: 'Men Slim Fit Checked Casual Shirt',
    description: 'A stylish checked pattern casual shirt by Wrogn. Tailored from 100% fine cotton loops for an elegant drape. Spread collar, double button cuffs, and lightweight weave. Fits like a dream.',
    type: 'clothing',
    category: 'Tops',
    brand: 'Wrogn',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Red Checked', 'Black Checked', 'Navy Checked'],
    gender: 'Men',
    price: 899,
    mrp: 2299,
    discount: 60,
    imageUrl: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?q=80&w=400',
    images: [
      'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?q=80&w=400', // Model Front View
      'https://images.unsplash.com/photo-1598032895397-b9472444bf93?q=80&w=400', // Model Side Profile View
      'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?q=80&w=400#zoom=2' // Macro checks weave close-up zoom
    ],
    reviewsCount: 1,
    averageRating: 4.0
  });

  const prod9 = db.insert('products', {
    sellerId: admin.id,
    title: 'Women Pure Cotton Handblock Printed Saree',
    description: 'An elegant hand block-printed saree by Anouk. Woven in soft mulmul cotton with beautiful floral and geometric patterns. Comes with a matching unstitched blouse fabric.',
    type: 'clothing',
    category: 'Tops',
    brand: 'Anouk',
    sizes: ['One Size'],
    colors: ['Amber Gold', 'Classic Indigo', 'Coral Pink'],
    gender: 'Women',
    price: 1199,
    mrp: 2999,
    discount: 60,
    imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=400',
    images: [
      'https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=400', // Model wear view
      'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=400', // Saree pallu border details
      'https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=400#zoom=2' // Silk weave macro zoom
    ],
    reviewsCount: 2,
    averageRating: 4.8
  });

  const prod10 = db.insert('products', {
    sellerId: admin.id,
    title: 'Women Rapid-Dry High-Rise Gym Joggers',
    description: 'Athletic wear joggers from HRX. Engineered with Rapid-Dry knit technology to maintain freshness through heavy sweat workouts. Features side zip pockets and comfortable ankle cuffs.',
    type: 'clothing',
    category: 'Bottoms',
    brand: 'HRX by Hrithik Roshan',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Olive Green', 'Slate Grey'],
    gender: 'Women',
    price: 799,
    mrp: 1999,
    discount: 60,
    imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=400',
    images: [
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=400', // Front fit view
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=400#zoom=2', // Knit weave macro zoom
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=400#zoom=1.4'  // Waistband & drawstring details
    ],
    reviewsCount: 3,
    averageRating: 4.3
  });

  const prod11 = db.insert('products', {
    sellerId: admin.id,
    title: 'Unisex Polarized Classic Sunglasses',
    description: 'Chic polarized sunglasses from Mast & Harbour. Protects 100% against UV radiation. Styled in lightweight polycarbonate frames with soft anti-scratch dark lenses.',
    type: 'clothing',
    category: 'Accessories',
    brand: 'Mast & Harbour',
    sizes: ['One Size'],
    colors: ['Onyx Black', 'Tortoiseshell Brown'],
    gender: 'Unisex',
    price: 599,
    mrp: 1499,
    discount: 60,
    imageUrl: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=400',
    images: [
      'https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=400', // Glass layout front
      'https://images.unsplash.com/photo-1572635196237-14b3f281503f?q=80&w=400', // Detail lens view of matching dark sunglasses
      'https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=400#zoom=2' // Frame rim macro close-up
    ],
    reviewsCount: 1,
    averageRating: 5.0
  });

  const prod12 = db.insert('products', {
    sellerId: admin.id,
    title: 'Women Ribbed Knit High-Neck Crop Top',
    description: 'A stylish ribbed crop top from Here&Now. Knitted in premium viscose blend yarn with standard high neck and fitted silhouette. Goes beautifully with mid-rise denim.',
    type: 'clothing',
    category: 'Tops',
    brand: 'Here&Now',
    sizes: ['XS', 'S', 'M', 'L'],
    colors: ['Beige Cream', 'Charcoal Black', 'Vivid Coral'],
    gender: 'Women',
    price: 399,
    mrp: 999,
    discount: 60,
    imageUrl: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=400',
    images: [
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=400', // Front View
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=400#zoom=2', // Ribbed Knit macro details
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=400#zoom=1.4'  // Hemline & stitch focus
    ],
    reviewsCount: 2,
    averageRating: 4.1
  });

  const prod13 = db.insert('products', {
    sellerId: admin.id,
    title: 'Women Printed Straight Kurta & Trousers Set',
    description: 'A complete designer set by Anouk. Woven straight fit cotton Kurta with gold block print details, round neck, and matched solid cropped trousers with pockets.',
    type: 'clothing',
    category: 'Tops',
    brand: 'Anouk',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Mint Green', 'Mustard Gold'],
    gender: 'Women',
    price: 999,
    mrp: 2499,
    discount: 60,
    imageUrl: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=400',
    images: [
      'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=400', // Front model set view
      'https://images.unsplash.com/photo-1610030470208-c3018e4703a8?q=80&w=400', // Fabric print close-up
      'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=400#zoom=2' // Button & stitch macro details
    ],
    reviewsCount: 3,
    averageRating: 4.6
  });

  // 3. Seed Reviews
  db.insert('reviews', { productId: prod1.id, userId: shopper1.id, username: shopper1.username, rating: 5, comment: 'Fits perfectly, cotton is very light. Roadster never disappoints!' });
  db.insert('reviews', { productId: prod1.id, userId: shopper2.id, username: shopper2.username, rating: 4, comment: 'Good casual wear. The olive color is slightly darker than the photo.' });
  
  db.insert('reviews', { productId: prod2.id, userId: shopper1.id, username: shopper1.username, rating: 5, comment: 'Amazing rapid-dry fit! Passed my running trials wearing this.' });
  db.insert('reviews', { productId: prod2.id, userId: shopper2.id, username: shopper2.username, rating: 4, comment: 'Nice sweat-wicking shirt. Fit is athletic.' });

  db.insert('reviews', { productId: prod3.id, userId: shopper1.id, username: shopper1.username, rating: 5, comment: 'Lovely block print design. Curve fits comfortably.' });
  db.insert('reviews', { productId: prod4.id, userId: shopper2.id, username: shopper2.username, rating: 4, comment: 'Wrogn jeans stretch really well. Best for daily college commute.' });
  db.insert('reviews', { productId: prod7.id, userId: shopper1.id, username: shopper1.username, rating: 5, comment: 'Extremely lightweight. Feels like running on clouds.' });

  db.insert('reviews', { productId: prod9.id, userId: shopper1.id, username: shopper1.username, rating: 5, comment: 'Beautiful hand block design. Got many compliments at the event!' });
  db.insert('reviews', { productId: prod10.id, userId: shopper2.id, username: shopper2.username, rating: 4, comment: 'Soft stretch waistband. Perfect for squats.' });
  db.insert('reviews', { productId: prod13.id, userId: shopper1.id, username: shopper1.username, rating: 5, comment: 'Fabric is cool cotton, perfect for Bangalore heat!' });

  // 4. Seed Chat Messages
  db.insert('chats', { senderId: shopper1.id, receiverId: admin.id, message: 'Hi! Is the Kurta by Anouk available in Teal Green in size L? It is showing out of stock.', read: true });
  db.insert('chats', { senderId: admin.id, receiverId: shopper1.id, message: 'Namaste Ananya! Yes, we have a restock scheduled this Friday. Keep it in your bag!', read: false });

  console.log('Seeding completed successfully!');
}

seedDatabase();

// Mount Routes
app.use('/api', routes);

// Serve static client assets in production
app.use(express.static(path.join(__dirname, '../client/dist')));

// SPA Wildcard fallback to serve frontend App
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`FashionHub server running on port ${PORT}`);
});
