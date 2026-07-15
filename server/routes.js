const express = require('express');
const crypto = require('crypto');
const db = require('./db');

const router = express.Router();

// Helper to hash password
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Authentication Middleware
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];
  const session = db.findOne('sessions', s => s.token === token);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }

  const user = db.findOne('users', u => u.id === session.userId);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized: User not found' });
  }

  const { passwordHash, ...safeUser } = user;
  req.user = safeUser;
  next();
}

// --- AUTHENTICATION ROUTES ---

// Register
router.post('/auth/register', (req, res) => {
  const { username, email, password, college, course, semester } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Please provide all required fields' });
  }

  const existingUser = db.findOne('users', u => u.email.toLowerCase() === email.toLowerCase());
  if (existingUser) {
    return res.status(400).json({ error: 'Email already registered' });
  }

  const newUser = db.insert('users', {
    username,
    email: email.toLowerCase(),
    passwordHash: hashPassword(password),
    college: college || 'Fashion Enthusiast',
    course: course || 'General Stylist',
    semester: semester || 'General',
    isTopSeller: false,
    rating: 5.0,
    avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(username)}`
  });

  const token = crypto.randomBytes(32).toString('hex');
  db.insert('sessions', { token, userId: newUser.id });

  const { passwordHash, ...safeUser } = newUser;
  res.status(201).json({ user: safeUser, token });
});

// Login
router.post('/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Please provide email and password' });
  }

  const user = db.findOne('users', u => u.email.toLowerCase() === email.toLowerCase());
  if (!user || user.passwordHash !== hashPassword(password)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  db.insert('sessions', { token, userId: user.id });

  const { passwordHash, ...safeUser } = user;
  res.json({ user: safeUser, token });
});

// Get current user profile
router.get('/auth/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

// --- PRODUCT ROUTES ---

// Get all products (with clothing filters)
router.get('/products', (req, res) => {
  const { category, brand, size, color, gender, search, minPrice, maxPrice } = req.query;

  let products = db.find('products');

  if (category) {
    products = products.filter(p => p.category.toLowerCase() === category.toLowerCase());
  }
  if (brand) {
    products = products.filter(p => p.brand.toLowerCase() === brand.toLowerCase());
  }
  if (size) {
    products = products.filter(p => p.sizes && p.sizes.includes(size.toUpperCase()));
  }
  if (color) {
    products = products.filter(p => p.colors && p.colors.some(c => c.toLowerCase() === color.toLowerCase()));
  }
  if (gender) {
    products = products.filter(p => 
      p.gender.toLowerCase() === gender.toLowerCase() || 
      p.gender.toLowerCase() === 'unisex'
    );
  }
  if (minPrice) {
    products = products.filter(p => p.price >= Number(minPrice));
  }
  if (maxPrice) {
    products = products.filter(p => p.price <= Number(maxPrice));
  }
  if (search) {
    const term = search.toLowerCase();
    products = products.filter(p => 
      p.title.toLowerCase().includes(term) || 
      p.description.toLowerCase().includes(term) ||
      (p.brand && p.brand.toLowerCase().includes(term))
    );
  }

  // Sort by newest
  products.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  res.json(products);
});

// Get product by ID (including designer info & reviews)
router.get('/products/:id', (req, res) => {
  const product = db.findOne('products', p => p.id === Number(req.params.id));
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const seller = db.findOne('users', u => u.id === product.sellerId);
  const reviews = db.find('reviews', r => r.productId === product.id);

  const sellerSafe = seller ? {
    id: seller.id,
    username: seller.username,
    college: seller.college,
    rating: seller.rating,
    isTopSeller: seller.isTopSeller,
    avatar: seller.avatar
  } : null;

  res.json({
    ...product,
    seller: sellerSafe,
    reviews
  });
});

router.post('/products', authenticate, (req, res) => {
  const { title, description, category, brand, sizes, colors, gender, price, mrp, imageUrl, images } = req.body;

  if (!title || !description || !category || price === undefined) {
    return res.status(400).json({ error: 'Please provide all required product details' });
  }

  const sizesArr = Array.isArray(sizes) ? sizes : (sizes ? sizes.split(',').map(s => s.trim().toUpperCase()) : ['M']);
  const colorsArr = Array.isArray(colors) ? colors : (colors ? colors.split(',').map(c => c.trim()) : ['Beige']);
  const parsedPrice = Number(price);
  const parsedMrp = Number(mrp) || parsedPrice;
  const discountPercent = parsedMrp > parsedPrice ? Math.round(((parsedMrp - parsedPrice) / parsedMrp) * 100) : 0;
  const imgUrl = imageUrl || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=400';
  
  let imagesArr = [];
  if (images) {
    imagesArr = Array.isArray(images) ? images : images.split(',').map(img => img.trim());
  } else {
    imagesArr = [imgUrl];
  }

  const newProduct = db.insert('products', {
    sellerId: req.user.id,
    title,
    description,
    type: 'clothing',
    category,
    brand: brand || 'Roadster',
    sizes: sizesArr,
    colors: colorsArr,
    gender: gender || 'Unisex',
    price: parsedPrice,
    mrp: parsedMrp,
    discount: discountPercent,
    imageUrl: imgUrl,
    images: imagesArr,
    reviewsCount: 0,
    averageRating: 0
  });

  res.status(201).json(newProduct);
});

// Delete product
router.delete('/products/:id', authenticate, (req, res) => {
  const product = db.findOne('products', p => p.id === Number(req.params.id));
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  if (product.sellerId !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden: You do not own this listing' });
  }

  db.delete('products', product.id);
  res.json({ message: 'Product listing deleted successfully' });
});

// --- ORDER ROUTES ---

// Create Order (Checkout)
router.post('/orders', authenticate, (req, res) => {
  const { productId, size, color, shippingAddress, contactNumber } = req.body;

  if (!productId || !shippingAddress || !contactNumber) {
    return res.status(400).json({ error: 'Please fill in shipping and contact details' });
  }

  const product = db.findOne('products', p => p.id === Number(productId));
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const order = db.insert('orders', {
    buyerId: req.user.id,
    buyerName: req.user.username,
    sellerId: product.sellerId,
    productId: product.id,
    productTitle: product.title,
    productImage: product.imageUrl,
    productType: 'clothing',
    price: product.price,
    selectedSize: size || 'M',
    selectedColor: color || 'Beige',
    shippingAddress,
    contactNumber,
    status: 'pending'
  });

  // Create automatic chat message from system/buyer initiating checkout
  db.insert('chats', {
    senderId: req.user.id,
    receiverId: product.sellerId,
    message: `Hello! I just placed an order for the "${product.title}" in Size: ${size || 'M'}, Color: ${color || 'Beige'}. Please ship it to my address!`,
    read: false
  });

  res.status(201).json(order);
});

// Get purchases (orders I placed)
router.get('/orders/buyer', authenticate, (req, res) => {
  const orders = db.find('orders', o => o.buyerId === req.user.id);
  res.json(orders);
});

// Get sales (orders placed for my products)
router.get('/orders/seller', authenticate, (req, res) => {
  const orders = db.find('orders', o => o.sellerId === req.user.id);
  res.json(orders);
});

// Update order status
router.put('/orders/:id/status', authenticate, (req, res) => {
  const { status } = req.body;
  if (!['pending', 'shipped', 'completed', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }

  const order = db.findOne('orders', o => o.id === Number(req.params.id));
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  if (order.sellerId !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden: Only the designer/shop owner can update order status' });
  }

  const updatedOrder = db.update('orders', order.id, { status });
  res.json(updatedOrder);
});

// --- CHAT ROUTES ---

// Get active conversations
router.get('/chats/conversations', authenticate, (req, res) => {
  const chats = db.find('chats', c => c.senderId === req.user.id || c.receiverId === req.user.id);
  
  const chatPartnerIds = new Set();
  chats.forEach(c => {
    if (c.senderId !== req.user.id) chatPartnerIds.add(c.senderId);
    if (c.receiverId !== req.user.id) chatPartnerIds.add(c.receiverId);
  });

  const conversations = [];
  chatPartnerIds.forEach(partnerId => {
    const partner = db.findOne('users', u => u.id === partnerId);
    if (partner) {
      const partnerMessages = chats.filter(c => 
        (c.senderId === req.user.id && c.receiverId === partnerId) ||
        (c.senderId === partnerId && c.receiverId === req.user.id)
      );
      partnerMessages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      const latestMessage = partnerMessages[0];

      conversations.push({
        id: partner.id,
        username: partner.username,
        avatar: partner.avatar,
        college: partner.college,
        lastMessage: latestMessage ? latestMessage.message : '',
        lastMessageTime: latestMessage ? latestMessage.timestamp : '',
        unread: latestMessage ? (!latestMessage.read && latestMessage.senderId === partner.id) : false
      });
    }
  });

  conversations.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
  res.json(conversations);
});

// Get messages between current user and partner user
router.get('/chats/:partnerId', authenticate, (req, res) => {
  const partnerId = Number(req.params.partnerId);
  
  const messages = db.find('chats', c => 
    (c.senderId === req.user.id && c.receiverId === partnerId) ||
    (c.senderId === partnerId && c.receiverId === req.user.id)
  );

  const unreadMessages = messages.filter(c => c.senderId === partnerId && !c.read);
  unreadMessages.forEach(m => {
    db.update('chats', m.id, { read: true });
  });

  messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  res.json(messages);
});

// Send message
router.post('/chats', authenticate, (req, res) => {
  const { receiverId, message } = req.body;

  if (!receiverId || !message) {
    return res.status(400).json({ error: 'Invalid chat payload' });
  }

  const receiver = db.findOne('users', u => u.id === Number(receiverId));
  if (!receiver) {
    return res.status(404).json({ error: 'Receiver user not found' });
  }

  const newChat = db.insert('chats', {
    senderId: req.user.id,
    receiverId: Number(receiverId),
    message,
    read: false
  });

  res.status(201).json(newChat);
});

// --- AI OUTFIT / STYLE RECOMMENDATION ROUTE ---

router.get('/recommendations', (req, res) => {
  const { userId } = req.query;
  const products = db.find('products');

  if (!userId) {
    const defaultRecs = products
      .sort((a, b) => b.averageRating - a.averageRating)
      .slice(0, 6);
    return res.json(defaultRecs);
  }

  const user = db.findOne('users', u => u.id === Number(userId));
  if (!user) {
    return res.json(products.slice(0, 6));
  }

  const scored = products.map(product => {
    let score = 0;
    score += (product.averageRating || 0);

    if (user.course && user.course.toLowerCase().includes('styling')) {
      if (product.brand === 'HRX by Hrithik Roshan') score += 3;
    }
    if (product.category === 'Tops') score += 1.5;

    return { ...product, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const recommendations = scored.map(({ score, ...p }) => p).slice(0, 6);
  res.json(recommendations);
});

// --- REVIEWS ROUTE ---

router.post('/reviews', authenticate, (req, res) => {
  const { productId, rating, comment } = req.body;

  if (!productId || !rating || !comment) {
    return res.status(400).json({ error: 'Please provide rating and comment' });
  }

  const product = db.findOne('products', p => p.id === Number(productId));
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const review = db.insert('reviews', {
    productId: product.id,
    userId: req.user.id,
    username: req.user.username,
    rating: Number(rating),
    comment
  });

  const reviews = db.find('reviews', r => r.productId === product.id);
  const reviewsCount = reviews.length;
  const averageRating = Number((reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviewsCount).toFixed(1));

  db.update('products', product.id, {
    reviewsCount,
    averageRating
  });

  const sellerProducts = db.find('products', p => p.sellerId === product.sellerId);
  const sellerRatedProducts = sellerProducts.filter(p => p.reviewsCount > 0);
  
  if (sellerRatedProducts.length > 0) {
    const totalSellerRating = sellerRatedProducts.reduce((acc, curr) => acc + curr.averageRating, 0);
    const sellerAvgRating = Number((totalSellerRating / sellerRatedProducts.length).toFixed(1));
    const isTopSeller = sellerAvgRating >= 4.5 && sellerRatedProducts.length >= 2;
    
    db.update('users', product.sellerId, {
      rating: sellerAvgRating,
      isTopSeller
    });
  }

  res.status(201).json(review);
});

module.exports = router;
