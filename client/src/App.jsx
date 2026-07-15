import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, ShoppingCart, User, MessageSquare, PlusCircle, LogOut, Sun, Moon, 
  Star, Tag, BookOpen, Layers, ChevronRight, Filter, ArrowLeft, 
  Send, Trash2, CheckCircle2, MapPin, Phone, ShoppingBag, Heart,
  Award, AlertCircle, Calendar, Plus, X, Sparkles, HelpCircle, Ticket
} from 'lucide-react';

const API_URL = '/api';

export default function App() {
  // Navigation & Core State
  const [page, setPage] = useState('home');
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [selectedPartnerId, setSelectedPartnerId] = useState(null);
  
  // Theme State
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  
  // User Authentication State
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  
  // Cart & Wishlist State
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });
  const [wishlist, setWishlist] = useState(() => {
    const savedWish = localStorage.getItem('wishlist');
    return savedWish ? JSON.parse(savedWish) : [];
  });
  
  // Coupons & Promo Codes
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  
  // Pincode check
  const [pincodeInput, setPincodeInput] = useState('');
  const [pincodeResult, setPincodeResult] = useState(null);
  const [checkingPincode, setCheckingPincode] = useState(false);
  
  // Marketplace Data
  const [products, setProducts] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  
  // Product details
  const [productDetails, setProductDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [selectedSize, setSelectedSize] = useState('M');
  const [selectedColor, setSelectedColor] = useState('');
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  
  // Filtering States
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [filterBrand, setFilterBrand] = useState('');
  const [filterSize, setFilterSize] = useState('');
  const [filterColor, setFilterColor] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [filterMinPrice, setFilterMinPrice] = useState('');
  const [filterMaxPrice, setFilterMaxPrice] = useState('');
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  
  // Dashboard & Checkout
  const [purchases, setPurchases] = useState([]);
  const [sales, setSales] = useState([]);
  const [checkoutForm, setCheckoutForm] = useState({ shippingAddress: '', contactNumber: '' });
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [checkoutExpress, setCheckoutExpress] = useState(false);
  const [checkoutGiftWrap, setCheckoutGiftWrap] = useState(false);
  
  // Chat States
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [chatMessageText, setChatMessageText] = useState('');
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  
  // Forms
  const [authForm, setAuthForm] = useState({
    username: '', email: '', password: '', college: '', course: '', semester: '1st', isLogin: true
  });
  const [uploadForm, setUploadForm] = useState({
    title: '', description: '', category: 'Tops', brand: '', sizes: 'S, M, L, XL', colors: 'Beige, Black, Grey', gender: 'Unisex', price: '', mrp: '', imageUrl: '', images: ''
  });
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [messageError, setMessageError] = useState('');
  const [messageSuccess, setMessageSuccess] = useState('');
  
  // Fit Predictor Modal State
  const [showFitPredictor, setShowFitPredictor] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [fitInput, setFitInput] = useState({ height: '175', weight: '70', fitPreference: 'regular' });
  const [fitResult, setFitResult] = useState(null);

  // Chat message container scroll ref
  const chatEndRef = useRef(null);

  // Sync theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Sync cart to localStorage
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  // Sync wishlist to localStorage
  useEffect(() => {
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  // Authenticate current user on startup
  useEffect(() => {
    if (token) {
      fetchUser();
    }
  }, [token]);

  // Fetch products & recommendations
  useEffect(() => {
    fetchProducts();
  }, [activeCategory]);

  useEffect(() => {
    fetchRecommendations();
  }, [user]);

  // Chat conversation polling & notifications
  useEffect(() => {
    if (token && user) {
      fetchConversations();
      const interval = setInterval(() => {
        fetchConversations();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [token, user]);

  // Messages polling when active
  useEffect(() => {
    if (token && selectedPartnerId) {
      fetchMessages(selectedPartnerId);
      const interval = setInterval(() => {
        fetchMessages(selectedPartnerId);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [token, selectedPartnerId]);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // --- API SERVICE HELPER ---
  const request = async (url, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_URL}${url}`, { ...options, headers });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }
      return data;
    } catch (err) {
      console.error('API Error:', err.message);
      throw err;
    }
  };

  // --- ACTIONS & HANDLERS ---
  const fetchUser = async () => {
    try {
      const data = await request('/auth/me');
      setUser(data.user);
    } catch (err) {
      handleLogout();
    }
  };

  const fetchProducts = async (filtersOverride = null) => {
    setLoadingProducts(true);
    try {
      let query = '?';
      if (activeCategory !== 'All') query += `category=${encodeURIComponent(activeCategory)}&`;
      if (searchQuery) query += `search=${encodeURIComponent(searchQuery)}&`;
      
      const filters = filtersOverride || { filterBrand, filterSize, filterColor, filterGender, filterMinPrice, filterMaxPrice };
      if (filters.filterBrand) query += `brand=${encodeURIComponent(filters.filterBrand)}&`;
      if (filters.filterSize) query += `size=${encodeURIComponent(filters.filterSize)}&`;
      if (filters.filterColor) query += `color=${encodeURIComponent(filters.filterColor)}&`;
      if (filters.filterGender) query += `gender=${encodeURIComponent(filters.filterGender)}&`;
      if (filters.filterMinPrice) query += `minPrice=${filters.filterMinPrice}&`;
      if (filters.filterMaxPrice) query += `maxPrice=${filters.filterMaxPrice}&`;

      const data = await request(`/products${query}`);
      setProducts(data);
    } catch (err) {
      showTemporaryMessage(err.message, 'error');
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const data = await request(`/recommendations${user ? `?userId=${user.id}` : ''}`);
      setRecommendations(data);
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
    }
  };

  const fetchProductDetails = async (id) => {
    setLoadingDetails(true);
    setPincodeResult(null);
    setPincodeInput('');
    setActiveImageIndex(0);
    try {
      const data = await request(`/products/${id}`);
      setProductDetails(data);
      if (data.sizes && data.sizes.length > 0) {
        setSelectedSize(data.sizes[0]);
      } else {
        setSelectedSize('M');
      }
      if (data.colors && data.colors.length > 0) {
        setSelectedColor(data.colors[0]);
      } else {
        setSelectedColor('');
      }
    } catch (err) {
      showTemporaryMessage('Failed to load product details.', 'error');
      setPage('home');
    } finally {
      setLoadingDetails(false);
    }
  };

  const fetchDashboardData = async () => {
    if (!token) return;
    setLoadingDashboard(true);
    try {
      const pData = await request('/orders/buyer');
      const sData = await request('/orders/seller');
      setPurchases(pData);
      setSales(sData);
    } catch (err) {
      showTemporaryMessage('Failed to load order history.', 'error');
    } finally {
      setLoadingDashboard(false);
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    try {
      let data;
      if (authForm.isLogin) {
        data = await request('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email: authForm.email, password: authForm.password })
        });
      } else {
        data = await request('/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            username: authForm.username,
            email: authForm.email,
            password: authForm.password,
            college: authForm.college,
            course: authForm.course,
            semester: authForm.semester
          })
        });
      }
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      showTemporaryMessage(authForm.isLogin ? 'Logged in successfully!' : 'Registered successfully!', 'success');
      setPage('home');
      setAuthForm({ username: '', email: '', password: '', college: '', course: '', semester: '1st', isLogin: true });
    } catch (err) {
      showTemporaryMessage(err.message, 'error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setPage('home');
    showTemporaryMessage('Logged out successfully.', 'success');
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...uploadForm,
        price: Number(uploadForm.price),
        mrp: Number(uploadForm.mrp) || Number(uploadForm.price)
      };
      await request('/products', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      showTemporaryMessage('Product published successfully!', 'success');
      setPage('home');
      fetchProducts();
      setUploadForm({
        title: '', description: '', category: 'Tops', brand: '', sizes: 'S, M, L, XL', colors: 'Beige, Black, Grey', gender: 'Unisex', price: '', mrp: '', imageUrl: '', images: ''
      });
    } catch (err) {
      showTemporaryMessage(err.message, 'error');
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;
    try {
      await request(`/products/${productId}`, { method: 'DELETE' });
      showTemporaryMessage('Listing deleted successfully', 'success');
      fetchProducts();
      if (page === 'product-details') {
        setPage('home');
      }
    } catch (err) {
      showTemporaryMessage(err.message, 'error');
    }
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;
    try {
      for (const item of cart) {
        // Send actual discounted price if coupons are applied
        const orderPrice = appliedCoupon ? calculateItemDiscountedPrice(item) : item.price;
        await request('/orders', {
          method: 'POST',
          body: JSON.stringify({
            productId: item.id,
            size: item.selectedSize || 'M',
            color: item.selectedColor || 'Default',
            shippingAddress: checkoutForm.shippingAddress,
            contactNumber: checkoutForm.contactNumber
          })
        });
      }
      setCart([]);
      setAppliedCoupon(null);
      setCheckoutForm({ shippingAddress: '', contactNumber: '' });
      showTemporaryMessage('Order placed! Shipments are details inside chat.', 'success');
      setPage('dashboard');
      fetchDashboardData();
    } catch (err) {
      showTemporaryMessage(err.message, 'error');
    }
  };

  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      await request(`/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      showTemporaryMessage(`Order marked as ${status}!`, 'success');
      fetchDashboardData();
    } catch (err) {
      showTemporaryMessage(err.message, 'error');
    }
  };

  const fetchConversations = async () => {
    try {
      const data = await request('/chats/conversations');
      setConversations(data);
      const totalUnread = data.reduce((acc, curr) => acc + (curr.unread ? 1 : 0), 0);
      setUnreadNotifications(totalUnread);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMessages = async (partnerId) => {
    try {
      const data = await request(`/chats/${partnerId}`);
      setMessages(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatMessageText.trim()) return;
    try {
      const newMsg = await request('/chats', {
        method: 'POST',
        body: JSON.stringify({
          receiverId: selectedPartnerId,
          message: chatMessageText.trim()
        })
      });
      setMessages(prev => [...prev, newMsg]);
      setChatMessageText('');
      fetchConversations();
    } catch (err) {
      showTemporaryMessage(err.message, 'error');
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    try {
      await request('/reviews', {
        method: 'POST',
        body: JSON.stringify({
          productId: selectedProductId,
          rating: Number(reviewForm.rating),
          comment: reviewForm.comment
        })
      });
      showTemporaryMessage('Review posted successfully!', 'success');
      setReviewForm({ rating: 5, comment: '' });
      fetchProductDetails(selectedProductId);
      fetchProducts();
    } catch (err) {
      showTemporaryMessage(err.message, 'error');
    }
  };

  // --- STYLE SIZE PREDICTOR LOGIC ---
  const calculateFitSize = (e) => {
    e.preventDefault();
    const h = Number(fitInput.height);
    const w = Number(fitInput.weight);
    const pref = fitInput.fitPreference;

    if (!h || !w) return;

    let base = 'M';
    if (h < 165 && w < 60) {
      base = 'S';
    } else if (h < 178 && w < 75) {
      base = 'M';
    } else if (h < 188 && w < 90) {
      base = 'L';
    } else {
      base = 'XL';
    }

    const sizesArr = ['S', 'M', 'L', 'XL'];
    let idx = sizesArr.indexOf(base);
    if (pref === 'oversized' && idx < 3) {
      idx += 1;
    } else if (pref === 'tight' && idx > 0) {
      idx -= 1;
    }
    
    const recommended = sizesArr[idx];
    setFitResult(recommended);
    setSelectedSize(recommended);
  };

  // --- COUPOUN CODE APPLICATION ---
  const handleApplyCoupon = (e) => {
    e.preventDefault();
    const code = couponInput.trim().toUpperCase();
    if (code === 'AJIO50') {
      setAppliedCoupon({ code, discountPercent: 50, description: 'Flat 50% discount on all items' });
      showTemporaryMessage('AJIO50 Coupon applied! 50% Off.', 'success');
    } else if (code === 'MYNTRA300') {
      const cartTotal = cart.reduce((acc, item) => acc + item.price, 0);
      if (cartTotal < 999) {
        showTemporaryMessage('MYNTRA300 coupon requires minimum purchase of ₹999!', 'error');
        return;
      }
      setAppliedCoupon({ code, discountAmount: 300, description: 'Flat ₹300 discount on cart values above ₹999' });
      showTemporaryMessage('MYNTRA300 Coupon applied! ₹300 Off.', 'success');
    } else {
      showTemporaryMessage('Invalid coupon code!', 'error');
    }
    setCouponInput('');
  };

  const calculateItemDiscountedPrice = (item) => {
    if (!appliedCoupon) return item.price;
    if (appliedCoupon.discountPercent) {
      return Math.round(item.price * (1 - appliedCoupon.discountPercent / 100));
    }
    return item.price; // flat discount applied at subtotal level
  };

  const calculateCartSubtotal = () => {
    return cart.reduce((acc, item) => acc + item.price, 0);
  };

  const calculateCartTotalFinal = () => {
    const sub = calculateCartSubtotal();
    if (!appliedCoupon) return sub;
    if (appliedCoupon.discountPercent) {
      return Math.round(sub * (1 - appliedCoupon.discountPercent / 100));
    }
    if (appliedCoupon.discountAmount) {
      return Math.max(0, sub - appliedCoupon.discountAmount);
    }
    return sub;
  };

  const calculateCheckoutFinalTotal = () => {
    let base = calculateCartTotalFinal();
    if (checkoutExpress) base += 49;
    if (checkoutGiftWrap) base += 30;
    return base;
  };

  // --- PINCODE ESTIMATOR ---
  const checkDeliveryPincode = (e) => {
    e.preventDefault();
    if (pincodeInput.length !== 6 || isNaN(pincodeInput)) {
      showTemporaryMessage('Please enter a valid 6-digit Indian Pincode', 'error');
      return;
    }
    setCheckingPincode(true);
    setTimeout(() => {
      setCheckingPincode(false);
      setPincodeResult({
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' }),
        cod: true
      });
    }, 1200);
  };

  // --- CART & WISHLIST MANAGEMENT ---
  const addToCart = (product) => {
    const itemToAdd = {
      ...product,
      selectedSize,
      selectedColor: selectedColor || (product.colors && product.colors[0]) || 'Default'
    };
    if (cart.some(item => item.id === product.id && item.selectedSize === selectedSize && item.selectedColor === itemToAdd.selectedColor)) {
      showTemporaryMessage('Item already in Bag!', 'error');
      return;
    }
    setCart(prev => [...prev, itemToAdd]);
    showTemporaryMessage('Added to Shopping Bag!', 'success');
  };

  const toggleWishlist = (product) => {
    const isWish = wishlist.some(item => item.id === product.id);
    if (isWish) {
      setWishlist(prev => prev.filter(item => item.id !== product.id));
      showTemporaryMessage('Removed from Wishlist', 'success');
    } else {
      setWishlist(prev => [...prev, product]);
      showTemporaryMessage('Added to Wishlist!', 'success');
    }
  };

  const showTemporaryMessage = (msg, type) => {
    if (type === 'success') {
      setMessageSuccess(msg);
      setTimeout(() => setMessageSuccess(''), 4000);
    } else {
      setMessageError(msg);
      setTimeout(() => setMessageError(''), 4000);
    }
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
    showTemporaryMessage('Removed from Bag', 'success');
  };

  // Navigation utilities
  const openProduct = (id) => {
    setSelectedProductId(id);
    fetchProductDetails(id);
    setPage('product-details');
  };

  const openChatWith = (partnerId) => {
    if (!token) {
      showTemporaryMessage('Please login to inquire from stylists', 'error');
      setPage('auth');
      return;
    }
    setSelectedPartnerId(partnerId);
    fetchMessages(partnerId);
    setPage('chat');
  };

  const applyAdvancedFilters = (e) => {
    e.preventDefault();
    setShowFiltersModal(false);
    fetchProducts();
  };

  const clearAdvancedFilters = () => {
    setFilterBrand('');
    setFilterSize('');
    setFilterColor('');
    setFilterGender('');
    setFilterMinPrice('');
    setFilterMaxPrice('');
    setShowFiltersModal(false);
    fetchProducts({
      filterBrand: '', filterSize: '', filterColor: '', filterGender: '', filterMinPrice: '', filterMaxPrice: ''
    });
  };

  const categories = ['All', 'Tops', 'Bottoms', 'Outerwear', 'Accessories'];

  const getZoomStyle = (url) => {
    if (!url) return { width: '100%', height: '100%', objectFit: 'cover' };
    const match = url.match(/#zoom=([0-9.]+)/);
    if (match) {
      const scale = match[1];
      return {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        transform: `scale(${scale})`,
        transformOrigin: 'center center',
        transition: 'transform 0.3s ease'
      };
    }
    return {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      transition: 'transform 0.3s ease'
    };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      
      {/* Top Notification Promo Strip */}
      <div style={{
        background: 'var(--primary)', color: '#ffffff', fontSize: '0.75rem', fontWeight: 700,
        letterSpacing: '0.12em', textTransform: 'uppercase', padding: '8px 0', textAlign: 'center'
      }}>
        🔥 WARDROBE UPDATE: FLAT 50% OFF ON NEW SEASON APPAREL — USE CODE: <span style={{ textDecoration: 'underline', border: '1px dashed #ffffff', padding: '2px 6px', margin: '0 4px' }}>AJIO50</span>
      </div>

      {/* Toast Messages */}
      {messageSuccess && (
        <div style={{
          position: 'fixed', top: '48px', right: '24px', zIndex: 1000,
          background: 'var(--text-main)', color: 'var(--background)',
          padding: '16px 24px', borderRadius: 'var(--radius-sm)',
          boxShadow: 'var(--shadow-md)', display: 'flex', alignItems: 'center', gap: '8px',
          animation: 'fadeInSlide 0.3s cubic-bezier(0.25,0.8,0.25,1)'
        }}>
          <CheckCircle2 size={16} />
          <span style={{ fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '0.75rem' }}>{messageSuccess}</span>
        </div>
      )}
      
      {messageError && (
        <div style={{
          position: 'fixed', top: '48px', right: '24px', zIndex: 1000,
          background: '#ef4444', color: '#fff',
          padding: '16px 24px', borderRadius: 'var(--radius-sm)',
          boxShadow: 'var(--shadow-md)', display: 'flex', alignItems: 'center', gap: '8px',
          animation: 'fadeInSlide 0.3s cubic-bezier(0.25,0.8,0.25,1)'
        }}>
          <AlertCircle size={16} />
          <span style={{ fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '0.75rem' }}>{messageError}</span>
        </div>
      )}

      {/* HEADER NAVBAR */}
      <header className="glass-card" style={{
        position: 'sticky', top: 0, zIndex: 100, borderLeft: 'none', borderRight: 'none', borderTop: 'none',
        borderRadius: 0, padding: '16px 0', borderBottom: '1px solid var(--card-border)'
      }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          
          {/* Logo */}
          <div onClick={() => { setPage('home'); setSelectedProductId(null); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <span style={{ 
              fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.6rem', 
              letterSpacing: '0.12em', color: 'var(--primary)', textTransform: 'uppercase' 
            }}>FashionHub</span>
          </div>

          {/* Quick Search */}
          <div style={{ flex: 1, maxWidth: '440px', position: 'relative' }} className="flex-center">
            <input 
              type="text" 
              placeholder="Search Roadster, HRX, Kurtas, Sweatshirts..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchProducts()}
              className="form-input"
              style={{ paddingLeft: '40px', borderRadius: 'var(--radius-sm)' }}
            />
            <Search size={16} style={{ position: 'absolute', left: '14px', color: 'var(--text-muted)' }} />
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            
            {/* Theme */}
            <button 
              className="btn btn-secondary btn-icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              style={{ border: 'none', width: '36px', height: '36px' }}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Wishlist Link */}
            <button 
              onClick={() => setPage('wishlist')} 
              className="btn btn-secondary btn-icon"
              style={{ border: 'none', width: '36px', height: '36px', position: 'relative' }}
              title="Wishlist"
            >
              <Heart size={16} color={wishlist.length > 0 ? 'var(--primary)' : 'var(--text-main)'} fill={wishlist.length > 0 ? 'var(--primary)' : 'none'} />
              {wishlist.length > 0 && (
                <span style={{
                  position: 'absolute', top: '0', right: '0', width: '6px', height: '6px',
                  borderRadius: '50%', background: 'var(--primary)'
                }}></span>
              )}
            </button>

            {/* Chat Link */}
            {user && (
              <button 
                onClick={() => { setPage('chat'); fetchConversations(); }} 
                className="btn btn-secondary btn-icon"
                style={{ border: 'none', width: '36px', height: '36px', position: 'relative' }}
                title="Customer Support"
              >
                <MessageSquare size={16} />
                {unreadNotifications > 0 && (
                  <span style={{
                    position: 'absolute', top: '0', right: '0', width: '6px', height: '6px',
                    borderRadius: '50%', background: 'var(--primary)'
                  }}></span>
                )}
              </button>
            )}

            {/* Shopping Bag */}
            <button 
              onClick={() => setPage('cart')} 
              className="btn btn-secondary btn-icon"
              style={{ border: 'none', width: '38px', height: '38px', position: 'relative' }}
              title="Shopping Bag"
            >
              <ShoppingBag size={16} />
              {cart.length > 0 && (
                <span style={{
                  position: 'absolute', top: '-4px', right: '-4px', width: '18px', height: '18px',
                  borderRadius: '50%', background: 'var(--primary)', color: '#fff', fontSize: '0.65rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
                }}>{cart.length}</span>
              )}
            </button>

            {/* Sell/Dashboard */}
            {user && (
              <button onClick={() => { setPage('dashboard'); fetchDashboardData(); }} className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: '0.75rem' }}>
                <span>Seller Dashboard</span>
              </button>
            )}

            {/* Auth */}
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <img 
                  src={user.avatar} 
                  alt={user.username} 
                  style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid var(--primary)' }} 
                />
                <button onClick={handleLogout} className="btn btn-secondary btn-icon" style={{ border: 'none', width: '32px', height: '32px' }} title="Logout">
                  <LogOut size={14} />
                </button>
              </div>
            ) : (
              <button onClick={() => setPage('auth')} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.75rem' }}>
                <span>Login</span>
              </button>
            )}

          </div>

        </div>
      </header>

      {/* MAIN VIEW */}
      <main style={{ flex: 1, padding: '32px 0' }} className="fade-in-slide">
        <div className="container">
          
          {/* HOME PAGE */}
          {page === 'home' && (
            <div>
              {/* Marketing Banner */}
              <div className="glass-card" style={{
                padding: '64px 40px', borderRadius: 'var(--radius-sm)', display: 'flex', 
                alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '32px',
                marginBottom: '40px', background: 'var(--card-bg)', 
                border: '1px solid var(--card-border)'
              }}>
                <div style={{ flex: '1 1 500px' }}>
                  <div className="badge" style={{ background: 'var(--primary-glow)', color: 'var(--text-main)', marginBottom: '16px', fontSize: '0.7rem' }}>Premium Apparel & Wardrobe Essentials</div>
                  <h1 style={{ fontSize: '2.8rem', lineHeight: '1.15', marginBottom: '16px', fontFamily: 'Outfit', color: 'var(--text-main)', fontWeight: 300 }}>
                    Modern Tailoring <br /><span className="serif-font" style={{ fontStyle: 'italic', fontWeight: '400', textTransform: 'none' }}>Flat 50% Off</span>
                  </h1>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px', lineHeight: '1.6', maxWidth: '480px', letterSpacing: '0.01em' }}>
                    Discover authentic Roadster shirts, HRX sportswear, Wrogn denim, and printed cotton Kurtas by Anouk. Woven with organic fibers for premium everyday wear.
                  </p>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={() => { setActiveCategory('Tops'); }} className="btn btn-primary">Browse Tops</button>
                    <button onClick={() => { setActiveCategory('Bottoms'); }} className="btn btn-secondary">Explore Bottoms</button>
                  </div>
                </div>
                
                <div style={{ flex: '1 1 300px', display: 'flex', justifyContent: 'center' }}>
                  <div style={{
                    width: '260px', height: '280px', borderRadius: 'var(--radius-sm)',
                    overflow: 'hidden', border: '1px solid var(--card-border)'
                  }}>
                    <img 
                      src="https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=400" 
                      alt="Featured style" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  </div>
                </div>
              </div>

              {/* Pill & Filter Bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px', borderBottom: '1px solid var(--card-border)', paddingBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      style={{
                        whiteSpace: 'nowrap', padding: '8px 16px', fontSize: '0.75rem',
                        fontWeight: '700', letterSpacing: '0.05em', textTransform: 'uppercase',
                        borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                        border: '1px solid',
                        borderColor: activeCategory === cat ? 'var(--primary)' : 'var(--card-border)',
                        background: activeCategory === cat ? 'var(--primary)' : 'var(--card-bg)',
                        color: activeCategory === cat ? '#fff' : 'var(--text-main)',
                        transition: 'all 0.2s'
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    onClick={() => setShowFiltersModal(true)} 
                    className="btn btn-secondary"
                    style={{ padding: '8px 16px', fontSize: '0.75rem' }}
                  >
                    <Filter size={14} />
                    <span>Sort & Filter</span>
                  </button>
                </div>
              </div>

              {/* Product Grid */}
              <div>
                <h2 style={{ fontFamily: 'Outfit', fontSize: '1.1rem', marginBottom: '20px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Trending Garments
                </h2>

                {loadingProducts ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid var(--card-border)', borderTopColor: 'var(--primary)', animation: 'spin 1s linear infinite' }}></div>
                  </div>
                ) : products.length === 0 ? (
                  <div className="glass-card" style={{ padding: '64px', textAlign: 'center' }}>
                    <AlertCircle size={40} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
                    <h3 style={{ marginBottom: '8px' }}>No styles match search parameters</h3>
                    <p style={{ color: 'var(--text-muted)' }}>Try resetting advanced filters.</p>
                    <button onClick={clearAdvancedFilters} className="btn btn-primary" style={{ marginTop: '16px' }}>Reset Filters</button>
                  </div>
                ) : (
                  <div className="grid-products">
                    {products.map(prod => (
                      <div key={prod.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', position: 'relative' }}>
                        
                        {/* Wishlist Icon */}
                        <button 
                          onClick={() => toggleWishlist(prod)}
                          style={{
                            position: 'absolute', top: '12px', right: '12px', zIndex: 10,
                            background: 'rgba(255,255,255,0.85)', border: 'none', borderRadius: '50%',
                            width: '32px', height: '32px', cursor: 'pointer', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)'
                          }}
                        >
                          <Heart 
                            size={16} 
                            color={wishlist.some(w => w.id === prod.id) ? 'var(--primary)' : '#888'} 
                            fill={wishlist.some(w => w.id === prod.id) ? 'var(--primary)' : 'none'} 
                          />
                        </button>

                        {/* Image */}
                        <div style={{ height: '280px', overflow: 'hidden', position: 'relative' }} onClick={() => openProduct(prod.id)}>
                          <img 
                            src={prod.imageUrl} 
                            alt={prod.title} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }} 
                            className="card-image"
                          />
                          <div style={{ position: 'absolute', bottom: '12px', left: '12px' }}>
                            <span className={`badge badge-${prod.category.toLowerCase()}`}>
                              {prod.category}
                            </span>
                          </div>
                        </div>

                        {/* Details */}
                        <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                          <div onClick={() => openProduct(prod.id)} style={{ cursor: 'pointer' }}>
                            <strong style={{ fontSize: '0.85rem', color: '#282c3f', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{prod.brand}</strong>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                              {prod.title}
                            </span>
                          </div>

                          <div style={{ marginTop: '12px' }}>
                            {/* Price tag in Rupees */}
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '12px' }}>
                              <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#282c3f' }}>₹{prod.price}</span>
                              {prod.mrp && prod.mrp > prod.price && (
                                <>
                                  <span style={{ fontSize: '0.75rem', textDecoration: 'line-through', color: 'var(--text-muted)' }}>₹{prod.mrp}</span>
                                  <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700 }}>({prod.discount}% OFF)</span>
                                </>
                              )}
                            </div>

                            <button onClick={() => openProduct(prod.id)} className="btn btn-secondary" style={{ width: '100%', padding: '10px', fontSize: '0.7rem' }}>
                              Select Size & Buy
                            </button>
                          </div>

                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* PRODUCT DETAILS PAGE */}
          {page === 'product-details' && (
            <div className="fade-in-slide">
              <button 
                onClick={() => { setPage('home'); setProductDetails(null); }} 
                className="btn btn-secondary" 
                style={{ marginBottom: '24px', padding: '8px 16px', fontSize: '0.75rem' }}
              >
                <ArrowLeft size={14} />
                <span>Back to Catalog</span>
              </button>

              {loadingDetails || !productDetails ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid var(--card-border)', borderTopColor: 'var(--primary)', animation: 'spin 1s linear infinite' }}></div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                  
                  <div className="glass-card" style={{ display: 'flex', flexWrap: 'wrap', gap: '40px', padding: '32px', borderRadius: 'var(--radius-sm)' }}>
                    
                    {/* Left: Product Image Gallery */}
                    <div style={{ flex: '1 1 350px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ height: '460px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--card-border)' }}>
                        <img 
                          src={productDetails.images && productDetails.images.length > 0 ? productDetails.images[activeImageIndex] : productDetails.imageUrl} 
                          alt={productDetails.title} 
                          style={getZoomStyle(productDetails.images && productDetails.images.length > 0 ? productDetails.images[activeImageIndex] : productDetails.imageUrl)} 
                        />
                      </div>
                      {/* Image Thumbnails */}
                      {productDetails.images && productDetails.images.length > 1 && (
                        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '6px' }}>
                          {productDetails.images.map((img, idx) => (
                            <div 
                              key={idx}
                              onClick={() => setActiveImageIndex(idx)}
                              style={{
                                width: '60px',
                                height: '75px',
                                borderRadius: 'var(--radius-sm)',
                                overflow: 'hidden',
                                cursor: 'pointer',
                                border: activeImageIndex === idx ? '2px solid var(--primary)' : '1px solid var(--card-border)',
                                transition: 'all 0.15s',
                                opacity: activeImageIndex === idx ? 1 : 0.65
                              }}
                            >
                              <img src={img} alt="thumbnail" style={getZoomStyle(img)} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Right: Selectors & Checkout */}
                    <div style={{ flex: '1 2 480px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      
                      <div>
                        {/* Brand & tags */}
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.9rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#282c3f' }}>{productDetails.brand}</span>
                          <span className={`badge badge-${productDetails.category.toLowerCase()}`}>{productDetails.category}</span>
                          <span className="badge" style={{ background: '#fafafa', color: '#555' }}>{productDetails.gender}</span>
                        </div>

                        {/* Title */}
                        <h1 style={{ fontSize: '1.6rem', marginBottom: '8px', fontWeight: 500, letterSpacing: '0.02em', textTransform: 'none', color: '#282c3f' }}>{productDetails.title}</h1>
                        
                        {/* Rating */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid #eaeaec', padding: '2px 8px', borderRadius: '4px' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{productDetails.averageRating > 0 ? productDetails.averageRating : 'New'}</span>
                            <Star fill="#ffb000" color="#ffb000" size={12} />
                          </div>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>| {productDetails.reviewsCount} customer reviews</span>
                        </div>

                        {/* Pricing details in Rupees */}
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '24px', borderTop: '1px solid #eaeaec', paddingTop: '16px' }}>
                          <span style={{ fontSize: '1.8rem', fontWeight: 800 }}>₹{productDetails.price}</span>
                          {productDetails.mrp && productDetails.mrp > productDetails.price && (
                            <>
                              <span style={{ fontSize: '1rem', textDecoration: 'line-through', color: 'var(--text-muted)' }}>MRP ₹{productDetails.mrp}</span>
                              <span style={{ fontSize: '1.1rem', color: 'var(--primary)', fontWeight: 800 }}>({productDetails.discount}% OFF)</span>
                            </>
                          )}
                        </div>

                        {/* Color Selector */}
                        {productDetails.colors && productDetails.colors.length > 0 && (
                          <div style={{ marginBottom: '20px' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>
                              Select Color: <strong>{selectedColor}</strong>
                            </span>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              {productDetails.colors.map(col => {
                                let hex = '#c5a880';
                                if (col.toLowerCase().includes('black')) hex = '#111111';
                                else if (col.toLowerCase().includes('white') || col.toLowerCase().includes('cream')) hex = '#faf9f6';
                                else if (col.toLowerCase().includes('beige') || col.toLowerCase().includes('tan')) hex = '#dfcbaf';
                                else if (col.toLowerCase().includes('olive') || col.toLowerCase().includes('green')) hex = '#8ea89b';
                                else if (col.toLowerCase().includes('grey') || col.toLowerCase().includes('charcoal')) hex = '#555555';
                                else if (col.toLowerCase().includes('blue') || col.toLowerCase().includes('indigo')) hex = '#6e8597';
                                else if (col.toLowerCase().includes('red') || col.toLowerCase().includes('crimson')) hex = '#c23e3e';
                                else if (col.toLowerCase().includes('yellow') || col.toLowerCase().includes('mustard')) hex = '#e2be55';
                                
                                return (
                                  <span 
                                    key={col}
                                    onClick={() => setSelectedColor(col)}
                                    className="color-circle"
                                    style={{ 
                                      backgroundColor: hex, 
                                      transform: selectedColor === col ? 'scale(1.15)' : 'none',
                                      border: selectedColor === col ? '2px solid var(--primary)' : '1px solid #d4d5d9'
                                    }}
                                    title={col}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Size Selection & Fit predictor */}
                        {productDetails.sizes && productDetails.sizes.length > 0 && (
                          <div style={{ marginBottom: '28px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Select Size: <strong>{selectedSize}</strong>
                              </span>
                              <div style={{ display: 'flex', gap: '12px' }}>
                                <button 
                                  onClick={() => { setFitResult(null); setShowFitPredictor(true); }}
                                  style={{ background: 'none', border: 'none', color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                                >
                                  <Sparkles size={12} />
                                  <span>Fit Predictor</span>
                                </button>
                                <span style={{ color: 'var(--card-border)' }}>|</span>
                                <button 
                                  onClick={() => setShowSizeGuide(true)}
                                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                                >
                                  <BookOpen size={12} />
                                  <span>Size Guide</span>
                                </button>
                              </div>
                            </div>
                            
                            <div style={{ display: 'flex', gap: '10px' }}>
                              {productDetails.sizes.map(sz => (
                                <div 
                                  key={sz} 
                                  onClick={() => setSelectedSize(sz)}
                                  className={`size-box ${selectedSize === sz ? 'active' : ''}`}
                                >
                                  {sz}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Delivery Pincode Checker */}
                        <div style={{ borderTop: '1px solid #eaeaec', paddingTop: '20px', marginBottom: '28px' }}>
                          <h4 style={{ fontSize: '0.75rem', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '10px', color: '#282c3f' }}>Delivery Options</h4>
                          <form onSubmit={checkDeliveryPincode} style={{ display: 'flex', maxWidth: '300px', gap: '8px' }}>
                            <input 
                              type="text" 
                              placeholder="Enter 6-digit Pincode (e.g. 560001)"
                              maxLength="6"
                              value={pincodeInput}
                              onChange={(e) => setPincodeInput(e.target.value)}
                              required
                              className="form-input"
                              style={{ padding: '8px 12px', fontSize: '0.8rem' }}
                            />
                            <button type="submit" className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: '0.7rem' }}>
                              Check
                            </button>
                          </form>
                          
                          {checkingPincode && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>Checking location availability...</div>
                          )}
                          
                          {pincodeResult && (
                            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <div style={{ fontSize: '0.8rem', color: '#111', fontWeight: 'bold' }}>
                                Delivery by: <span style={{ color: '#16a34a' }}>{pincodeResult.date}</span>
                              </div>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                COD (Cash on Delivery) Available • Fast Express Dispatch
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Description */}
                        <div style={{ borderTop: '1px solid #eaeaec', paddingTop: '20px', marginBottom: '24px' }}>
                          <h3 style={{ fontSize: '0.75rem', letterSpacing: '0.05em', marginBottom: '8px', textTransform: 'uppercase' }}>Product Specifications</h3>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.6' }}>{productDetails.description}</p>
                        </div>
                      </div>

                      {/* Add to Cart / Wishlist Actions */}
                      <div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <button 
                            onClick={() => addToCart(productDetails)} 
                            className="btn btn-primary" 
                            style={{ flex: 2, padding: '16px' }}
                          >
                            <ShoppingCart size={16} />
                            <span>Add to Bag</span>
                          </button>
                          
                          <button 
                            onClick={() => toggleWishlist(productDetails)} 
                            className="btn btn-secondary"
                            style={{ flex: 1 }}
                          >
                            <Heart size={16} color="var(--primary)" fill={wishlist.some(w => w.id === productDetails.id) ? 'var(--primary)' : 'none'} />
                            <span>Wishlist</span>
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Similar Products Recommendation Slider */}
                  {products.filter(p => p.category === productDetails.category && p.id !== productDetails.id).length > 0 && (
                    <div className="glass-card" style={{ padding: '32px', borderRadius: 'var(--radius-sm)' }}>
                      <h3 style={{ fontFamily: 'Outfit', fontSize: '0.85rem', letterSpacing: '0.05em', marginBottom: '20px', textTransform: 'uppercase', color: 'var(--text-main)' }}>
                        You Might Also Like
                      </h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
                        {products
                          .filter(p => p.category === productDetails.category && p.id !== productDetails.id)
                          .slice(0, 4)
                          .map(p => (
                            <div 
                              key={p.id} 
                              onClick={() => openProduct(p.id)}
                              style={{ cursor: 'pointer', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-sm)', padding: '12px', background: 'var(--card-bg)', transition: 'all 0.2s' }}
                              className="glass-card"
                            >
                              <div style={{ height: '180px', overflow: 'hidden', borderRadius: 'var(--radius-sm)', marginBottom: '8px' }}>
                                <img src={p.imageUrl} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              </div>
                              <strong style={{ fontSize: '0.75rem', textTransform: 'uppercase', display: 'block', color: 'var(--text-main)' }}>{p.brand}</strong>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</span>
                              <div style={{ fontSize: '0.8rem', fontWeight: 800, marginTop: '4px', color: 'var(--text-main)' }}>₹{p.price}</div>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  )}

                  {/* Reviews & Ratings Summary bar graph panel */}
                  <div className="glass-card" style={{ padding: '32px', borderRadius: 'var(--radius-sm)' }}>
                    
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px', justifyContent: 'space-between', borderBottom: '1px solid var(--card-border)', paddingBottom: '24px', marginBottom: '24px' }}>
                      <div>
                        <h2 style={{ fontFamily: 'Outfit', fontSize: '1.05rem', marginBottom: '8px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Customer Review Feedback</h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
                          <span style={{ fontSize: '2.4rem', fontWeight: 700, fontFamily: 'Outfit' }}>{productDetails.averageRating > 0 ? productDetails.averageRating : 'New'}</span>
                          <div>
                            <div style={{ display: 'flex', gap: '2px', marginBottom: '4px' }}>
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  size={14} 
                                  fill={i < Math.round(productDetails.averageRating) ? "#ffb000" : "none"} 
                                  color={i < Math.round(productDetails.averageRating) ? "#ffb000" : "var(--text-muted)"} 
                                />
                              ))}
                            </div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Based on {productDetails.reviewsCount} reviews</span>
                          </div>
                        </div>
                      </div>

                      <div style={{ flex: '1 1 280px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {[5, 4, 3, 2, 1].map(stars => {
                          const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
                          if (productDetails.reviews) {
                            productDetails.reviews.forEach(r => { if (counts[r.rating] !== undefined) counts[r.rating]++; });
                          }
                          const total = productDetails.reviewsCount || 1;
                          const count = counts[stars] || 0;
                          const pct = Math.round((count / total) * 100);
                          return (
                            <div key={stars} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.75rem' }}>
                              <span style={{ width: '45px', color: 'var(--text-muted)' }}>{stars} Star</span>
                              <div style={{ flex: 1, height: '6px', background: 'var(--card-border)', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{ width: `${pct}%`, height: '100%', background: '#ffb000', borderRadius: '3px' }} />
                              </div>
                              <span style={{ width: '35px', color: 'var(--text-muted)', textAlign: 'right' }}>{pct}%</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    {user ? (
                      <form onSubmit={handleSubmitReview} style={{ marginBottom: '32px', borderBottom: '1px solid var(--card-border)', paddingBottom: '24px' }}>
                        <h4 style={{ fontSize: '0.8rem', marginBottom: '12px' }}>Write a Style Review</h4>
                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '16px' }}>
                          
                          <div style={{ flex: '1 1 200px' }}>
                            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>Rating</label>
                            <select 
                              value={reviewForm.rating} 
                              onChange={(e) => setReviewForm(prev => ({ ...prev, rating: Number(e.target.value) }))}
                              className="form-select"
                            >
                              <option value="5">5 Stars (Perfect Fabric & Fit)</option>
                              <option value="4">4 Stars (Good Quality)</option>
                              <option value="3">3 Stars (Average stretch)</option>
                              <option value="2">2 Stars (Slightly tight collar)</option>
                              <option value="1">1 Star (Disliked materials)</option>
                            </select>
                          </div>
                          
                          <div style={{ flex: '3 1 400px' }}>
                            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>Comment</label>
                            <input 
                              type="text" 
                              placeholder="Review fit and material (e.g. 'Very soft Kurta, colors are vivid!')"
                              value={reviewForm.comment}
                              onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                              required
                              className="form-input"
                            />
                          </div>

                        </div>
                        <button type="submit" className="btn btn-primary" style={{ padding: '10px 20px', fontSize: '0.7rem' }}>Post Review</button>
                      </form>
                    ) : (
                      <div style={{ padding: '16px', background: 'rgba(0,0,0,0.01)', borderRadius: '4px', textAlign: 'center', marginBottom: '24px' }}>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Please <strong style={{ color: 'var(--primary)', cursor: 'pointer' }} onClick={() => setPage('auth')}>login</strong> to write style reviews.</p>
                      </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      {productDetails.reviews && productDetails.reviews.length > 0 ? (
                        productDetails.reviews.map(rev => (
                          <div key={rev.id} style={{ display: 'flex', gap: '16px', borderBottom: '1px solid rgba(0,0,0,0.04)', paddingBottom: '16px' }}>
                            <img 
                              src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(rev.username)}`} 
                              alt={rev.username} 
                              style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(0,0,0,0.05)' }} 
                            />
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <span style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{rev.username}</span>
                                <div style={{ display: 'flex', gap: '2px' }}>
                                  {[...Array(5)].map((_, i) => (
                                    <Star 
                                      key={i} 
                                      size={10} 
                                      fill={i < rev.rating ? "#ffb000" : "none"} 
                                      color={i < rev.rating ? "#ffb000" : "var(--text-muted)"} 
                                    />
                                  ))}
                                </div>
                              </div>
                              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{rev.comment}</p>
                              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                {new Date(rev.timestamp).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No reviews yet. Be the first to feedback!</p>
                      )}
                    </div>

                  </div>

                </div>
              )}
            </div>
          )}

          {/* WISHLIST PAGE */}
          {page === 'wishlist' && (
            <div className="fade-in-slide">
              <h1 style={{ fontFamily: 'Outfit', fontSize: '1.4rem', marginBottom: '24px', letterSpacing: '0.08em' }}>My Wishlist ({wishlist.length} Items)</h1>
              
              {wishlist.length === 0 ? (
                <div className="glass-card" style={{ padding: '64px', textAlign: 'center' }}>
                  <Heart size={40} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
                  <h3 style={{ marginBottom: '8px' }}>Your Wishlist is empty</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Click the heart icons on products to add favorites here.</p>
                  <button onClick={() => setPage('home')} className="btn btn-primary" style={{ marginTop: '16px' }}>Shop Now</button>
                </div>
              ) : (
                <div className="grid-products">
                  {wishlist.map(prod => (
                    <div key={prod.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', position: 'relative' }}>
                      <button 
                        onClick={() => toggleWishlist(prod)}
                        style={{
                          position: 'absolute', top: '12px', right: '12px', zIndex: 10,
                          background: 'rgba(255,255,255,0.85)', border: 'none', borderRadius: '50%',
                          width: '32px', height: '32px', cursor: 'pointer', display: 'flex',
                          alignItems: 'center', justifyContent: 'center'
                        }}
                      >
                        <X size={14} color="var(--text-muted)" />
                      </button>

                      <div style={{ height: '280px', overflow: 'hidden' }} onClick={() => openProduct(prod.id)}>
                        <img src={prod.imageUrl} alt={prod.title} style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }} />
                      </div>

                      <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <strong style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>{prod.brand}</strong>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>{prod.title}</span>
                          <div style={{ fontSize: '0.9rem', fontWeight: 800, marginTop: '8px' }}>₹{prod.price}</div>
                        </div>

                        <button onClick={() => openProduct(prod.id)} className="btn btn-primary" style={{ width: '100%', padding: '10px', fontSize: '0.7rem', marginTop: '12px' }}>
                          Add to Bag
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SHOPPING BAG PAGE */}
          {page === 'cart' && (
            <div className="fade-in-slide">
              <h1 style={{ fontFamily: 'Outfit', fontSize: '1.4rem', marginBottom: '24px', letterSpacing: '0.08em' }}>Shopping Bag</h1>
              
              {cart.length === 0 ? (
                <div className="glass-card" style={{ padding: '64px', textAlign: 'center' }}>
                  <ShoppingCart size={40} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
                  <h3 style={{ marginBottom: '8px' }}>Your Shopping Bag is empty</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Explore stylish apparel from Roadster, Wrogn and HRX.</p>
                  <button onClick={() => setPage('home')} className="btn btn-primary" style={{ marginTop: '16px' }}>Shop Now</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '28px' }}>
                  
                  {/* Cart items */}
                  <div style={{ flex: '2 1 600px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {cart.map((item, idx) => (
                      <div key={`${item.id}-${idx}`} className="glass-card" style={{ display: 'flex', padding: '16px', alignItems: 'center', gap: '16px', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <img src={item.imageUrl} alt={item.title} style={{ width: '80px', height: '100px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                          <div>
                            <span className="badge badge-tops" style={{ fontSize: '0.6rem', marginBottom: '4px' }}>{item.category}</span>
                            <h3 
                              onClick={() => openProduct(item.id)}
                              style={{ fontSize: '0.95rem', cursor: 'pointer', marginBottom: '4px', textTransform: 'none' }}
                            >
                              {item.title}
                            </h3>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
                              Size: <strong>{item.selectedSize}</strong> &nbsp;|&nbsp; Color: <strong>{item.selectedColor}</strong>
                            </div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Label: {item.brand}</span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                          <div style={{ fontSize: '1.15rem', fontWeight: 800 }}>
                            ₹{item.price}
                          </div>
                          <button onClick={() => removeFromCart(item.id)} className="btn btn-secondary" style={{ color: '#ef4848', border: '1px solid rgba(239,68,68,0.1)', padding: '10px' }} title="Remove item">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Summary & Coupons */}
                  <div style={{ flex: '1 1 300px' }}>
                    <div className="glass-card" style={{ padding: '24px', position: 'sticky', top: '100px' }}>
                      
                      {/* Coupon block */}
                      <div style={{ borderBottom: '1px solid #eaeaec', paddingBottom: '20px', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                          <Ticket size={16} color="var(--primary)" />
                          <h4 style={{ fontSize: '0.8rem', letterSpacing: '0.05em' }}>Apply Promos / Coupons</h4>
                        </div>
                        
                        <form onSubmit={handleApplyCoupon} style={{ display: 'flex', gap: '8px' }}>
                          <input 
                            type="text" 
                            placeholder="Try AJIO50 or MYNTRA300"
                            value={couponInput}
                            onChange={(e) => setCouponInput(e.target.value)}
                            className="form-input"
                            style={{ padding: '8px 12px', fontSize: '0.8rem' }}
                          />
                          <button type="submit" className="btn btn-primary" style={{ padding: '8px 14px', fontSize: '0.7rem' }}>
                            Apply
                          </button>
                        </form>

                        {appliedCoupon && (
                          <div style={{ marginTop: '12px', padding: '8px 12px', background: '#f0fdf4', border: '1px dashed #16a34a', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <strong style={{ fontSize: '0.75rem', color: '#16a34a' }}>Code {appliedCoupon.code} Applied</strong>
                              <span style={{ display: 'block', fontSize: '0.65rem', color: '#555' }}>{appliedCoupon.description}</span>
                            </div>
                            <button onClick={() => setAppliedCoupon(null)} style={{ background: 'none', border: 'none', color: '#ef4848', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer' }}>Remove</button>
                          </div>
                        )}
                      </div>

                      <h3 style={{ fontSize: '0.85rem', letterSpacing: '0.05em', borderBottom: '1px solid var(--card-border)', paddingBottom: '12px', marginBottom: '16px' }}>Order Details</h3>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Bag Subtotal:</span>
                        <span>₹{calculateCartSubtotal()}</span>
                      </div>

                      {appliedCoupon && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem', color: '#16a34a' }}>
                          <span>Promo Discount:</span>
                          <span>
                            -₹{appliedCoupon.discountPercent ? Math.round(calculateCartSubtotal() * (appliedCoupon.discountPercent / 100)) : appliedCoupon.discountAmount}
                          </span>
                        </div>
                      )}
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', borderTop: '1px solid var(--card-border)', paddingTop: '16px' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>Total Amount:</span>
                        <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary)' }}>
                          ₹{calculateCartTotalFinal()}
                        </span>
                      </div>

                      <button 
                        onClick={() => {
                          if (!token) {
                            showTemporaryMessage('Please login or register to checkout orders.', 'error');
                            setPage('auth');
                          } else {
                            setPage('checkout');
                          }
                        }} 
                        className="btn btn-primary" 
                        style={{ width: '100%', padding: '12px' }}
                      >
                        Proceed to Checkout
                      </button>
                    </div>
                  </div>

                </div>
              )}
            </div>
          )}

          {/* CHECKOUT PAGE */}
          {page === 'checkout' && (
            <div className="fade-in-slide" style={{ maxWidth: '600px', margin: '0 auto' }}>
              <button onClick={() => setPage('cart')} className="btn btn-secondary" style={{ marginBottom: '24px', padding: '8px 16px', fontSize: '0.75rem' }}>
                <ArrowLeft size={14} />
                <span>Back to Bag</span>
              </button>

              <div className="glass-card" style={{ padding: '32px', borderRadius: 'var(--radius-sm)' }}>
                <h1 style={{ fontFamily: 'Outfit', fontSize: '1.2rem', marginBottom: '24px', letterSpacing: '0.05em' }}>Order Shipping Details</h1>

                <div style={{ marginBottom: '24px', borderBottom: '1px solid var(--card-border)', paddingBottom: '16px' }}>
                  <h4 style={{ fontSize: '0.75rem', letterSpacing: '0.05em', marginBottom: '12px' }}>Review Garments</h4>
                  {cart.map((item, idx) => (
                    <div key={`${item.id}-${idx}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '8px 0' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {item.title} (Size {item.selectedSize} / Color {item.selectedColor})
                      </span>
                      <strong style={{ color: '#282c3f', fontSize: '0.85rem' }}>₹{appliedCoupon ? calculateItemDiscountedPrice(item) : item.price}</strong>
                    </div>
                  ))}
                  {/* Shipping Add-ons Selection */}
                  <div style={{ borderTop: '1px solid var(--card-border)', paddingTop: '16px', marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.8rem' }}>
                      <input 
                        type="checkbox" 
                        checked={checkoutExpress} 
                        onChange={(e) => setCheckoutExpress(e.target.checked)} 
                        style={{ accentColor: 'var(--primary)' }}
                      />
                      <div>
                        <strong>Express 24-Hour Delivery</strong> (+₹49)
                        <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)' }}>Get your items shipped immediately via express courier.</span>
                      </div>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.8rem' }}>
                      <input 
                        type="checkbox" 
                        checked={checkoutGiftWrap} 
                        onChange={(e) => setCheckoutGiftWrap(e.target.checked)}
                        style={{ accentColor: 'var(--primary)' }}
                      />
                      <div>
                        <strong>Add Premium Gift Wrap & Message</strong> (+₹30)
                        <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)' }}>Packaged in a stylish box with a personalized card.</span>
                      </div>
                    </label>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--card-border)', paddingTop: '12px', marginTop: '12px' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>Amount Payable:</span>
                    <strong style={{ fontSize: '1.15rem', color: 'var(--primary)' }}>
                      ₹{calculateCheckoutFinalTotal()}
                    </strong>
                  </div>
                </div>

                <form onSubmit={handleCheckout}>
                  <div className="input-group">
                    <label>Shipping Delivery Address</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Flat 304, Block-B, Palm Meadows, Whitefield, Bengaluru"
                      value={checkoutForm.shippingAddress}
                      onChange={(e) => setCheckoutForm(prev => ({ ...prev, shippingAddress: e.target.value }))}
                      required
                      className="form-input"
                    />
                  </div>

                  <div className="input-group">
                    <label>Contact Phone Number</label>
                    <input 
                      type="tel" 
                      placeholder="e.g. +91 9876543210"
                      value={checkoutForm.contactNumber}
                      onChange={(e) => setCheckoutForm(prev => ({ ...prev, contactNumber: e.target.value }))}
                      required
                      className="form-input"
                    />
                  </div>

                  <div style={{ padding: '16px', background: '#fafafa', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-sm)', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.8rem', marginBottom: '6px', letterSpacing: '0.05em' }}>
                      <CheckCircle2 size={14} />
                      <span>COD (Cash on Delivery) Guaranteed</span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>No payment required now. Pay our agent in cash or UPI when they deliver your wardrobe package.</p>
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px' }}>
                    Confirm & Complete Checkout
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* DASHBOARD */}
          {page === 'dashboard' && (
            <div className="fade-in-slide">
              <h1 style={{ fontFamily: 'Outfit', fontSize: '1.4rem', marginBottom: '24px', letterSpacing: '0.05em' }}>Seller & Shopping Hub</h1>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px' }}>
                
                {/* Custom upload */}
                <div style={{ flex: '1 1 400px' }}>
                  <div className="glass-card" style={{ padding: '24px' }}>
                    <h3 style={{ fontSize: '0.9rem', letterSpacing: '0.05em', marginBottom: '16px' }}>List Clothing Resource</h3>
                    
                    <form onSubmit={handleCreateProduct}>
                      <div className="input-group">
                        <label>Clothing Title</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Roadster Men Casual Denim Shirt"
                          value={uploadForm.title}
                          onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                          required
                          className="form-input"
                        />
                      </div>

                      <div className="input-group">
                        <label>Category</label>
                        <select 
                          value={uploadForm.category}
                          onChange={(e) => setUploadForm(prev => ({ ...prev, category: e.target.value }))}
                          className="form-select"
                        >
                          <option value="Tops">Tops</option>
                          <option value="Bottoms">Bottoms</option>
                          <option value="Outerwear">Outerwear</option>
                          <option value="Accessories">Accessories</option>
                        </select>
                      </div>

                      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        <div className="input-group" style={{ flex: 1 }}>
                          <label>Brand Tag</label>
                          <input 
                            type="text" 
                            placeholder="e.g. HRX"
                            value={uploadForm.brand}
                            onChange={(e) => setUploadForm(prev => ({ ...prev, brand: e.target.value }))}
                            className="form-input"
                          />
                        </div>
                        <div className="input-group" style={{ flex: 1 }}>
                          <label>Selling Price (₹)</label>
                          <input 
                            type="number" 
                            placeholder="e.g. 599"
                            value={uploadForm.price}
                            onChange={(e) => setUploadForm(prev => ({ ...prev, price: e.target.value }))}
                            required
                            min="0"
                            className="form-input"
                          />
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        <div className="input-group" style={{ flex: 1 }}>
                          <label>MRP Strike-through (₹)</label>
                          <input 
                            type="number" 
                            placeholder="e.g. 1299"
                            value={uploadForm.mrp}
                            onChange={(e) => setUploadForm(prev => ({ ...prev, mrp: e.target.value }))}
                            min="0"
                            className="form-input"
                          />
                        </div>
                        <div className="input-group" style={{ flex: 1 }}>
                          <label>Sizes (comma separated)</label>
                          <input 
                            type="text" 
                            placeholder="S, M, L, XL"
                            value={uploadForm.sizes}
                            onChange={(e) => setUploadForm(prev => ({ ...prev, sizes: e.target.value }))}
                            className="form-input"
                          />
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        <div className="input-group" style={{ flex: 1 }}>
                          <label>Colors (comma separated)</label>
                          <input 
                            type="text" 
                            placeholder="Black, Blue, Beige"
                            value={uploadForm.colors}
                            onChange={(e) => setUploadForm(prev => ({ ...prev, colors: e.target.value }))}
                            className="form-input"
                          />
                        </div>
                        <div className="input-group" style={{ flex: 1 }}>
                          <label>Gender</label>
                          <select 
                            value={uploadForm.gender}
                            onChange={(e) => setUploadForm(prev => ({ ...prev, gender: e.target.value }))}
                            className="form-select"
                          >
                            <option value="Unisex">Unisex</option>
                            <option value="Men">Men</option>
                            <option value="Women">Women</option>
                          </select>
                        </div>
                      </div>

                      <div className="input-group">
                        <label>Display Image URL (Unsplash direct link)</label>
                        <input 
                          type="url" 
                          placeholder="e.g. https://images.unsplash.com/photo-1596755094514-f87e34085b2c"
                          value={uploadForm.imageUrl}
                          onChange={(e) => setUploadForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                          className="form-input"
                        />
                      </div>

                      <div className="input-group">
                        <label>Alternative Images (comma separated URLs)</label>
                        <input 
                          type="text" 
                          placeholder="URL1, URL2, URL3"
                          value={uploadForm.images}
                          onChange={(e) => setUploadForm(prev => ({ ...prev, images: e.target.value }))}
                          className="form-input"
                        />
                      </div>

                      <div className="input-group">
                        <label>Specifications / Description</label>
                        <textarea 
                          placeholder="GSM count, material composition, comfort level, fit indicators..."
                          value={uploadForm.description}
                          onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                          required
                          className="form-input"
                          rows="3"
                          style={{ fontFamily: 'inherit', resize: 'vertical' }}
                        />
                      </div>

                      <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
                        Publish Styling Resource
                      </button>
                    </form>
                  </div>
                </div>

                {/* Info lists */}
                <div style={{ flex: '2 1 500px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                  
                  {/* Purchases */}
                  <div className="glass-card" style={{ padding: '24px' }}>
                    <h3 style={{ fontSize: '0.85rem', letterSpacing: '0.05em', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <ShoppingBag size={18} />
                      <span>My Wardrobe Orders placed</span>
                    </h3>

                    {purchases.length === 0 ? (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No orders placed yet.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {purchases.map(order => {
                          const getStatusStep = (status) => {
                            if (status === 'pending') return 1;
                            if (status === 'shipped') return 2;
                            if (status === 'completed') return 3;
                            return 0; // cancelled
                          };
                          const step = getStatusStep(order.status);
                          return (
                            <div key={order.id} style={{ display: 'flex', flexDirection: 'column', padding: '16px', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-sm)', gap: '16px', background: 'var(--card-bg)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                  <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--text-main)' }}>{order.productTitle}</div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                    Ordered {new Date(order.timestamp).toLocaleDateString()} • Size: <strong>{order.selectedSize}</strong> • Color: <strong>{order.selectedColor}</strong> • Price: <strong>₹{order.price}</strong>
                                  </div>
                                </div>
                                <span className={`badge badge-status-${order.status}`}>{order.status}</span>
                              </div>

                              {/* Progress bar visual tracker */}
                              {step > 0 && (
                                <div style={{ borderTop: '1px dashed var(--card-border)', paddingTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '360px', margin: '0 auto', width: '100%' }}>
                                  
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                    <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: step >= 1 ? 'var(--primary)' : 'var(--card-border)', border: '2px solid var(--card-bg)', boxShadow: '0 0 0 1px var(--primary)' }} />
                                    <span style={{ fontSize: '0.65rem', fontWeight: step >= 1 ? 'bold' : 'normal', color: step >= 1 ? 'var(--text-main)' : 'var(--text-muted)' }}>Ordered</span>
                                  </div>
                                  
                                  <div style={{ flex: 1, height: '2px', background: step >= 2 ? 'var(--primary)' : 'var(--card-border)', margin: '0 6px', transform: 'translateY(-10px)' }} />

                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                    <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: step >= 2 ? 'var(--primary)' : 'var(--card-border)', border: '2px solid var(--card-bg)', boxShadow: step >= 2 ? '0 0 0 1px var(--primary)' : 'none' }} />
                                    <span style={{ fontSize: '0.65rem', fontWeight: step >= 2 ? 'bold' : 'normal', color: step >= 2 ? 'var(--text-main)' : 'var(--text-muted)' }}>Shipped</span>
                                  </div>

                                  <div style={{ flex: 1, height: '2px', background: step >= 3 ? 'var(--primary)' : 'var(--card-border)', margin: '0 6px', transform: 'translateY(-10px)' }} />

                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                    <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: step >= 3 ? 'var(--primary)' : 'var(--card-border)', border: '2px solid var(--card-bg)', boxShadow: step >= 3 ? '0 0 0 1px var(--primary)' : 'none' }} />
                                    <span style={{ fontSize: '0.65rem', fontWeight: step >= 3 ? 'bold' : 'normal', color: step >= 3 ? 'var(--text-main)' : 'var(--text-muted)' }}>Delivered</span>
                                  </div>

                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Boutique Sales Orders */}
                  <div className="glass-card" style={{ padding: '24px' }}>
                    <h3 style={{ fontSize: '0.85rem', letterSpacing: '0.05em', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Award size={18} />
                      <span>Boutique Sales Orders Received</span>
                    </h3>

                    {sales.length === 0 ? (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No customer orders received yet.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {sales.map(order => (
                          <div key={order.id} style={{ padding: '16px', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-sm)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                              <div>
                                <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{order.productTitle}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                  Selection: <strong>Size {order.selectedSize} / Color {order.selectedColor}</strong>
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Customer: <strong>{order.buyerName}</strong> • Phone: {order.contactNumber}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Shipping: {order.shippingAddress}</div>
                              </div>
                              <span className={`badge badge-status-${order.status}`}>{order.status}</span>
                            </div>

                            {order.status === 'pending' && (
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => handleUpdateOrderStatus(order.id, 'shipped')} className="btn btn-secondary" style={{ fontSize: '0.7rem', padding: '6px 12px' }}>Mark Shipped</button>
                                <button onClick={() => handleUpdateOrderStatus(order.id, 'completed')} className="btn btn-primary" style={{ fontSize: '0.7rem', padding: '6px 12px' }}>Mark Complete</button>
                                <button onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')} className="btn btn-secondary" style={{ color: '#ef4848', fontSize: '0.7rem', padding: '6px 12px' }}>Cancel</button>
                              </div>
                            )}
                            {order.status === 'shipped' && (
                              <button onClick={() => handleUpdateOrderStatus(order.id, 'completed')} className="btn btn-primary" style={{ fontSize: '0.7rem', padding: '6px 12px' }}>Mark Completed</button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>

              </div>
            </div>
          )}

          {/* CHAT MESSAGING PAGE */}
          {page === 'chat' && (
            <div className="glass-card fade-in-slide" style={{ 
              display: 'flex', height: '600px', overflow: 'hidden', padding: 0, 
              borderRadius: 'var(--radius-sm)', border: '1px solid var(--card-border)' 
            }}>
              
              {/* Left Side: Conversations */}
              <div style={{ 
                flex: '1 1 240px', borderRight: '1px solid var(--card-border)', 
                display: 'flex', flexDirection: 'column', height: '100%' 
              }}>
                <div style={{ padding: '20px', borderBottom: '1px solid var(--card-border)' }}>
                  <h3 style={{ fontSize: '0.85rem', letterSpacing: '0.05em' }}>Support Chats</h3>
                </div>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  {conversations.length === 0 ? (
                    <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      No active styling conversations.
                    </div>
                  ) : (
                    conversations.map(conv => (
                      <div 
                        key={conv.id} 
                        onClick={() => openChatWith(conv.id)}
                        style={{
                          display: 'flex', gap: '12px', padding: '16px 20px', cursor: 'pointer',
                          alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.03)',
                          transition: 'all 0.2s',
                          background: selectedPartnerId === conv.id ? 'rgba(255, 63, 108, 0.04)' : 'transparent',
                        }}
                      >
                        <img src={conv.avatar} alt={conv.username} style={{ width: '36px', height: '36px', borderRadius: '50%' }} />
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <strong style={{ fontSize: '0.85rem' }}>{conv.username}</strong>
                            {conv.unread && (
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)' }}></span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', marginTop: '2px' }}>
                            {conv.lastMessage}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Right Side: Chat Window */}
              <div style={{ flex: '3 1 500px', display: 'flex', flexDirection: 'column', height: '100%' }}>
                {selectedPartnerId ? (
                  <>
                    <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img 
                        src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(
                          conversations.find(c => c.id === selectedPartnerId)?.username || 'Chat'
                        )}`} 
                        alt="partner" 
                        style={{ width: '36px', height: '36px', borderRadius: '50%' }} 
                      />
                      <div>
                        <strong style={{ fontSize: '0.85rem' }}>
                          {conversations.find(c => c.id === selectedPartnerId)?.username || 'Boutique Consultant'}
                        </strong>
                        <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          National Fashion Stylist
                        </span>
                      </div>
                    </div>

                    <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', background: 'rgba(0,0,0,0.005)' }}>
                      {messages.map(msg => {
                        const isMe = msg.senderId === user.id;
                        return (
                          <div 
                            key={msg.id} 
                            style={{ 
                              display: 'flex', 
                              justifyContent: isMe ? 'flex-end' : 'flex-start',
                            }}
                          >
                            <div style={{ 
                              maxWidth: '70%', 
                              padding: '12px 18px', 
                              borderRadius: 'var(--radius-sm)',
                              background: isMe ? 'var(--primary)' : 'rgba(0, 0, 0, 0.05)',
                              color: isMe ? '#fff' : 'var(--text-main)',
                              boxShadow: 'var(--shadow-sm)',
                              border: isMe ? 'none' : '1px solid rgba(0,0,0,0.03)'
                            }}>
                              <p style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>{msg.message}</p>
                              <span style={{ fontSize: '0.6rem', color: isMe ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)', display: 'block', textAlign: 'right', marginTop: '6px' }}>
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={chatEndRef} />
                    </div>

                    <form onSubmit={handleSendMessage} style={{ padding: '20px', borderTop: '1px solid var(--card-border)', display: 'flex', gap: '12px' }}>
                      <input 
                        type="text" 
                        placeholder="Write styling query, sizes customization requests..."
                        value={chatMessageText}
                        onChange={(e) => setChatMessageText(e.target.value)}
                        required
                        className="form-input"
                        style={{ borderRadius: 'var(--radius-sm)' }}
                      />
                      <button type="submit" className="btn btn-primary btn-icon">
                        <Send size={16} />
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="flex-center" style={{ flex: 1, flexDirection: 'column', color: 'var(--text-muted)', padding: '48px' }}>
                    <MessageSquare size={40} style={{ marginBottom: '16px' }} />
                    <h3>Select Support Inbox</h3>
                    <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>Inquire customization tags, styling recommendations with curators.</p>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* AUTH (LOGIN & REGISTER) */}
          {page === 'auth' && (
            <div className="fade-in-slide" style={{ maxWidth: '400px', margin: '48px auto' }}>
              <div className="glass-card" style={{ padding: '32px', borderRadius: 'var(--radius-sm)' }}>
                
                {/* Header Switch tabs */}
                <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid var(--card-border)', paddingBottom: '16px', marginBottom: '24px' }}>
                  <h2 
                    onClick={() => setAuthForm(prev => ({ ...prev, isLogin: true }))}
                    style={{ 
                      cursor: 'pointer', fontFamily: 'Outfit', fontSize: '1rem', letterSpacing: '0.05em',
                      color: authForm.isLogin ? 'var(--primary)' : 'var(--text-muted)',
                      borderBottom: authForm.isLogin ? '2px solid var(--primary)' : 'none',
                      paddingBottom: '8px', flex: 1, textAlign: 'center'
                    }}
                  >
                    Login
                  </h2>
                  <h2 
                    onClick={() => setAuthForm(prev => ({ ...prev, isLogin: false }))}
                    style={{ 
                      cursor: 'pointer', fontFamily: 'Outfit', fontSize: '1rem', letterSpacing: '0.05em',
                      color: !authForm.isLogin ? 'var(--primary)' : 'var(--text-muted)',
                      borderBottom: !authForm.isLogin ? '2px solid var(--primary)' : 'none',
                      paddingBottom: '8px', flex: 1, textAlign: 'center'
                    }}
                  >
                    Register
                  </h2>
                </div>

                <form onSubmit={handleAuthSubmit}>
                  
                  {!authForm.isLogin && (
                    <div className="input-group">
                      <label>User Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g. ElenaV"
                        value={authForm.username}
                        onChange={(e) => setAuthForm(prev => ({ ...prev, username: e.target.value }))}
                        required={!authForm.isLogin}
                        className="form-input"
                      />
                    </div>
                  )}

                  <div className="input-group">
                    <label>Email Address</label>
                    <input 
                      type="email" 
                      placeholder="e.g. elena@vogue.com"
                      value={authForm.email}
                      onChange={(e) => setAuthForm(prev => ({ ...prev, email: e.target.value }))}
                      required
                      className="form-input"
                    />
                  </div>

                  <div className="input-group">
                    <label>Password</label>
                    <input 
                      type="password" 
                      placeholder="••••••••"
                      value={authForm.password}
                      onChange={(e) => setAuthForm(prev => ({ ...prev, password: e.target.value }))}
                      required
                      className="form-input"
                    />
                  </div>

                  {!authForm.isLogin && (
                    <>
                      <div className="input-group">
                        <label>Preferred Stylist Label / Organization</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Independent Stylist / Student"
                          value={authForm.college}
                          onChange={(e) => setAuthForm(prev => ({ ...prev, college: e.target.value }))}
                          className="form-input"
                        />
                      </div>

                      <div className="input-group">
                        <label>Favorite Style Aesthetic</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Minimalist, Vintage, Streetwear"
                          value={authForm.course}
                          onChange={(e) => setAuthForm(prev => ({ ...prev, course: e.target.value }))}
                          className="form-input"
                        />
                      </div>
                    </>
                  )}

                  <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', marginTop: '12px' }}>
                    {authForm.isLogin ? 'Login to Studio' : 'Register Customer Account'}
                  </button>
                </form>

              </div>
            </div>
          )}

        </div>
      </main>

      {/* ADVANCED FILTERS MODAL */}
      {showFiltersModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1000,
          background: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(2px)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div className="glass-card" style={{
            width: '100%', maxWidth: '440px', padding: '32px', borderRadius: 'var(--radius-sm)',
            boxShadow: 'var(--shadow-lg)', background: 'var(--card-bg)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontFamily: 'Outfit', fontSize: '1rem', letterSpacing: '0.05em' }}>Filter & Sort Collection</h3>
              <button onClick={() => setShowFiltersModal(false)} className="btn btn-secondary btn-icon" style={{ borderRadius: '50%', width: '32px', height: '32px', border: 'none' }}>
                <X size={14} />
              </button>
            </div>

            <form onSubmit={applyAdvancedFilters}>
              <div className="input-group">
                <label>Filter By Brand</label>
                <input 
                  type="text" 
                  placeholder="e.g. Roadster, HRX, Anouk"
                  value={filterBrand}
                  onChange={(e) => setFilterBrand(e.target.value)}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div className="input-group" style={{ flex: 1 }}>
                  <label>Size Filter</label>
                  <select 
                    value={filterSize} 
                    onChange={(e) => setFilterSize(e.target.value)}
                    className="form-select"
                  >
                    <option value="">All Sizes</option>
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                    <option value="XXL">XXL</option>
                  </select>
                </div>
                
                <div className="input-group" style={{ flex: 1 }}>
                  <label>Gender Label</label>
                  <select 
                    value={filterGender} 
                    onChange={(e) => setFilterGender(e.target.value)}
                    className="form-select"
                  >
                    <option value="">All Genders</option>
                    <option value="Unisex">Unisex</option>
                    <option value="Men">Men</option>
                    <option value="Women">Women</option>
                  </select>
                </div>
              </div>

              <div className="input-group">
                <label>Filter By Color</label>
                <input 
                  type="text" 
                  placeholder="e.g. Blue, Black, Indigo"
                  value={filterColor}
                  onChange={(e) => setFilterColor(e.target.value)}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div className="input-group" style={{ flex: 1 }}>
                  <label>Min Price (₹)</label>
                  <input 
                    type="number" 
                    placeholder="299"
                    value={filterMinPrice}
                    onChange={(e) => setFilterMinPrice(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="input-group" style={{ flex: 1 }}>
                  <label>Max Price (₹)</label>
                  <input 
                    type="number" 
                    placeholder="4999"
                    value={filterMaxPrice}
                    onChange={(e) => setFilterMaxPrice(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="button" onClick={clearAdvancedFilters} className="btn btn-secondary" style={{ flex: 1, padding: '10px', fontSize: '0.75rem' }}>
                  Clear Filters
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '10px', fontSize: '0.75rem' }}>
                  Apply Filters
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FIT PREDICTOR MODAL */}
      {showFitPredictor && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1000,
          background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div className="glass-card" style={{
            width: '100%', maxWidth: '420px', padding: '32px', borderRadius: 'var(--radius-sm)',
            boxShadow: 'var(--shadow-lg)', background: 'var(--card-bg)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={16} color="var(--primary)" />
                <h3 style={{ fontFamily: 'Outfit', fontSize: '0.95rem', letterSpacing: '0.05em' }}>Boutique Fit Predictor</h3>
              </div>
              <button onClick={() => { setShowFitPredictor(false); setFitResult(null); }} className="btn btn-secondary btn-icon" style={{ borderRadius: '50%', width: '32px', height: '32px', border: 'none' }}>
                <X size={14} />
              </button>
            </div>

            <form onSubmit={calculateFitSize}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: '1.4' }}>
                Enter your physical parameters. Our style engine maps your heights and weights against brand specifications to recommend the best size fit.
              </p>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div className="input-group" style={{ flex: 1 }}>
                  <label>Height (cm)</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 175"
                    value={fitInput.height}
                    onChange={(e) => setFitInput(prev => ({ ...prev, height: e.target.value }))}
                    required
                    min="120"
                    max="220"
                    className="form-input"
                  />
                </div>
                <div className="input-group" style={{ flex: 1 }}>
                  <label>Weight (kg)</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 70"
                    value={fitInput.weight}
                    onChange={(e) => setFitInput(prev => ({ ...prev, weight: e.target.value }))}
                    required
                    min="30"
                    max="180"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Fit Silhouette preference</label>
                <select 
                  value={fitInput.fitPreference} 
                  onChange={(e) => setFitInput(prev => ({ ...prev, fitPreference: e.target.value }))}
                  className="form-select"
                >
                  <option value="tight">Slim Fit (Fitted contour)</option>
                  <option value="regular">Regular Fit (Standard contour)</option>
                  <option value="oversized">Oversized Fit (Loose boxy contour)</option>
                </select>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', marginTop: '10px' }}>
                Calculate Recommended Size
              </button>
            </form>

            {fitResult && (
              <div style={{
                marginTop: '24px', padding: '16px', background: 'var(--primary-glow)',
                border: '1px dashed var(--primary)', borderRadius: 'var(--radius-sm)', textAlign: 'center'
              }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recommended size</span>
                <strong style={{ fontSize: '2rem', color: 'var(--primary)', display: 'block', margin: '4px 0', fontFamily: 'Outfit' }}>{fitResult}</strong>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  This size has been auto-selected in your size choice. Click <strong>Add to Bag</strong> to proceed with this fit!
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SIZE GUIDE MODAL */}
      {showSizeGuide && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1000,
          background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div className="glass-card" style={{
            width: '100%', maxWidth: '440px', padding: '32px', borderRadius: 'var(--radius-sm)',
            boxShadow: 'var(--shadow-lg)', background: 'var(--card-bg)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookOpen size={16} />
                <h3 style={{ fontFamily: 'Outfit', fontSize: '0.95rem', letterSpacing: '0.05em' }}>Apparel Size Guide</h3>
              </div>
              <button onClick={() => setShowSizeGuide(false)} className="btn btn-secondary btn-icon" style={{ borderRadius: '50%', width: '32px', height: '32px', border: 'none' }}>
                <X size={14} />
              </button>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: '1.4' }}>
              Measure around the fullest part of your chest or waist to find your fit. Measurements are shown in inches.
            </p>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--card-border)' }}>
                  <th style={{ padding: '8px', fontWeight: 'bold' }}>Size</th>
                  <th style={{ padding: '8px', fontWeight: 'bold' }}>Chest (in)</th>
                  <th style={{ padding: '8px', fontWeight: 'bold' }}>Waist (in)</th>
                  <th style={{ padding: '8px', fontWeight: 'bold' }}>Length (in)</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--card-border)' }}>
                  <td style={{ padding: '8px', fontWeight: 'bold' }}>S</td>
                  <td style={{ padding: '8px' }}>38"</td>
                  <td style={{ padding: '8px' }}>30"</td>
                  <td style={{ padding: '8px' }}>27.5"</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--card-border)' }}>
                  <td style={{ padding: '8px', fontWeight: 'bold' }}>M</td>
                  <td style={{ padding: '8px' }}>40"</td>
                  <td style={{ padding: '8px' }}>32"</td>
                  <td style={{ padding: '8px' }}>28.0"</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--card-border)' }}>
                  <td style={{ padding: '8px', fontWeight: 'bold' }}>L</td>
                  <td style={{ padding: '8px' }}>42"</td>
                  <td style={{ padding: '8px' }}>34"</td>
                  <td style={{ padding: '8px' }}>29.0"</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--card-border)' }}>
                  <td style={{ padding: '8px', fontWeight: 'bold' }}>XL</td>
                  <td style={{ padding: '8px' }}>44"</td>
                  <td style={{ padding: '8px' }}>36"</td>
                  <td style={{ padding: '8px' }}>30.0"</td>
                </tr>
              </tbody>
            </table>

            <button onClick={() => setShowSizeGuide(false)} className="btn btn-primary" style={{ width: '100%', marginTop: '24px', padding: '10px' }}>
              Close Guide
            </button>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="glass-card" style={{
        marginTop: '64px', borderLeft: 'none', borderRight: 'none', borderBottom: 'none',
        borderRadius: 0, padding: '48px 0 24px 0', borderTop: '1px solid var(--card-border)', background: 'var(--background)'
      }}>
        <div className="container">
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '32px', marginBottom: '32px' }}>
            
            <div style={{ flex: '1 1 300px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.3rem', letterSpacing: '0.12em', color: 'var(--primary)' }}>FashionHub</span>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.7' }}>
                Your destination for premium Indian and international lifestyle brands. Explore shirts, trousers, ethnic Kurtas, and active wear from Roadster, Wrogn, and HRX.
              </p>
            </div>

            <div>
              <h4 style={{ fontSize: '0.75rem', letterSpacing: '0.05em', color: 'var(--text-main)', marginBottom: '16px', textTransform: 'uppercase' }}>Categories</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
                <span onClick={() => { setActiveCategory('Tops'); setPage('home'); }} style={{ color: 'var(--text-muted)', cursor: 'pointer' }}>Tops & Kurtas</span>
                <span onClick={() => { setActiveCategory('Bottoms'); setPage('home'); }} style={{ color: 'var(--text-muted)', cursor: 'pointer' }}>Jeans & Trousers</span>
                <span onClick={() => { setActiveCategory('Outerwear'); setPage('home'); }} style={{ color: 'var(--text-muted)', cursor: 'pointer' }}>Jackets & Hoodies</span>
                <span onClick={() => { setActiveCategory('Accessories'); setPage('home'); }} style={{ color: 'var(--text-muted)', cursor: 'pointer' }}>Backpacks & Running Shoes</span>
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '0.75rem', letterSpacing: '0.05em', color: 'var(--text-main)', marginBottom: '16px', textTransform: 'uppercase' }}>Promotions</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <span>• Code: <strong>AJIO50</strong> (50% Off)</span>
                <span>• Code: <strong>MYNTRA300</strong> (₹300 Off)</span>
                <span>• Free Shipping on Orders above ₹999</span>
              </div>
            </div>

          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '24px', fontSize: '0.8rem', color: 'var(--text-muted)', flexWrap: 'wrap', gap: '12px' }}>
            <span>© 2026 FashionHub Studio. Inspired by Myntra & AJIO. Crafted for portfolios.</span>
            <div style={{ display: 'flex', gap: '16px' }}>
              <span>Privacy Policy</span>
              <span>Terms of Service</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}

// Local css variable injection
const stylesInject = `
@keyframes spin {
  to { transform: rotate(360deg); }
}
`;
if (typeof document !== 'undefined') {
  const styleEl = document.createElement('style');
  styleEl.textContent = stylesInject;
  document.head.appendChild(styleEl);
}
