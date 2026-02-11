import React, { useState, useEffect } from 'react';
import {
  Heart, ShoppingBag, Plus, Trash2, ChevronRight, ChevronLeft,
  CheckCircle, Settings, Image as ImageIcon, Package, Play,
  HelpCircle, Zap, Video, Instagram, ShieldCheck, Award, Truck,
  MapPin, Sparkles, AlignLeft, Phone, Coffee, Gift, ArrowLeft,
  ClipboardList, Upload, Download, Volume2, VolumeX, Facebook, FileText
} from 'lucide-react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- Axios Configuration ---
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL || '';

// --- Theme & Style Constants ---
const THEME = {
  primaryRed: '#DA3A36',
  yellow: '#F6D55F',
  cream: '#F4E6C5',
  darkText: '#4A0404',
  blush: '#FED3C7'
};

const INITIAL_PRODUCTS = [
  { id: 'p1', name: 'LUVBEES Classic', price: 499.00, regularPrice: 799, description: "India's viral chocolate sensation. Feed the flame, naturally.", imageUrl: 'https://images.unsplash.com/photo-1516589174184-c68526674fd6', active: true, category: 'Chocolates' },
  { id: 'p2', name: 'Combo Pack of 2', price: 799.00, regularPrice: 1598, description: "Double the delight. Save ₹450 with this pack of two handcrafted bars.", imageUrl: 'https://images.unsplash.com/photo-1522673607200-16484837dec5', active: true, category: 'Chocolates' },
  { id: 'p3', name: 'Edible Chocobody Paint', price: 599.00, regularPrice: 899, description: "Rich, smooth dark chocolate paint with a soft brush for artistic intimacy.", imageUrl: 'https://images.unsplash.com/photo-1511381939415-e44015466834', active: true, category: 'Chocolates' },
  { id: 'p4', name: 'Adam & Eve Candle', price: 1199.00, regularPrice: 2397, description: "Scented with sandalwood and rose petals. Designed for intimate evenings.", imageUrl: 'https://images.unsplash.com/photo-1603006905003-be475563bc59', active: true, category: 'Gifts' },
  { id: 'p5', name: 'Couple Flaming Card', price: 299.00, regularPrice: 499, description: "Heat-reactive cards that reveal daring dares and romantic prompts.", imageUrl: 'https://images.unsplash.com/photo-1534531173927-aeb928d54385', active: true, category: 'Gifts' },
  { id: 'p6', name: 'Massage Oil Set', price: 899.00, regularPrice: 1499, description: "A trio of essential oils: Lavender, Ylang Ylang, and Jasmine for deep relaxation.", imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef', active: true, category: 'Gifts' }
];

// Helper to load scripts (for Razorpay)
const loadScript = (src) => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

// --- Sub-Components ---
const HeartCursor = () => {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    const move = (e) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', move);
    window.addEventListener('resize', check);
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('resize', check); };
  }, []);
  if (isMobile) return null;
  return <div className="fixed pointer-events-none z-[9999] transition-transform duration-75" style={{ left: pos.x, top: pos.y, transform: 'translate(-50%, -50%)' }}><img src="/heart-flame.png" className="w-12 h-12 object-contain drop-shadow-lg" alt="" /></div>;
};

const CustomSlider = ({ items, type = 'image', aspect = 'video' }) => {
  const [idx, setIdx] = useState(0);
  const [muted, setMuted] = useState(true);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const next = () => setIdx((prev) => (prev + 1) % (items?.length || 1));
  const prev = () => setIdx((prev) => (prev - 1 + (items?.length || 1)) % (items?.length || 1));

  // Auto Slide (only for images)
  useEffect(() => {
    if (type === 'video' || !items || items.length <= 1) return;
    const interval = setInterval(next, 4000);
    return () => clearInterval(interval);
  }, [idx, items, type]);

  // Swipe Handlers
  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    if (isLeftSwipe) next();
    if (isRightSwipe) prev();
  };

  const aspectClass = aspect === 'video' ? 'aspect-video md:aspect-[21/9]' : 'aspect-[3/4]';

  if (!items || items.length === 0) return <div className={`w-full ${aspectClass} bg-white/10 rounded-2xl flex items-center justify-center italic opacity-30 border border-dashed border-[#DA3A36]`}>No {type}s configured in Admin</div>;

  return (
    <div
      className={`relative w-full ${aspectClass} overflow-hidden rounded-3xl border border-[#DA3A36]/10 group shadow-2xl bg-black`}
      onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
    >
      <div className="absolute inset-0 flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${idx * 100}%)` }}>
        {items.map((it, i) => {
          const instaMatch = it.includes('instagram.com') ? it.match(/(?:p|reel|reels)\/([a-zA-Z0-9_-]+)/) : null;
          return (
            <div key={i} className="w-full flex-shrink-0 relative h-full flex items-center justify-center">
              {type === 'image' ? <img src={it} className="w-full h-full object-cover" alt="" loading="lazy" decoding="async" /> :
                (instaMatch ?
                  <iframe
                    src={`https://www.instagram.com/p/${instaMatch[1]}/embed/captioned/`}
                    className="w-full h-full md:max-w-[540px] bg-white mx-auto shadow-2xl"
                    frameBorder="0"
                    scrolling="no"
                    allowtransparency="true"
                    allowFullScreen
                    loading="lazy"
                  ></iframe>
                  : (it.includes('instagram.com') ?
                    <div className="w-full h-full bg-black flex items-center justify-center relative overflow-hidden">
                      <div className="text-center space-y-4">
                        <div className="text-white/50 text-xs uppercase tracking-widest">Instagram Content</div>
                        <button onClick={() => window.open(it, '_blank')} className="bg-[#DA3A36] text-white px-6 py-2 rounded-full text-xs font-bold uppercase hover:scale-105 transition">View on Instagram</button>
                      </div>
                    </div>
                    :
                    <div className="relative w-full h-full">
                      <video src={it} className="w-full h-full object-contain" autoPlay loop muted={muted} playsInline />
                      <button onClick={() => setMuted(!muted)} className="absolute bottom-6 right-6 p-3 bg-black/50 text-white rounded-full hover:bg-[#DA3A36] transition backdrop-blur-sm z-20">
                        {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                      </button>
                    </div>
                  )
                )
              }
            </div>
          );
        })}
      </div>
      {items.length > 1 && (
        <>
          <button onClick={(e) => { e.stopPropagation(); prev(); }} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full md:opacity-0 group-hover:opacity-100 transition shadow-md hover:bg-[#DA3A36] hover:text-white z-20"><ChevronLeft size={24} /></button>
          <button onClick={(e) => { e.stopPropagation(); next(); }} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full md:opacity-0 group-hover:opacity-100 transition shadow-md hover:bg-[#DA3A36] hover:text-white z-20"><ChevronRight size={24} /></button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {items.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)} className={`w-2 h-2 rounded-full transition-all ${i === idx ? 'bg-[#DA3A36] w-6' : 'bg-[#DA3A36]/50'}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const AccordionItem = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[#DA3A36]/10">
      <button onClick={() => setOpen(!open)} className="w-full py-6 flex justify-between items-center text-left hover:text-[#DA3A36]">
        <span className="font-serif text-lg">{q}</span><Plus size={20} className={`transition ${open ? 'rotate-45' : ''}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-96 mb-6' : 'max-h-0'}`}><p className="opacity-70 text-sm leading-relaxed">{a}</p></div>
    </div>
  );
};

// --- Main Application ---
export default function App() {
  const [view, setView] = useState('home');
  const [products, setProducts] = useState(INITIAL_PRODUCTS); // Fallback to initial
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Age Verification State
  const [ageVerified, setAgeVerified] = useState(false);
  const [showAgeGate, setShowAgeGate] = useState(true);
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);

  useEffect(() => { if (window.location.pathname === '/admin') setView('admin'); }, []);

  useEffect(() => {
    const verified = localStorage.getItem('ageVerified');
    if (verified === 'true') {
      setAgeVerified(true);
      setShowAgeGate(false);
    }
  }, []);

  const handleAgeVerify = (isOver18) => {
    if (isOver18) {
      localStorage.setItem('ageVerified', 'true');
      setAgeVerified(true);
      setShowAgeGate(false);
    } else {
      setAgeVerified(false);
      // Stay on age gate but maybe show a message
      alert("This site is restricted to adults (18+). You cannot enter.");
      window.location.href = "https://www.google.com";
    }
  };



  // Dynamic Configs
  const [flashnews, setFlashnews] = useState({ text: "Flashnews • India's viral chocolate • Free Shipping • Limited Stock", speed: 15 });
  const [media, setMedia] = useState({
    heroImages: [
      'https://images.unsplash.com/photo-1516589174184-c68526674fd6',
      'https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3',
      'https://images.unsplash.com/photo-1518895312237-a9e23508027d'
    ],
    momentImages: [],
    galleryVideos: [],
    socialPosts: []
  });
  const [faqs, setFaqs] = useState([]);
  const [delivery, setDelivery] = useState({ fee: 50, threshold: 500, note: 'Buy above ₹500 for Free Delivery!' });

  // Refresh Data Trigger
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        // Load Products
        const pRes = await axios.get('/api/products');
        if (pRes.data && pRes.data.length > 0) setProducts(pRes.data);

        // Load Configs
        const fRes = await axios.get('/api/configs/flashnews').catch(() => null);
        if (fRes?.data) setFlashnews(fRes.data);

        const mRes = await axios.get('/api/configs/media').catch(() => null);
        if (mRes?.data) setMedia(mRes.data);

        const qRes = await axios.get('/api/configs/faqs').catch(() => null);
        if (qRes?.data?.items) setFaqs(qRes.data.items);

        const dRes = await axios.get('/api/configs/delivery').catch(() => null);
        if (dRes?.data) setDelivery(dRes.data);

      } catch (err) { console.error("Data Load Error", err); }
      finally { setLoading(false); }
    };
    init();
  }, [refresh]);

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const isFree = subtotal >= (delivery.threshold || 0);
  const shipCost = subtotal > 0 ? (isFree ? 0 : (delivery.fee || 0)) : 0;
  const grandTotal = subtotal + shipCost;

  const addToCart = (p) => {
    setCart(prev => {
      const ex = prev.find(i => i.id === p.id);
      if (ex) return prev.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...p, qty: 1 }];
    });
    setView('cart');
  };

  const clearCart = () => setCart([]);

  const reloadData = () => setRefresh(prev => prev + 1);



  if (loading) return (
    <div className="h-screen w-full bg-[#F4E6C5] flex items-center justify-center">
      <img src="/heart-flame.png" className="w-24 h-24 object-contain animate-pulse drop-shadow-xl" alt="Loading..." />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4E6C5] text-[#4A0404] font-sans selection:bg-[#E97D78] selection:text-white">
      <style>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { animation: marquee 30s linear infinite; }
        .text-shadow { text-shadow: 2px 2px 4px rgba(0,0,0,0.1); }
      `}</style>
      <HeartCursor />

      {showAgeGate && (
        <div className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center text-center p-6">
          <div className="bg-[#F4E6C5] p-6 md:p-12 rounded-[3rem] shadow-2xl max-w-2xl w-full border-4 border-[#DA3A36] space-y-6 md:space-y-8 animate-in zoom-in duration-500">
            <img src="/heart-flame.png" className="w-24 h-24 md:w-32 md:h-32 mx-auto animate-pulse" alt="LuvBees" />
            <h1 className="text-4xl md:text-6xl font-serif italic text-[#DA3A36]">Age Verification</h1>
            <p className="text-[#4A0404] text-lg md:text-xl font-medium leading-relaxed">
              This website promotes products of an intimate nature.<br />
              Are you 18 years of age or older?
            </p>
            <div className="flex flex-col md:flex-row gap-4 md:gap-6 justify-center pt-4">
              <button onClick={() => handleAgeVerify(true)} className="bg-[#DA3A36] text-white px-8 md:px-12 py-4 md:py-5 rounded-full font-bold uppercase tracking-widest text-sm md:text-lg hover:scale-105 transition shadow-xl border-2 border-[#F6D55F]">
                Yes, I am 18+
              </button>
              <button onClick={() => handleAgeVerify(false)} className="bg-white text-[#DA3A36] px-8 md:px-12 py-4 md:py-5 rounded-full font-bold uppercase tracking-widest text-sm md:text-lg hover:scale-105 transition shadow-xl border-2 border-[#DA3A36]">
                No, Exit
              </button>
            </div>
            <p className="text-[10px] opacity-50 uppercase tracking-widest">By entering, you agree to our terms of service.</p>
          </div>
        </div>
      )}

      {/* Marquee Flashnews */}
      <div className="bg-[#DA3A36] text-[#F6D55F] py-2 text-xs font-bold uppercase tracking-widest overflow-hidden shadow-md sticky top-0 z-[60]">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...Array(10)].map((_, i) => (
            <span key={i} className="px-8 flex items-center gap-2">{flashnews.text} •</span>
          ))}
        </div>
      </div>

      <nav className="sticky top-[32px] z-50 bg-[#F4E6C5]/90 backdrop-blur-md border-b border-[#DA3A36]/10 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setView('home')}>
          <img src="/luvbees.png" className="w-10 h-10 object-contain drop-shadow-md group-hover:scale-110 transition" alt="LuvBees" />
          <span className="text-2xl font-serif tracking-widest uppercase text-[#DA3A36]">LuvBees</span>
        </div>

        <div className="hidden md:flex gap-8 text-[10px] uppercase font-bold tracking-widest opacity-60">
          <button onClick={() => setView('chocolate-shop')} className={`hover:text-[#DA3A36] ${view === 'chocolate-shop' ? 'text-[#DA3A36] underline underline-offset-4' : ''}`}>Chocolates</button>
          <button onClick={() => setView('gift-shop')} className={`hover:text-[#DA3A36] ${view === 'gift-shop' ? 'text-[#DA3A36] underline underline-offset-4' : ''}`}>Gifts & Extras</button>
        </div>

        <div className="flex gap-4 items-center">
          <button onClick={() => setView('cart')} className="relative p-2 text-[#DA3A36] hover:bg-white/40 rounded-full transition">
            <ShoppingBag />
            {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-[#F6D55F] text-black text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center animate-bounce shadow-md">{cart.reduce((a, b) => a + b.qty, 0)}</span>}
          </button>

        </div>
      </nav>

      <main>
        {view === 'home' && <HomeView products={products} setView={setView} addToCart={addToCart} media={media} faqs={faqs} setProduct={(p) => { setSelectedProduct(p); setView('product'); }} />}
        {view === 'chocolate-shop' && <ShopView products={products} addToCart={addToCart} setProduct={(p) => { setSelectedProduct(p); setView('product'); }} filter="Chocolates" />}
        {view === 'gift-shop' && <ShopView products={products} addToCart={addToCart} setProduct={(p) => { setSelectedProduct(p); setView('product'); }} filter="Gifts" />}
        {view === 'product' && <ProductDetailView product={selectedProduct} addToCart={addToCart} setView={setView} />}
        {view === 'cart' && <CartView cart={cart} setView={setView} subtotal={subtotal} shipCost={shipCost} grandTotal={grandTotal} delivery={delivery} remove={(id) => setCart(cart.filter(i => i.id !== id))} clearCart={clearCart} />}
        {view === 'admin' && (adminLoggedIn ? <AdminPanel products={products} flashnews={flashnews} media={media} faqs={faqs} delivery={delivery} reloadData={reloadData} /> : <AdminLoginView onLogin={() => setAdminLoggedIn(true)} />)}
        {view === 'success' && <SuccessView setView={setView} />}
        {view === 'privacy' && <PrivacyView setView={setView} />}
        {view === 'terms' && <TermsView setView={setView} />}
        {view === 'returns' && <ReturnView setView={setView} />}
      </main>

      <footer className="bg-[#FED3C7] border-t border-[#DA3A36]/10 py-8 px-6 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex justify-center gap-2 items-center text-[#DA3A36]">
            <Heart size={20} fill="currentColor" />
            <h2 className="text-3xl font-serif uppercase tracking-widest">LuvBees</h2>
            <Heart size={20} fill="currentColor" />
          </div>

          <div className="flex justify-center gap-6">
            <a href="https://www.facebook.com/people/LuvBees/61578752128120/" target="_blank" rel="noreferrer" className="text-[#DA3A36] hover:scale-110 transition p-2 bg-white/50 rounded-full"><Facebook size={20} /></a>
            <a href="https://www.instagram.com/luvbeesofficial" target="_blank" rel="noreferrer" className="text-[#DA3A36] hover:scale-110 transition p-2 bg-white/50 rounded-full"><Instagram size={20} /></a>
          </div>

          <div className="flex justify-center flex-wrap gap-4 md:gap-8 text-[10px] uppercase font-bold tracking-widest opacity-50">
            <button onClick={() => setView('privacy')} className="hover:text-[#DA3A36] transition">Privacy Policy</button>
            <button onClick={() => setView('terms')} className="hover:text-[#DA3A36] transition">Terms & Conditions</button>
            <button onClick={() => setView('returns')} className="hover:text-[#DA3A36] transition">Return Policy</button>
          </div>

          <p className="text-xs opacity-60 tracking-widest pt-4">care.luvbees@gmail.com • Feed the Flame, Naturally</p>
          <div className="pt-8 border-t border-black/5 text-[10px] opacity-40 uppercase tracking-widest">&copy; 2025 LuvBees • Developed with ❤️ by <a href="https://darkpixels.in" target="_blank" className="font-bold underline hover:text-[#DA3A36] transition">DARKPIXELS</a></div>
        </div>
      </footer>
    </div>
  );
}

const getImage = (p) => {
  try {
    const j = JSON.parse(p.imageUrl);
    return Array.isArray(j) && j.length > 0 ? j[0] : p.imageUrl;
  } catch { return p.imageUrl; }
};

const BadgeItem = ({ icon, label }) => {
  return (
    <div className="flex flex-col items-center gap-2 md:gap-6 group">
      <div className="w-10 h-10 md:w-20 md:h-20 rounded-full bg-white flex items-center justify-center border border-dashed md:border-2 border-[#DA3A36] group-hover:rotate-12 transition-transform shadow-sm">
        <span className="text-[#DA3A36]">{icon}</span>
      </div>
      <span className="text-[6px] md:text-[10px] font-bold uppercase tracking-[0.1em] md:tracking-[0.2em] opacity-50 text-center line-clamp-2">{label}</span>
    </div>
  );
};;

const HeroSection = ({ media, setView }) => {
  const [hIdx, setHIdx] = useState(0);
  useEffect(() => {
    if (!media.heroImages?.length || media.heroImages.length <= 1) return;
    const t = setInterval(() => setHIdx(p => (p + 1) % media.heroImages.length), 5000);
    return () => clearInterval(t);
  }, [media.heroImages]);

  return (
    <section className="relative h-[85vh] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 opacity-5 pointer-events-none z-10">
        <svg width="100%" height="100%"><pattern id="hp" width="100" height="100" patternUnits="userSpaceOnUse"><path d="M50 80 C20 60 0 40 0 20 C0 10 10 0 20 0 C30 0 40 10 50 20 C60 10 70 0 80 0 C90 0 100 10 100 20 C100 40 80 60 50 80 Z" fill={THEME.primaryRed} transform="scale(0.3) translate(50, 50)" /></pattern><rect width="100%" height="100%" fill="url(#hp)" /></svg>
      </div>
      {(media.heroImages || []).map((img, i) => (
        <div key={i} className={`absolute inset-0 transition-opacity duration-1000 ${i === hIdx ? 'opacity-50' : 'opacity-0'}`}>
          <img src={img} className="w-full h-full object-cover scale-110" alt="" loading="eager" decoding="async" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#F4E6C5]/40 via-transparent to-[#F4E6C5]" />
        </div>
      ))}
      <div className="relative z-20 text-center px-6 max-w-4xl space-y-8 animate-in slide-in-from-bottom-10 duration-1000">
        <div className="flex justify-center"><img src="/heart-flame.png" className="w-32 h-32 object-contain animate-pulse drop-shadow-xl" alt="" /></div>
        <h1 className="text-6xl md:text-9xl font-serif italic text-[#DA3A36] leading-tight text-shadow">Feed the Flame, Naturally</h1>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button onClick={() => setView('chocolate-shop')} className="bg-[#DA3A36] text-white px-6 py-4 md:px-10 md:py-5 rounded-full font-bold uppercase tracking-[0.2em] border-2 border-[#F6D55F] shadow-2xl hover:scale-105 transition active:scale-95 text-[10px] flex items-center justify-center gap-2"><Coffee size={14} /> Chocolate Sanctuary</button>
          <button onClick={() => setView('gift-shop')} className="bg-white text-[#DA3A36] px-6 py-4 md:px-10 md:py-5 rounded-full font-bold uppercase tracking-[0.2em] border-2 border-[#DA3A36] shadow-2xl hover:scale-105 transition active:scale-95 text-[10px] flex items-center justify-center gap-2"><Gift size={14} /> Gift Boutique</button>
        </div>
      </div>
    </section>
  );
};

function HomeView({ products, setView, addToCart, media, faqs, setProduct }) {
  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-700">
      <HeroSection media={media} setView={setView} />

      <section className="px-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-px bg-[#DA3A36]/30"></div>
          <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-[#DA3A36]">Moment Movements</h3>
          <div className="flex-1 h-px bg-[#DA3A36]/20"></div>
        </div>
        <CustomSlider items={media.momentImages} aspect="portrait" />
      </section>

      <section className="px-6 max-w-7xl mx-auto space-y-16">
        <div className="text-center space-y-2">
          <h2 className="text-5xl font-serif italic text-[#DA3A36]">Chocolate Sanctuary</h2>
          <p className="text-[10px] uppercase font-bold tracking-[0.3em] opacity-40">Our Viral Vitality Chocolates</p>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-3 gap-2 md:gap-10 px-0 md:px-0">
          {products.filter(p => p.active && p.category === 'Chocolates').slice(0, 3).map(p => (
            <div key={p.id} className="bg-white rounded-[1rem] md:rounded-[2rem] p-2 md:p-6 shadow-sm hover:shadow-2xl transition-all flex flex-col group h-full border border-[#FED3C7]/30">
              <div className="relative overflow-hidden rounded-lg md:rounded-2xl mb-2 md:mb-6 aspect-square shadow-inner cursor-pointer" onClick={() => setProduct(p)}>
                <img src={getImage(p)} alt="" className="w-full h-full object-cover group-hover:scale-110 transition duration-700" loading="lazy" decoding="async" />
              </div>
              <h3 className="text-[10px] md:text-2xl font-serif text-[#4A0404] cursor-pointer line-clamp-1 md:line-clamp-none" onClick={() => setProduct(p)}>{p.name}</h3>
              <p className="hidden md:block text-sm opacity-60 italic flex-grow my-4 line-clamp-2 leading-relaxed">{p.description}</p>
              <div className="flex items-end gap-1 md:gap-3 mb-2 md:mb-8 mt-1 md:mt-0">
                <div className="text-xs md:text-3xl font-bold text-[#DA3A36] italic leading-none">₹{p.price}</div>
                {p.regularPrice > p.price && <div className="text-[8px] md:text-sm line-through opacity-20 font-normal mb-0.5">₹{p.regularPrice}</div>}
              </div>
              <button onClick={() => addToCart(p)} className="w-full bg-[#DA3A36] text-white py-2 md:py-5 rounded-lg md:rounded-2xl font-bold uppercase tracking-widest active:scale-95 transition shadow-lg hover:bg-[#E97D78] flex items-center justify-center gap-1 md:gap-2 group-hover:shadow-[#DA3A36]/20 text-[6px] md:text-sm">
                <ShoppingBag size={10} className="md:w-[18px] md:h-[18px]" /> <span className="hidden md:inline">Buy Now</span><span className="md:hidden">Buy</span>
              </button>
            </div>
          ))}
        </div>
        <div className="text-center pt-8"><button onClick={() => setView('chocolate-shop')} className="inline-flex items-center gap-3 border-2 border-[#DA3A36] text-[#DA3A36] px-12 py-5 rounded-full font-bold uppercase text-xs hover:bg-[#DA3A36] hover:text-white transition shadow-xl group">Explore All Chocolates</button></div>
      </section>

      <section className="px-6 max-w-7xl mx-auto space-y-16">
        <div className="text-center space-y-2">
          <h2 className="text-5xl font-serif italic text-[#DA3A36]">Gift Boutique</h2>
          <p className="text-[10px] uppercase font-bold tracking-[0.3em] opacity-40">Curated Intimacy Essentials</p>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-3 gap-2 md:gap-10 px-0 md:px-0">
          {products.filter(p => p.active && p.category === 'Gifts').slice(0, 3).map(p => (
            <div key={p.id} className="bg-white rounded-[1rem] md:rounded-[2rem] p-2 md:p-6 shadow-sm hover:shadow-2xl transition-all flex flex-col group h-full border border-[#FED3C7]/30">
              <div className="relative overflow-hidden rounded-lg md:rounded-2xl mb-2 md:mb-6 aspect-square shadow-inner cursor-pointer" onClick={() => setProduct(p)}>
                <img src={getImage(p)} alt="" className="w-full h-full object-cover group-hover:scale-110 transition duration-700" loading="lazy" decoding="async" />
              </div>
              <h3 className="text-[10px] md:text-2xl font-serif text-[#4A0404] cursor-pointer line-clamp-1 md:line-clamp-none" onClick={() => setProduct(p)}>{p.name}</h3>
              <p className="hidden md:block text-sm opacity-60 italic flex-grow my-4 line-clamp-2 leading-relaxed">{p.description}</p>
              <div className="flex items-end gap-1 md:gap-3 mb-2 md:mb-8 mt-1 md:mt-0">
                <div className="text-xs md:text-3xl font-bold text-[#DA3A36] italic leading-none">₹{p.price}</div>
                {p.regularPrice > p.price && <div className="text-[8px] md:text-sm line-through opacity-20 font-normal mb-0.5">₹{p.regularPrice}</div>}
              </div>
              <button onClick={() => addToCart(p)} className="w-full bg-[#DA3A36] text-white py-2 md:py-5 rounded-lg md:rounded-2xl font-bold uppercase tracking-widest active:scale-95 transition shadow-lg hover:bg-[#E97D78] flex items-center justify-center gap-1 md:gap-2 group-hover:shadow-[#DA3A36]/20 text-[6px] md:text-sm">
                <ShoppingBag size={10} className="md:w-[18px] md:h-[18px]" /> <span className="hidden md:inline">Buy Now</span><span className="md:hidden">Buy</span>
              </button>
            </div>
          ))}
        </div>
        <div className="text-center pt-8"><button onClick={() => setView('gift-shop')} className="inline-flex items-center gap-3 border-2 border-[#DA3A36] text-[#DA3A36] px-12 py-5 rounded-full font-bold uppercase text-xs hover:bg-[#DA3A36] hover:text-white transition shadow-xl group">Explore Gift Boutique</button></div>
      </section>
      <section className="px-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-px bg-[#DA3A36]/30"></div>
          <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-[#DA3A36]">Storytelling Gallery</h3>
          <div className="flex-1 h-px bg-[#DA3A36]/20"></div>
        </div>
        <CustomSlider items={media.galleryVideos} type="video" aspect="portrait" />
      </section>
      <section className="bg-[#FED3C7]/40 py-12 md:py-20 px-6 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 p-20 opacity-5 -rotate-12 pointer-events-none"><Sparkles size={400} className="text-[#DA3A36]" /></div>
        <div className="max-w-5xl mx-auto text-center space-y-16">
          <h2 className="text-5xl font-serif italic text-[#DA3A36]">Explore The Ingredients</h2>
          <div className="grid grid-cols-3 md:grid-cols-3 gap-2 md:gap-10 relative z-10 px-0">
            {[{ n: 'Dark Choc', d: 'Mood', i: '🍫' }, { n: 'Ashwa', d: 'Stress', i: '🌿' }, { n: 'Maca', d: 'Vitality', i: '💪' }].map(ing => (
              <div key={ing.n} className="p-4 md:p-10 bg-white rounded-[1.5rem] md:rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all border border-[#FED3C7] group text-center">
                <div className="text-2xl md:text-5xl mb-2 md:mb-6">{ing.i}</div>
                <h4 className="font-serif text-[10px] md:text-2xl text-[#DA3A36] italic leading-tight">{ing.n}</h4>
                <p className="text-[6px] md:text-xs opacity-60 uppercase font-bold tracking-tighter mt-1 md:mt-4">{ing.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="px-6 max-w-4xl mx-auto py-12">
        <h2 className="text-4xl font-serif italic text-[#4A0404] mb-12">Common Inquiries</h2>
        <div className="space-y-1">{faqs.map((f, i) => <AccordionItem key={i} q={f.question} a={f.answer} />)}</div>
      </section>
      <section className="bg-[#DA3A36] text-[#F4E6C5] py-16 md:py-24 px-6 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10 space-y-10">
          <h2 className="text-4xl md:text-6xl font-serif italic text-shadow">The Heart of LuvBees</h2>
          <p className="text-lg md:text-2xl leading-relaxed italic opacity-90 max-w-3xl mx-auto">"LuvBees was born from a desire to transform simple connection into unforgettable experiences."</p>
        </div>
      </section>
      <section className="px-6 max-w-6xl mx-auto py-12 md:py-20">
        <h2 className="text-3xl font-serif text-center mb-10 md:mb-16 italic text-[#4A0404]/80">We are Certified</h2>
        <div className="grid grid-cols-4 md:grid-cols-4 gap-2 md:gap-12 px-0">
          <BadgeItem icon={<ShieldCheck className="w-6 h-6 md:w-9 md:h-9" />} label="Secure SSL" />
          <BadgeItem icon={<Award className="w-6 h-6 md:w-9 md:h-9" />} label="Quality" />
          <BadgeItem icon={<MapPin className="w-6 h-6 md:w-9 md:h-9" />} label="Made In India" />
          <BadgeItem icon={<Truck className="w-6 h-6 md:w-9 md:h-9" />} label="Fast Delivery" />
        </div>
      </section>

      <section className="px-6 max-w-5xl mx-auto pb-8 text-center opacity-50 space-y-2 animate-in fade-in slide-in-from-bottom-5">
        <div className="w-12 h-px bg-[#DA3A36]/30 mx-auto"></div>
        <div className="text-[10px] leading-relaxed text-[#4A0404]">
          <strong className="block mb-2 text-xs uppercase tracking-widest font-black">⚠ Disclaimer</strong>
          <span className="opacity-70 font-medium">This product is not intended to diagnose, treat, cure, or prevent any disease. The statements regarding the ingredients are based on clinical studies referenced above. Individual results may vary. Consult your physician if you are pregnant, nursing, or have a medical condition before consuming this product. Keep out of reach of children.</span>
        </div>
      </section>
    </div>
  );
}

function ShopView({ products, addToCart, setProduct, filter }) {
  const filtered = products.filter(p => p.active && p.category === filter);
  return (
    <div className="max-w-7xl mx-auto px-6 py-24 min-h-screen space-y-16 animate-in fade-in slide-in-from-bottom-5 duration-500">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-serif italic text-[#DA3A36]">{filter === 'Chocolates' ? 'Chocolate Sanctuary' : 'Gift Boutique'}</h1>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        {filtered.map(p => (
          <div key={p.id} className="bg-white rounded-[2rem] p-6 shadow-sm flex flex-col h-full hover:shadow-2xl transition-all group border border-[#FED3C7]/20">
            <div className="relative overflow-hidden rounded-2xl mb-6 aspect-square shadow-inner cursor-pointer" onClick={() => setProduct(p)}>
              <img src={getImage(p)} alt="" className="w-full h-full object-cover group-hover:scale-110 transition duration-700" />
            </div>
            <h3 className="font-serif text-xl text-[#4A0404] cursor-pointer" onClick={() => setProduct(p)}>{p.name}</h3>
            <p className="text-[10px] opacity-50 italic my-3 line-clamp-3 leading-relaxed">{p.description}</p>
            <div className="mt-auto mb-6 flex items-center gap-2">
              <span className="text-2xl font-bold text-[#DA3A36] italic">₹{p.price}</span>
            </div>
            <button onClick={() => addToCart(p)} className="w-full bg-[#DA3A36] text-white py-4 rounded-2xl font-bold uppercase text-[10px] shadow-lg active:scale-95 transition tracking-widest">Add to Cart</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductDetailView({ product, addToCart, setView }) {
  const [activeImg, setActiveImg] = useState(0);
  if (!product) return null;
  let images = [product.imageUrl];
  try {
    const parsed = JSON.parse(product.imageUrl);
    if (Array.isArray(parsed) && parsed.length > 0) images = parsed;
  } catch (e) { }

  return (
    <div className="max-w-6xl mx-auto px-6 py-20 min-h-[80vh] animate-in fade-in zoom-in duration-500">
      <button onClick={() => setView(product.category === 'Chocolates' ? 'chocolate-shop' : 'gift-shop')} className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest opacity-40 hover:opacity-100 mb-12 transition"><ArrowLeft size={16} /> Back to Catalog</button>
      <div className="grid md:grid-cols-2 gap-16 items-start">
        <div className="space-y-6">
          <div className="rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white aspect-square relative group bg-white">
            <img src={images[activeImg]} className="w-full h-full object-cover transition duration-500" alt={product.name} />
          </div>
          {images.length > 1 && (
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
              {images.map((img, i) => (
                <button key={i} onClick={() => setActiveImg(i)} className={`flex-shrink-0 w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all shadow-sm snap-start ${activeImg === i ? 'border-[#DA3A36] scale-105 shadow-md' : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'}`}>
                  <img src={img} className="w-full h-full object-cover" alt="" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="space-y-10 sticky top-32">
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-[0.4em] text-[#DA3A36] opacity-60">{product.category}</span>
            <h1 className="text-5xl md:text-7xl font-serif italic leading-tight text-[#4A0404]">{product.name}</h1>
            <div className="flex items-center gap-4 pt-2">
              <span className="text-4xl font-bold text-[#DA3A36] italic">₹{product.price}</span>
              {product.regularPrice > product.price && <span className="text-xl line-through opacity-30">₹{product.regularPrice}</span>}
            </div>
          </div>
          <div className="p-8 bg-white rounded-[2rem] border border-[#FED3C7] shadow-inner space-y-4 leading-loose text-lg text-[#4A0404]/80">
            <p className="italic">{product.description}</p>
          </div>
          <button onClick={() => addToCart(product)} className="w-full bg-[#DA3A36] text-white py-6 rounded-[2rem] font-bold uppercase tracking-[0.2em] shadow-2xl hover:bg-[#E97D78] transition flex items-center justify-center gap-3 active:scale-95 text-lg border-2 border-[#F6D55F]">
            <ShoppingBag /> Add to Cart
          </button>

          <div className="grid grid-cols-3 gap-4 pt-8 border-t border-[#DA3A36]/10">
            <div className="text-center space-y-2">
              <Truck className="mx-auto text-[#DA3A36] opacity-50" />
              <div className="text-[10px] uppercase font-bold tracking-widest opacity-60">Fast Delivery</div>
            </div>
            <div className="text-center space-y-2">
              <ShieldCheck className="mx-auto text-[#DA3A36] opacity-50" />
              <div className="text-[10px] uppercase font-bold tracking-widest opacity-60">Secure Pay</div>
            </div>
            <div className="text-center space-y-2">
              <Award className="mx-auto text-[#DA3A36] opacity-50" />
              <div className="text-[10px] uppercase font-bold tracking-widest opacity-60">Top Quality</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CartView({ cart, setView, subtotal, shipCost, grandTotal, delivery, remove, clearCart }) {
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', address: '' });
  const [isOrdering, setIsOrdering] = useState(false);

  useEffect(() => {
    loadScript('https://checkout.razorpay.com/v1/checkout.js');
  }, []);

  const handleCheckout = async () => {
    if (!formData.name || !formData.phone || !formData.email || !formData.address) return;
    setIsOrdering(true);
    try {
      const orderData = {
        customer: formData,
        items: cart,
        subtotal,
        shipCost,
        total: grandTotal,
        status: 'Pending'
      };

      // 1. Create Razorpay Order on Backend
      const rzOrderRes = await axios.post('/api/create-razorpay-order', { amount: grandTotal });
      const rzOrder = rzOrderRes.data;

      const options = {
        key: "rzp_test_SCpWIopZe4wkSQ", // Test Key Configured
        amount: rzOrder.amount,
        currency: rzOrder.currency,
        name: "LuvBees",
        description: "Feed the Flame",
        order_id: rzOrder.id,
        handler: async function (response) {
          // 2. On Success, Save Order to DB
          await axios.post('/api/orders', { ...orderData, paymentId: response.razorpay_payment_id });
          clearCart();
          setView('success');
        },
        prefill: {
          name: formData.name,
          contact: formData.phone
        },
        theme: { color: "#DA3A36" }
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.on('payment.failed', function (response) {
        alert("Payment Failed: " + response.error.description);
        setIsOrdering(false);
      });
      rzp1.open();

    } catch (err) {
      console.error("Order processing error", err);
      alert("Could not initiate payment. (Check backend/Razorpay keys)");
      setIsOrdering(false);
    }
  };

  if (cart.length === 0) return (
    <div className="h-[70vh] flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-700">
      <ShoppingBag size={80} className="opacity-10" />
      <h2 className="font-serif text-3xl italic text-[#4A0404]/40 uppercase tracking-widest">Your selection is empty</h2>
      <button onClick={() => setView('home')} className="bg-[#DA3A36] text-white px-16 py-4 rounded-full uppercase text-xs font-bold shadow-2xl hover:scale-110 transition border-2 border-[#F6D55F]">Return to Store</button>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-6 py-24 min-h-screen grid lg:grid-cols-2 gap-20 animate-in fade-in slide-in-from-bottom-5 duration-700">
      <div className="space-y-12">
        <h1 className="text-4xl font-serif italic text-[#DA3A36]">Your Selection</h1>
        <div className="space-y-6">
          {cart.map(i => (
            <div key={i.id} className="bg-white p-6 rounded-[2rem] flex items-center gap-6 shadow-sm border border-[#FED3C7]/30 relative">
              <img src={i.imageUrl} className="w-24 h-24 object-cover rounded-2xl" alt="" />
              <div className="flex-1">
                <h4 className="font-serif text-xl">{i.name}</h4>
                <p className="text-xs opacity-30 italic">Qty: {i.qty}</p>
                <div className="font-bold text-[#DA3A36] text-lg">₹{i.price * i.qty}</div>
              </div>
              <button onClick={() => remove(i.id)} className="absolute -top-2 -right-2 bg-white text-red-400 p-3 rounded-full shadow-lg border border-[#FED3C7]"><Trash2 size={18} /></button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-10">
        <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-[#DA3A36]/10 space-y-10 relative">
          <h3 className="font-serif text-3xl italic text-[#DA3A36]">Guest Checkout</h3>
          <div className="space-y-4">
            <input placeholder="Full Name" className="w-full p-4 rounded-2xl bg-[#F4E6C5]/20 border border-[#FED3C7] outline-none" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            <div className="grid md:grid-cols-2 gap-4">
              <input placeholder="Phone" className="w-full p-4 rounded-2xl bg-[#F4E6C5]/20 border border-[#FED3C7] outline-none" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
              <input placeholder="Email" className="w-full p-4 rounded-2xl bg-[#F4E6C5]/20 border border-[#FED3C7] outline-none" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
            </div>
            <textarea placeholder="Shipping Address" className="w-full p-4 rounded-2xl bg-[#F4E6C5]/20 border border-[#FED3C7] outline-none min-h-[120px]" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
          </div>

          <div className="space-y-4 pt-8 border-t border-[#DA3A36]/10">
            <div className="flex justify-between text-xs font-bold uppercase opacity-40"><span>Subtotal</span><span>₹{subtotal}</span></div>
            <div className="flex justify-between items-center text-xs font-bold uppercase">
              <span className="opacity-40">Delivery {subtotal < delivery.threshold && <span className="text-[8px] text-[#DA3A36] italic">(Add ₹{delivery.threshold - subtotal} for free)</span>}</span>
              <span className={shipCost === 0 ? "text-green-600 font-bold" : "opacity-40"}>{shipCost === 0 ? 'FREE' : `₹${shipCost}`}</span>
            </div>
            <div className="text-4xl font-serif text-[#DA3A36] pt-6 flex justify-between italic items-end">
              <span>Total</span>
              <div className="text-right">
                <span>₹{grandTotal}</span>
              </div>
            </div>
            {delivery.note && (
              <div className="text-[10px] text-[#DA3A36] font-bold uppercase tracking-widest bg-[#DA3A36]/5 p-3 rounded-lg text-center animate-pulse">
                {delivery.note}
              </div>
            )}
          </div>

          <button
            onClick={handleCheckout}
            disabled={!formData.name || !formData.phone || !formData.email || !formData.address || isOrdering}
            className="w-full bg-[#DA3A36] text-white py-6 rounded-[2rem] font-bold uppercase shadow-2xl disabled:opacity-30 border-2 border-[#F6D55F] transition-all"
          >
            {isOrdering ? 'Processing...' : 'Complete via Razorpay'}
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminPanel({ products, flashnews, media, faqs, delivery, reloadData }) {
  const [tab, setTab] = useState('inventory');
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null); // Updated State
  const [form, setForm] = useState({ name: '', price: 0, regularPrice: 0, description: '', imageUrl: '', category: 'Chocolates', active: true });
  const [orders, setOrders] = useState([]);

  // Local states
  const [nForm, setNForm] = useState(flashnews);
  const [mForm, setMForm] = useState(media);
  const [fForm, setFaqForm] = useState(faqs);
  const [dForm, setDForm] = useState(delivery);

  useEffect(() => {
    // Load orders
    axios.get('/api/orders').then(res => setOrders(res.data)).catch(console.error);
    setNForm(flashnews); setMForm(media); setFaqForm(faqs); setDForm(delivery);
  }, [flashnews, media, faqs, delivery, tab]);

  const saveConfig = async (key, val) => {
    try {
      await axios.post(`/api/configs/${key}`, val);
      alert("Config Updated!");
      reloadData();
    } catch (e) { alert("Error saving config"); }
  };

  const uploadFile = async (file) => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await axios.post('/api/upload', fd);
    return res.data.url;
  };

  /* New State for Uploading Logic */
  const [uploading, setUploading] = useState(null);

  const addMediaUrl = async (k) => {
    const u = prompt(`Enter URL:`);
    if (u) setMForm({ ...mForm, [k]: [...(mForm[k] || []), u] });
  };

  const uploadMedia = (k) => {
    const input = document.createElement('input'); input.type = 'file';
    input.accept = k === 'galleryVideos' ? 'video/*' : 'image/*';
    input.onchange = async e => {
      if (e.target.files[0]) {
        setUploading(k);
        try {
          const url = await uploadFile(e.target.files[0]);
          setMForm(p => ({ ...p, [k]: [...(p[k] || []), url] }));
        } catch (err) { alert("Upload failed"); }
        finally { setUploading(null); }
      }
    };
    input.click();
  };
  const rmMedia = async (k, i) => {
    const newList = mForm[k].filter((_, idx) => idx !== i);
    const newConfig = { ...mForm, [k]: newList };
    setMForm(newConfig);
    // Auto-save to reflect changes immediately
    await saveConfig('media', newConfig);
  };

  const startEdit = (p) => {
    setEditingId(p.id);
    let imgs = [];
    try {
      const parsed = JSON.parse(p.imageUrl);
      if (Array.isArray(parsed)) imgs = parsed;
      else if (p.imageUrl) imgs = [p.imageUrl];
    } catch {
      if (p.imageUrl) imgs = [p.imageUrl];
    }
    if (imgs.length === 0) imgs = [''];

    setForm({ ...p, images: imgs });
    setAdding(true);
  };

  const saveProduct = async (e) => {
    e.preventDefault();
    try {
      let finalImages = form.images || (form.imageUrl ? [form.imageUrl] : []);
      // Limit to 3 images
      finalImages = finalImages.slice(0, 3).filter(i => i && i.trim() !== '');

      const payload = {
        ...form,
        price: parseFloat(form.price),
        regularPrice: parseFloat(form.regularPrice),
        imageUrl: finalImages.length > 0 ? JSON.stringify(finalImages) : ''
      };
      // Remove temporary images array from payload
      if ('images' in payload) delete payload.images;

      if (editingId) {
        await axios.put(`/api/products/${editingId}`, payload);
      } else {
        await axios.post('/api/products', payload);
      }
      setAdding(false);
      setEditingId(null);
      setForm({ name: '', price: 0, regularPrice: 0, description: '', imageUrl: '', images: [], category: 'Chocolates', active: true });
      reloadData();
    } catch (err) { alert("Failed to save product"); }
  };

  const deleteProduct = async (id) => {
    if (confirm("Delete product?")) {
      await axios.delete(`/api/products/${id}`);
      reloadData();
    }
  };

  const updateOrderStatus = async (id, status) => {
    await axios.put(`/api/orders/${id}/status`, { status });
    const res = await axios.get('/api/orders'); setOrders(res.data);
  };
  const deleteOrder = async (id) => {
    if (confirm("Delete order?")) {
      await axios.delete(`/api/orders/${id}`);
      const res = await axios.get('/api/orders'); setOrders(res.data);
    }
  };

  const downloadPDF = (order) => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(218, 58, 54);
    doc.text("LUVBEES ORDER RECORD", 105, 20, { align: "center" });

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Order ID: #${order.id}`, 14, 35);
    doc.text(`Date: ${new Date(order.created_at || Date.now()).toLocaleString()}`, 14, 40);

    doc.setFontSize(14);
    doc.text("Customer Information", 14, 55);
    doc.setFontSize(10);
    doc.text(`Name: ${order.customer?.name || 'N/A'}`, 14, 62);
    doc.text(`Phone: ${order.customer?.phone || 'N/A'}`, 14, 67);
    doc.text(`Email: ${order.customer?.email || 'N/A'}`, 14, 72);
    doc.text(`Address: ${order.customer?.address || 'N/A'}`, 14, 77);

    autoTable(doc, {
      startY: 85,
      head: [['Product Name', 'Quantity', 'Price', 'Subtotal']],
      body: (order.items || []).map(item => [
        item.name,
        item.qty,
        `Rs. ${item.price}`,
        `Rs. ${item.price * item.qty}`
      ]),
      headStyles: { fillColor: [218, 58, 54] }
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text(`Total Amount: Rs. ${order.total}`, 14, finalY);
    doc.text(`Status: ${order.status}`, 14, finalY + 7);

    doc.save(`order_${order.id}.pdf`);
  };

  const downloadOrdersReport = (period) => {
    const now = new Date();
    let startDate, endDate, periodLabel;

    // Calculate date range based on period
    if (period === 'weekly') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
      endDate = now;
      periodLabel = 'Weekly Report (Last 7 Days)';
    } else if (period === 'monthly') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = now;
      periodLabel = `Monthly Report (${now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })})`;
    } else if (period === 'yearly') {
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = now;
      periodLabel = `Yearly Report (${now.getFullYear()})`;
    }

    // Filter orders by date range
    const filteredOrders = orders.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate >= startDate && orderDate <= endDate;
    });

    if (filteredOrders.length === 0) {
      alert(`No orders found for ${periodLabel.toLowerCase()}`);
      return;
    }

    // Calculate statistics
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + parseFloat(order.total || 0), 0);
    const totalOrders = filteredOrders.length;
    const avgOrderValue = totalRevenue / totalOrders;
    const statusCounts = filteredOrders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});

    // Generate PDF
    const doc = new jsPDF();

    // Header
    doc.setFontSize(26);
    doc.setTextColor(218, 58, 54);
    doc.text("LUVBEES", 105, 20, { align: "center" });

    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(periodLabel, 105, 30, { align: "center" });

    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text(`Generated: ${now.toLocaleString()}`, 105, 37, { align: "center" });

    // Summary Statistics Box with Background
    doc.setFillColor(254, 211, 199); // Light pink background (#FED3C7)
    doc.roundedRect(14, 45, 182, 45, 3, 3, 'F');

    // Border for the box
    doc.setDrawColor(218, 58, 54);
    doc.setLineWidth(0.5);
    doc.roundedRect(14, 45, 182, 45, 3, 3, 'S');

    // Title
    doc.setFontSize(14);
    doc.setTextColor(218, 58, 54);
    doc.text("SALES SUMMARY", 105, 53, { align: "center" });

    // Statistics in grid layout
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);

    // Row 1: Total Orders and Total Revenue
    doc.setFont(undefined, 'bold');
    doc.text("Total Orders:", 20, 64);
    doc.text("Total Revenue:", 110, 64);

    doc.setFont(undefined, 'normal');
    doc.setFontSize(16);
    doc.setTextColor(218, 58, 54);
    doc.text(`${totalOrders}`, 55, 64);
    doc.text(`₹${totalRevenue.toFixed(2)}`, 155, 64);

    // Row 2: Average Order Value and Status
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'bold');
    doc.text("Avg Order Value:", 20, 74);
    doc.text("Order Status:", 110, 74);

    doc.setFont(undefined, 'normal');
    doc.setFontSize(12);
    doc.setTextColor(218, 58, 54);
    doc.text(`₹${avgOrderValue.toFixed(2)}`, 55, 74);

    // Status counts (compact)
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    let statusText = Object.entries(statusCounts).map(([status, count]) => `${status}: ${count}`).join(' | ');
    doc.text(statusText, 145, 74);

    // Additional metrics row
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text("Period:", 20, 84);
    doc.setFont(undefined, 'normal');
    doc.text(`${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`, 42, 84);

    // Orders Table
    const tableData = filteredOrders.map(order => [
      `#${order.id}`,
      new Date(order.created_at).toLocaleDateString(),
      order.customer?.name || 'N/A',
      order.customer?.phone || 'N/A',
      (order.items || []).length + ' items',
      `₹${order.total}`,
      order.status
    ]);

    autoTable(doc, {
      startY: 98,
      head: [['Order ID', 'Date', 'Customer', 'Phone', 'Items', 'Total', 'Status']],
      body: tableData,
      headStyles: {
        fillColor: [218, 58, 54],
        fontSize: 9,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [254, 243, 231] }, // Light beige
      columnStyles: {
        0: { cellWidth: 18, fontStyle: 'bold' },
        1: { cellWidth: 25 },
        2: { cellWidth: 35 },
        3: { cellWidth: 25 },
        4: { cellWidth: 18 },
        5: { cellWidth: 22, fontStyle: 'bold', textColor: [218, 58, 54] },
        6: { cellWidth: 22 }
      }
    });

    // Footer with grand total
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFillColor(218, 58, 54);
    doc.roundedRect(14, finalY, 182, 15, 3, 3, 'F');

    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.setFont(undefined, 'bold');
    doc.text(`GRAND TOTAL: ₹${totalRevenue.toFixed(2)}`, 105, finalY + 10, { align: "center" });

    doc.save(`luvbees_${period}_report_${now.toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-24 min-h-screen space-y-12 animate-in fade-in duration-500">
      <div className="space-y-4">
        <h1 className="text-4xl font-serif text-[#DA3A36] flex items-center gap-3 italic"><Settings /> Command Console</h1>
        <div className="flex gap-3 border-b border-[#DA3A36]/10 pb-4 overflow-x-auto no-scrollbar scroll-smooth">
          {[
            { id: 'inventory', label: 'Inventory', icon: <Package size={14} /> },
            { id: 'orders', label: 'Orders', icon: <ClipboardList size={14} /> },
            { id: 'storefront', label: 'Marquee', icon: <Zap size={14} /> },
            { id: 'media', label: 'Media', icon: <ImageIcon size={14} /> },
            { id: 'shipping', label: 'Shipping', icon: <Truck size={14} /> },
            { id: 'faqs', label: 'FAQs', icon: <HelpCircle size={14} /> }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-8 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${tab === t.id ? 'bg-[#DA3A36] text-white shadow-xl scale-105' : 'bg-white/40 text-[#DA3A36]/50 hover:bg-white'}`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'inventory' && (
        <div className="space-y-10">
          <button onClick={() => { setAdding(true); setEditingId(null); setForm({ name: '', price: 0, regularPrice: 0, description: '', imageUrl: '', category: 'Chocolates', active: true }); }} className="bg-[#DA3A36] text-white px-10 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 shadow-2xl border-2 border-[#F6D55F] hover:scale-105 transition"><Plus size={20} /> Publish New Product</button>
          <div className="grid gap-6">
            {products.map(p => (
              <div key={p.id} className="bg-white border border-[#FED3C7] rounded-[2rem] p-6 flex items-center justify-between shadow-sm hover:shadow-md transition">
                <div className="flex items-center gap-6">
                  <img src={getImage(p)} className="w-20 h-20 object-cover rounded-2xl shadow-inner border" alt="" />
                  <div className="space-y-1">
                    <div className="font-serif text-2xl italic text-[#4A0404]">{p.name} <span className="text-[10px] bg-[#DA3A36]/10 text-[#DA3A36] px-3 py-1 rounded-full ml-2">{p.category}</span></div>
                    <div className="text-xs opacity-60">₹{p.price}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => startEdit(p)} className="text-[#DA3A36] p-4 hover:bg-orange-50 rounded-full transition border border-transparent hover:border-[#DA3A36]/20"><Settings size={22} /></button>
                  <button onClick={() => deleteProduct(p.id)} className="text-red-400 p-4 hover:bg-red-50 rounded-full transition"><Trash2 size={24} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'orders' && (
        <div className="space-y-8">
          {/* Report Download Section */}
          <div className="bg-white border border-[#DA3A36]/10 rounded-[2rem] p-8 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <h3 className="font-serif text-2xl text-[#DA3A36] italic mb-2">Download Orders Report</h3>
                <p className="text-sm opacity-60">Generate comprehensive sales reports for different time periods</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => downloadOrdersReport('weekly')}
                  className="flex items-center gap-2 bg-[#DA3A36]/10 text-[#DA3A36] px-6 py-3 rounded-full hover:bg-[#DA3A36] hover:text-white transition shadow-md text-xs font-bold uppercase"
                >
                  <Download size={16} />
                  Weekly
                </button>
                <button
                  onClick={() => downloadOrdersReport('monthly')}
                  className="flex items-center gap-2 bg-[#DA3A36]/10 text-[#DA3A36] px-6 py-3 rounded-full hover:bg-[#DA3A36] hover:text-white transition shadow-md text-xs font-bold uppercase"
                >
                  <Download size={16} />
                  Monthly
                </button>
                <button
                  onClick={() => downloadOrdersReport('yearly')}
                  className="flex items-center gap-2 bg-[#DA3A36]/10 text-[#DA3A36] px-6 py-3 rounded-full hover:bg-[#DA3A36] hover:text-white transition shadow-md text-xs font-bold uppercase"
                >
                  <Download size={16} />
                  Yearly
                </button>
              </div>
            </div>
          </div>

          {/* Orders List */}
          <div className="grid gap-8">
            {orders.map(order => (
              <div key={order.id} className="bg-white border border-[#FED3C7] rounded-[2.5rem] p-10 shadow-sm space-y-8 relative overflow-hidden">
                <div className="flex justify-between items-start">
                  <div className="space-y-4">
                    <h3 className="font-serif text-3xl text-[#DA3A36] italic">{order.customer?.name}</h3>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-1">
                        <div className="font-bold uppercase text-[10px] opacity-40">Contact Details</div>
                        <div className="opacity-70">{order.customer?.phone}</div>
                        <div className="opacity-70">{order.customer?.email || 'No Email'}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="font-bold uppercase text-[10px] opacity-40">Shipping Address</div>
                        <div className="opacity-70 leading-relaxed max-w-xs">{order.customer?.address}</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <select
                      onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                      value={order.status}
                      className="p-3 bg-[#F4E6C5]/30 rounded-xl text-xs font-bold border-none outline-none"
                    >
                      <option>Pending</option><option>Shipped</option><option>Delivered</option>
                    </select>
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => downloadPDF(order)} className="p-3 bg-[#DA3A36]/10 text-[#DA3A36] rounded-full hover:bg-[#DA3A36] hover:text-white transition shadow-sm"><Download size={18} /></button>
                      <button onClick={() => deleteOrder(order.id)} className="p-3 bg-red-50 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition shadow-sm"><Trash2 size={18} /></button>
                    </div>
                  </div>
                </div>

                <div className="border-t border-[#DA3A36]/5 pt-6">
                  <div className="font-bold uppercase text-[10px] opacity-40 mb-4">Ordered Items</div>
                  <div className="space-y-3">
                    {(order.items || []).map((it, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm">
                        <div className="flex gap-3 items-center">
                          <div className="w-8 h-8 bg-[#DA3A36]/5 rounded-lg flex items-center justify-center font-bold text-[#DA3A36] text-[10px]">{it.qty}x</div>
                          <span className="font-serif italic">{it.name}</span>
                        </div>
                        <span className="opacity-60">₹{it.price * it.qty}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-6 border-t border-[#DA3A36]/5">
                  <div className="text-[10px] uppercase font-bold opacity-30">Order Total</div>
                  <div className="text-3xl font-serif italic text-[#DA3A36]">₹{order.total}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
      }

      {
        tab === 'media' && (
          <div className="grid md:grid-cols-2 gap-12">
            {['heroImages', 'momentImages', 'galleryVideos'].map(k => (
              <div key={k} className="bg-white p-10 rounded-[3rem] border border-[#DA3A36]/10 shadow-xl space-y-8">
                <div className="flex justify-between items-center text-xs font-bold uppercase text-[#DA3A36]">
                  <span>{k}</span>
                  <div className="flex gap-2">
                    {uploading === k ? (
                      <div className="flex items-center gap-2 text-[#DA3A36] animate-pulse">
                        <Zap size={18} className="animate-spin" /> Uploading...
                      </div>
                    ) : (
                      <>
                        <button onClick={() => addMediaUrl(k)} className="p-2 bg-[#DA3A36] text-white rounded-full" title="Add URL"><Plus size={18} /></button>
                        <button onClick={() => uploadMedia(k)} className="p-2 bg-[#DA3A36] text-white rounded-full" title="Upload File"><Upload size={18} /></button>
                      </>
                    )}
                  </div>
                </div>
                {(mForm[k] || []).map((u, i) => <div key={i} className="flex justify-between items-center p-2"><span className="truncate w-64">{u}</span><button onClick={() => rmMedia(k, i)}><Trash2 /></button></div>)}
                <button onClick={() => saveConfig('media', mForm)} className="bg-[#DA3A36] text-white px-4 py-2 rounded-xl">Save</button>
              </div>
            ))}
          </div>
        )
      }

      {
        tab === 'shipping' && (
          <div className="bg-white p-12 rounded-[3rem] border border-[#DA3A36]/10 shadow-2xl max-w-xl mx-auto space-y-10 text-center">
            <h3 className="font-serif text-3xl text-[#DA3A36] italic">Delivery Logistics</h3>
            <div className="space-y-8 text-left">
              <div>
                <label className="text-[10px] uppercase font-bold opacity-40 ml-2">Shipping Fee (₹)</label>
                <input type="number" className="w-full p-6 rounded-[1.5rem] bg-[#F4E6C5]/20 border border-[#FED3C7]" value={dForm.fee} onChange={e => setDForm({ ...dForm, fee: parseInt(e.target.value) || 0 })} />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold opacity-40 ml-2">Free Threshold (₹)</label>
                <input type="number" className="w-full p-6 rounded-[1.5rem] bg-[#F4E6C5]/20 border border-[#FED3C7]" value={dForm.threshold} onChange={e => setDForm({ ...dForm, threshold: parseInt(e.target.value) || 0 })} />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold opacity-40 ml-2">Delivery Note (Broadcasted at Checkout)</label>
                <textarea
                  className="w-full p-6 rounded-[1.5rem] bg-[#F4E6C5]/20 border border-[#FED3C7] text-xs leading-relaxed"
                  placeholder="e.g. Buy above ₹500 get Free Delivery"
                  rows={3}
                  value={dForm.note || ''}
                  onChange={e => setDForm({ ...dForm, note: e.target.value })}
                ></textarea>
              </div>
              <button onClick={() => saveConfig('delivery', dForm)} className="w-full bg-[#DA3A36] text-white py-5 rounded-[1.5rem] font-bold uppercase tracking-widest shadow-xl border-2 border-[#F6D55F]">Sync Shipping Rules</button>
            </div>
          </div>
        )
      }

      {
        tab === 'storefront' && (
          <div className="bg-white p-12 rounded-[3rem] border border-[#DA3A36]/10 shadow-2xl space-y-8 max-w-2xl mx-auto">
            <h3 className="font-serif text-3xl text-[#DA3A36] italic">Marquee Broadcast</h3>
            <textarea className="w-full bg-[#F4E6C5]/20 p-6 rounded-[1.5rem] border border-[#FED3C7] text-sm" rows={4} value={nForm.text} onChange={e => setNForm({ ...nForm, text: e.target.value })} />
            <input type="number" className="w-full bg-[#F4E6C5]/20 p-6 rounded-[1.5rem] border border-[#FED3C7] text-sm" value={nForm.speed} onChange={e => setNForm({ ...nForm, speed: parseInt(e.target.value) })} />
            <button onClick={() => saveConfig('flashnews', nForm)} className="w-full bg-[#DA3A36] text-white py-5 rounded-[1.5rem] font-bold uppercase text-[10px] tracking-widest shadow-xl border-2 border-[#F6D55F]">Apply Broadcast Update</button>
          </div>
        )
      }

      {
        tab === 'faqs' && (
          <div className="bg-white p-12 rounded-[3rem] border border-[#DA3A36]/10 shadow-2xl space-y-10 max-w-3xl mx-auto">
            <div className="flex justify-between items-center font-serif text-3xl text-[#DA3A36] italic">Knowledge Base <button onClick={() => setFaqForm([...fForm, { question: '', answer: '' }])} className="p-4 bg-[#DA3A36] text-white rounded-full"><Plus size={24} /></button></div>
            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
              {fForm.map((f, i) => (
                <div key={i} className="p-8 bg-[#F4E6C5]/20 rounded-[2rem] border border-[#FED3C7] space-y-4 relative">
                  <button onClick={() => setFaqForm(fForm.filter((_, idx) => idx !== i))} className="absolute top-6 right-6 text-red-400"><Trash2 size={18} /></button>
                  <input className="w-full bg-white p-4 rounded-xl text-sm font-bold shadow-inner" placeholder="Question" value={f.question} onChange={e => { const n = [...fForm]; n[i].question = e.target.value; setFaqForm(n); }} />
                  <textarea className="w-full bg-white p-4 rounded-xl text-xs leading-relaxed" placeholder="Answer" rows={3} value={f.answer} onChange={e => { const n = [...fForm]; n[i].answer = e.target.value; setFaqForm(n); }} />
                </div>
              ))}
            </div>
            <button onClick={() => saveConfig('faqs', { items: fForm })} className="w-full bg-[#DA3A36] text-white py-5 rounded-[1.5rem] font-bold uppercase tracking-widest shadow-2xl border-2 border-[#F6D55F]">Deploy FAQ Update</button>
          </div>
        )
      }

      {
        adding && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6 overflow-y-auto">
            <form onSubmit={saveProduct} className="bg-[#F4E6C5] p-10 rounded-[3rem] w-full max-w-lg space-y-6 shadow-2xl relative my-10 border border-white animate-in zoom-in duration-300">
              <h3 className="text-3xl font-serif text-[#DA3A36] italic">{editingId ? 'Edit Indulgence' : 'New Indulgence'}</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase font-bold opacity-40 ml-2">Product Name</label>
                  <input className="w-full p-4 rounded-xl bg-white/50 border border-[#FED3C7] focus:bg-white transition outline-none" placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase font-bold opacity-40 ml-2">Category</label>
                    <select className="w-full p-4 rounded-xl bg-white/50 border border-[#FED3C7] focus:bg-white transition outline-none" onChange={e => setForm({ ...form, category: e.target.value })} value={form.category}>
                      <option value="Chocolates">Chocolates</option>
                      <option value="Gifts">Gifts & Extras</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold opacity-40 ml-2">Status</label>
                    <select className="w-full p-4 rounded-xl bg-white/50 border border-[#FED3C7] focus:bg-white transition outline-none" onChange={e => setForm({ ...form, active: e.target.value === 'true' })} value={form.active}>
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase font-bold opacity-40 ml-2">Price (₹)</label>
                    <input type="number" className="w-full p-4 rounded-xl bg-white/50 border border-[#FED3C7] focus:bg-white transition outline-none" placeholder="Price" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold opacity-40 ml-2">Regular Price (₹)</label>
                    <input type="number" className="w-full p-4 rounded-xl bg-white/50 border border-[#FED3C7] focus:bg-white transition outline-none" placeholder="Regular" value={form.regularPrice} onChange={e => setForm({ ...form, regularPrice: e.target.value })} />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold opacity-40 ml-2">Description</label>
                  <textarea className="w-full p-4 rounded-xl bg-white/50 border border-[#FED3C7] focus:bg-white transition outline-none" rows={3} placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold opacity-40 ml-2">Product Images (Max 3)</label>
                  <div className="space-y-3">
                    {(form.images && form.images.length > 0 ? form.images : ['']).map((img, idx) => (
                      <div key={idx} className="flex gap-2 items-center animate-in slide-in-from-left-4 fade-in">
                        <span className="text-xs font-bold opacity-30 w-4">{idx + 1}</span>
                        <input
                          className="w-full p-4 rounded-xl bg-white/50 border border-[#FED3C7] focus:bg-white transition outline-none"
                          placeholder="Image URL"
                          value={img}
                          onChange={e => {
                            const newImages = [...(form.images || [''])];
                            newImages[idx] = e.target.value;
                            setForm({ ...form, images: newImages });
                          }}
                        />
                        <button type="button" onClick={() => {
                          const input = document.createElement('input'); input.type = 'file';
                          input.onchange = async e => {
                            if (e.target.files[0]) {
                              setUploading('product' + idx);
                              try {
                                const u = await uploadFile(e.target.files[0]);
                                const newImages = [...(form.images || [''])];
                                newImages[idx] = u;
                                setForm(prev => ({ ...prev, images: newImages }));
                              } catch (err) { alert("Failed"); }
                              finally { setUploading(null); }
                            }
                          };
                          input.click();
                        }} className="bg-[#DA3A36] text-white p-4 rounded-xl min-w-[50px] flex justify-center shadow-lg hover:scale-105 transition">
                          {uploading === 'product' + idx ? <Zap size={20} className="animate-spin" /> : <Upload size={20} />}
                        </button>
                        {idx > 0 && (
                          <button type="button" onClick={() => {
                            const newImages = form.images.filter((_, i) => i !== idx);
                            setForm({ ...form, images: newImages });
                          }} className="text-red-400 p-2 hover:bg-red-50 rounded-lg"><Trash2 size={20} /></button>
                        )}
                      </div>
                    ))}
                    {(form.images?.length || 0) < 3 && (
                      <button type="button" onClick={() => setForm({ ...form, images: [...(form.images || ['']), ''] })} className="text-xs font-bold text-[#DA3A36] uppercase tracking-widest flex items-center gap-2 pl-6 hover:opacity-100 opacity-60 transition">
                        <Plus size={14} /> Add Another Image
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button type="submit" className="w-full bg-[#DA3A36] text-white py-5 rounded-2xl font-bold uppercase tracking-widest shadow-2xl hover:bg-[#E97D78] transition active:scale-95 border-2 border-[#F6D55F]">
                  {editingId ? 'Update Indulgence' : 'Publish to Store'}
                </button>
              </div>

              <button type="button" onClick={() => setAdding(false)} className="absolute top-6 right-6 text-red-400 p-2 hover:bg-white rounded-full transition"><Trash2 size={24} /></button>
            </form>
          </div>
        )
      }
    </div >
  );
}

function SuccessView({ setView }) {
  return (
    <div className="h-[85vh] flex flex-col items-center justify-center text-center px-6 space-y-10 animate-in zoom-in duration-1000">
      <div className="p-8 bg-white rounded-full shadow-2xl relative"><CheckCircle size={100} className="text-green-500" /></div>
      <div className="space-y-4">
        <h1 className="text-6xl font-serif italic text-[#DA3A36] leading-tight">Order Captured!</h1>
        <p className="opacity-50 max-w-sm mx-auto text-sm leading-relaxed uppercase tracking-widest font-bold">Thank you for feeding the flame.</p>
      </div>
      <button onClick={() => setView('home')} className="bg-[#DA3A36] text-white px-20 py-5 rounded-full font-bold uppercase tracking-[0.3em] border-2 border-[#F6D55F] shadow-2xl transition hover:scale-110 active:scale-95 text-xs">Return to Sanctuary</button>
    </div>
  );
}

const InfoPage = ({ title, content, setView }) => (
  <div className="max-w-4xl mx-auto px-6 py-24 min-h-screen space-y-8 animate-in fade-in bg-[#F4E6C5] text-[#4A0404]">
    <div className="flex items-center gap-2 text-[#DA3A36] font-bold uppercase text-xs tracking-widest cursor-pointer opacity-60 hover:opacity-100 transition mb-8" onClick={() => setView('home')}>
      <ArrowLeft size={16} /> Back to Sanctuary
    </div>
    <div className="bg-white p-12 rounded-[3rem] shadow-xl border border-[#FED3C7] space-y-8">
      <h1 className="text-4xl md:text-5xl font-serif italic text-[#DA3A36] text-center border-b border-[#DA3A36]/10 pb-8">{title}</h1>
      <div className="prose prose-red max-w-none text-[#4A0404]/80 whitespace-pre-line leading-relaxed text-sm md:text-base selection:bg-[#FED3C7]">
        {content}
      </div>
    </div>
  </div>
);

const PrivacyView = ({ setView }) => (
  <InfoPage setView={setView} title="Privacy Policy" content={`
    **1. Introduction**
    Welcome to LuvBees. We value your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website and tell you about your privacy rights and how the law protects you.
    Welcome to LuvBees. We value your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website and tell you about your privacy rights and how the law protects you.

    **2. Information We Collect**
    We may collect, use, store and transfer different kinds of personal data about you which we have grouped together follows:
    - Identity Data including first name, last name, username or similar identifier.
    - Contact Data including billing address, delivery address, email address and telephone numbers.
    - Transaction Data including details about payments to and from you and other details of products and services you have purchased from us.

    **3. How We Use Your Personal Data**
    We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
    - Where we need to perform the contract we are about to enter into or have entered into with you.
    - Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.
    - Where we need to comply with a legal or regulatory obligation.

    **4. Data Security**
    We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, altered or disclosed.
  `} />
);

const TermsView = ({ setView }) => (
  <InfoPage setView={setView} title="Terms & Conditions" content={`
    **1. Acceptance of Terms**
    By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement. In addition, when using this websites particular services, you shall be subject to any posted guidelines or rules applicable to such services.

    **2. Use of Site**
    You agree to use the site only for lawful purposes. You are prohibited from posting on or transmitting through the site any material that is unlawful, harmful, threatening, abusive, harassing, defamatory, vulgar, or otherwise objectionable.

    **3. Product Description**
    LuvBees attempts to be as accurate as possible. However, LuvBees does not warrant that product descriptions or other content of this site is accurate, complete, reliable, current, or error-free.

    **4. Pricing**
    All prices are subject to change without notice. We make every effort to provide you with the most accurate pricing information, but in the event that an item is listed at an incorrect price, we shall have the right to refuse or cancel any orders placed for that item.
  `} />
);

const ReturnView = ({ setView }) => (
  <InfoPage setView={setView} title="Return Policy" content={`
    **1. Returns**
    Due to the perishable and intimate nature of our products (chocolates, etc.), we generally do not accept returns. However, your satisfaction is our priority.

    **2. Damaged or Defective Items**
    If you receive a damaged or defective item, please contact us at care.luvbees@gmail.com within 24 hours of delivery. Please include your order number and creating photos of the damage. We will happily arrange a replacement or refund.

    **3. Cancellations**
    Orders can only be cancelled within 1 hour of placement. Once an order has been processed for shipping, it cannot be cancelled.

    **4. Refunds**
    If your return is approved, we will initiate a refund to your credit card (or original method of payment). You will receive the credit within a certain amount of days, depending on your card issuer's policies.
  `} />
);

const AdminLoginView = ({ onLogin }) => {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/admin/login', { user, pass });
      onLogin();
    } catch { alert('Invalid Credentials'); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4E6C5] p-6 animate-in zoom-in">
      <form onSubmit={handleSubmit} className="bg-white p-12 rounded-[3rem] shadow-2xl max-w-sm w-full space-y-6 border border-[#DA3A36]/10">
        <h2 className="text-3xl font-serif italic text-[#DA3A36] text-center mb-4">Admin Access</h2>
        <input className="w-full p-4 rounded-xl bg-[#F4E6C5]/20 border border-[#FED3C7] text-center tracking-widest uppercase font-bold outline-none focus:bg-white transition" placeholder="XXX" maxLength={3} value={user} onChange={e => setUser(e.target.value.toUpperCase())} autoFocus />
        <input className="w-full p-4 rounded-xl bg-[#F4E6C5]/20 border border-[#FED3C7] text-center tracking-widest outline-none focus:bg-white transition" type="password" placeholder="Key" value={pass} onChange={e => setPass(e.target.value)} />
        <button className="w-full bg-[#DA3A36] text-white py-5 rounded-2xl font-bold uppercase tracking-widest hover:scale-105 transition shadow-lg border-2 border-[#F6D55F]">Unlock</button>
      </form>
    </div>
  );
};
