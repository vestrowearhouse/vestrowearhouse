"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import { ShoppingBag, Heart, Search, User, Menu, X, LogOut, Home, ChevronRight, Layers, ChevronDown } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter, usePathname } from "next/navigation";
import BrandLogo from "./BrandLogo";

// Dynamically import CartDrawer
const CartDrawer = dynamic(() => import("./CartDrawer"), { ssr: false });

// Helper to format category names so they fit neatly in max 2 lines and NEVER 3 lines
function formatNavCategoryLabel(name) {
  if (!name) return null;
  const clean = name.trim();

  // If contains '&' (e.g. "Pants & Cargo", "Hoodies & Sweats", "Jackets & Outerwear", "Caps & Accessories")
  // Line 1: "<Word> &", Line 2: "<Word>" - both with whitespace-nowrap so 3 lines is physically impossible
  if (clean.includes('&')) {
    const parts = clean.split(/\s*&\s*/);
    if (parts.length >= 2) {
      const line1 = `${parts[0]} &`;
      const line2 = parts.slice(1).join(' & ');
      return (
        <span className="flex flex-col items-center justify-center text-center leading-[1.1] max-h-[2.4em] overflow-hidden">
          <span className="whitespace-nowrap text-center">{line1}</span>
          <span className="whitespace-nowrap text-center truncate max-w-[95px] xl:max-w-[110px]">{line2}</span>
        </span>
      );
    }
  }

  // If two separate words (e.g. "New Arrival", "Our Story")
  const words = clean.split(/\s+/);
  if (words.length === 2) {
    return (
      <span className="flex flex-col items-center justify-center text-center leading-[1.1] max-h-[2.4em] overflow-hidden">
        <span className="whitespace-nowrap text-center">{words[0]}</span>
        <span className="whitespace-nowrap text-center">{words[1]}</span>
      </span>
    );
  }

  // Single word (e.g. "Collections", "T-Shirts")
  return (
    <span className="flex items-center justify-center text-center leading-[1.1] max-h-[2.4em] overflow-hidden whitespace-nowrap">
      {clean}
    </span>
  );
}

export default function Navbar() {
  const { cartCount, cartTotal } = useCart();
  const { user, logout, openLoginModal } = useAuth();
  const { wishlistCount } = useWishlist();
  const router = useRouter();
  const pathname = usePathname();
  const isProductPage = pathname?.startsWith("/product/");

  const [categories, setCategories] = useState([
    { id: '1', name: 'T-Shirts', slug: 't-shirts' },
    { id: '2', name: 'Hoodies', slug: 'hoodies-sweats' },
    { id: '3', name: 'Jackets', slug: 'outerwear' },
    { id: '4', name: 'Pants', slug: 'pants-cargo' },
    { id: '5', name: 'Caps', slug: 'accessories' }
  ]);

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [expandedCat, setExpandedCat] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const closeMobileDrawer = () => {
    setMobileDrawerOpen(false);
    setShowHeader(true);
  };

  // Fetch live categories from database (Always fresh, zero stale caching)
  useEffect(() => {
    try { sessionStorage.removeItem('vestro_nav_categories'); } catch (_) {}

    const loadLiveCategories = () => {
      fetch(`/api/categories?nested=true&_t=${Date.now()}`, { cache: 'no-store' })
        .then(res => res.json())
        .then(data => {
          if (data?.categories && Array.isArray(data.categories) && data.categories.length > 0) {
            setCategories(data.categories);
          }
        })
        .catch(err => {
          console.error('[Navbar] Live category fetch error:', err);
        });
    };

    loadLiveCategories();

    // Re-fetch when admin updates categories in another tab
    const handleStorageChange = (e) => {
      if (e.key === 'vestro_categories_updated') {
        loadLiveCategories();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Live Search States
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Prevent body scroll when mobile drawer or cart is open
  useEffect(() => {
    if (mobileDrawerOpen || cartOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileDrawerOpen, cartOpen]);

  // Close mobile drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && mobileDrawerOpen) {
        closeMobileDrawer();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileDrawerOpen]);

  // Smooth scroll-aware header: gently slides up on scroll down, slides down on scroll up
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (currentScrollY <= 40) {
            setShowHeader(true);
          } else if (currentScrollY > lastScrollY && currentScrollY > 70) {
            setShowHeader(false);
          } else if (currentScrollY < lastScrollY) {
            setShowHeader(true);
          }
          setLastScrollY(currentScrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Live Search Effect
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    const fetchResults = async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/products?search=${encodeURIComponent(searchQuery)}&limit=6`);
        const data = await res.json();
        setSearchResults(data.products || []);
        setShowDropdown(true);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      fetchResults();
    }, 400);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = "/";
    } catch {
      window.location.href = "/";
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowDropdown(false);
      setSearchOpen(false);
    }
  };

  return (
    <>
      {/* 1 & 2. Main Sticky Navigation Wrapper with Smooth Hide/Show Slide on Scroll & Menu Open */}
      <div 
        className={`sticky top-0 z-[60] w-full transform transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] will-change-transform ${
          mobileDrawerOpen || (!showHeader && !cartOpen && !searchOpen) ? '-translate-y-full' : 'translate-y-0'
        }`}
      >
        {/* 1. Top Announcement Bar (Onfire style) */}
        <div className="bg-black text-white text-[11px] sm:text-[12px] font-medium tracking-[0.14em] uppercase py-2 px-4 text-center">
          <span>Free Nationwide Delivery On Orders Over ৳3,000 · Cash On Delivery Available</span>
        </div>

        {/* 2. Main Navigation Header */}
        <header className="bg-white/95 backdrop-blur-md border-b border-neutral-100 transition-shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
            
            {/* Mobile: Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              className="lg:hidden p-2 -ml-2 text-neutral-800 hover:text-black active:scale-90 transition-all duration-150"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Brand Logo */}
            <div className="flex-shrink-0 z-20">
              <BrandLogo size="md" />
            </div>

            {/* Desktop Center Navigation (Exact style from screenshot: 2-line balanced categories, strictly never 3 lines) */}
            <nav className="hidden lg:flex items-center justify-center gap-2.5 xl:gap-5 text-[10.5px] xl:text-[11.5px] font-bold tracking-wider uppercase text-neutral-800 shrink min-w-0 z-10 px-1">
              <Link 
                href="/new" 
                className={`group relative py-1 px-1 flex flex-col items-center justify-center text-center hover:text-black transition-colors shrink-0 ${pathname === '/new' ? 'text-black font-extrabold' : 'font-bold'}`}
              >
                <span className="flex flex-col items-center justify-center text-center leading-[1.1] max-h-[2.4em] overflow-hidden">
                  <span className="whitespace-nowrap">NEW</span>
                  <span className="whitespace-nowrap">ARRIVAL</span>
                </span>
                <span className={`absolute inset-x-1 -bottom-0.5 h-[2px] bg-black transition-transform duration-300 ${pathname === '/new' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}></span>
              </Link>

              <Link 
                href="/shop" 
                className={`group relative py-1 px-1 flex flex-col items-center justify-center text-center hover:text-black transition-colors shrink-0 ${pathname === '/shop' ? 'text-black font-extrabold' : 'font-bold'}`}
              >
                <span className="whitespace-nowrap leading-[1.1]">COLLECTIONS</span>
                <span className={`absolute inset-x-1 -bottom-0.5 h-[2px] bg-black transition-transform duration-300 ${pathname === '/shop' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}></span>
              </Link>

              {/* Dynamic Categories from Supabase Database */}
              {categories.slice(0, 5).map((cat) => {
                const isCatActive = pathname === `/category/${cat.slug}`;
                const hasSubs = Array.isArray(cat.subcategories) && cat.subcategories.length > 0;

                return (
                  <div key={cat.id || cat.slug} className="relative group/cat py-1 shrink-0">
                    <Link 
                      href={`/category/${cat.slug}`} 
                      className={`group relative py-1 px-1 flex items-center justify-center gap-0.5 hover:text-black transition-colors ${isCatActive ? 'text-black font-extrabold' : 'font-bold'}`}
                    >
                      {formatNavCategoryLabel(cat.name)}
                      {hasSubs && <ChevronDown className="w-3 h-3 text-neutral-400 group-hover/cat:text-black transition-transform duration-200 group-hover/cat:rotate-180 shrink-0 ml-0.5" />}
                      <span className={`absolute inset-x-1 -bottom-0.5 h-[2px] bg-black transition-transform duration-300 ${isCatActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}></span>
                    </Link>

                    {/* Subcategories Dropdown */}
                    {hasSubs && (
                      <div className="absolute left-1/2 -translate-x-1/2 top-full pt-1 opacity-0 invisible group-hover/cat:opacity-100 group-hover/cat:visible transition-all duration-200 z-50">
                        <div className="min-w-[200px] bg-white border border-neutral-200 shadow-xl py-2 rounded-lg">
                          {cat.subcategories.map((sub) => (
                            <Link
                              key={sub.id || sub.slug}
                              href={`/category/${sub.slug}`}
                              className="block px-4 py-2 text-xs font-semibold uppercase tracking-wider text-neutral-700 hover:text-black hover:bg-neutral-50 transition-colors whitespace-nowrap"
                            >
                              {sub.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* If more than 5 categories, render a clean 'More' dropdown instead of wrapping */}
              {categories.length > 5 && (
                <div className="relative group/more py-1 shrink-0">
                  <button 
                    type="button"
                    className="group relative py-1 px-1 flex items-center justify-center gap-0.5 hover:text-black transition-colors uppercase font-bold cursor-pointer"
                  >
                    <span>MORE</span>
                    <ChevronDown className="w-3 h-3 text-neutral-400 group-hover/more:text-black transition-transform duration-200 group-hover/more:rotate-180" />
                  </button>
                  <div className="absolute left-1/2 -translate-x-1/2 top-full pt-1 opacity-0 invisible group-hover/more:opacity-100 group-hover/more:visible transition-all duration-200 z-50">
                    <div className="min-w-[200px] bg-white border border-neutral-200 shadow-xl py-2 rounded-lg">
                      {categories.slice(5).map((cat) => (
                        <Link
                          key={cat.id || cat.slug}
                          href={`/category/${cat.slug}`}
                          className="block px-4 py-2 text-xs font-semibold uppercase tracking-wider text-neutral-700 hover:text-black hover:bg-neutral-50 transition-colors whitespace-nowrap"
                        >
                          {cat.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <Link 
                href="/about" 
                className={`group relative py-1 px-1 flex flex-col items-center justify-center text-center hover:text-black transition-colors shrink-0 ${pathname === '/about' ? 'text-black font-extrabold' : 'font-bold'}`}
              >
                <span className="flex flex-col items-center justify-center text-center leading-[1.1] max-h-[2.4em] overflow-hidden">
                  <span className="whitespace-nowrap">OUR</span>
                  <span className="whitespace-nowrap">STORY</span>
                </span>
                <span className={`absolute inset-x-1 -bottom-0.5 h-[2px] bg-black transition-transform duration-300 ${pathname === '/about' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}></span>
              </Link>
            </nav>

            {/* Right Action Icons */}
            <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0 z-20">
              
              {/* Search Toggle Icon */}
              <button 
                onClick={() => setSearchOpen(!searchOpen)} 
                aria-label="Search" 
                className="p-2.5 text-neutral-800 hover:text-black transition-colors rounded-full hover:bg-neutral-100"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Wishlist */}
              <Link 
                href="/wishlist" 
                aria-label="Wishlist" 
                className="hidden sm:flex p-2.5 text-neutral-800 hover:text-black transition-colors rounded-full hover:bg-neutral-100 relative"
              >
                <Heart className="w-5 h-5" />
                {wishlistCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-neutral-900 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Cart Button */}
              <button 
                onClick={() => setCartOpen(true)} 
                aria-label="Shopping Cart" 
                className="p-2 sm:px-3.5 sm:py-2 text-neutral-900 hover:bg-neutral-100 rounded-full transition-all flex items-center gap-2 group cursor-pointer relative"
              >
                <div className="relative">
                  <ShoppingBag className="w-5 h-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 bg-black text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                      {cartCount}
                    </span>
                  )}
                </div>
                <span className="hidden xl:inline text-[13px] font-semibold text-neutral-900">
                  {cartTotal > 0 ? `৳${cartTotal.toLocaleString()}` : 'Bag'}
                </span>
              </button>

              {/* User Account / Profile */}
              {user ? (
                <div className="relative group">
                  <Link 
                    href="/profile" 
                    className="p-2 text-neutral-800 hover:text-black rounded-full hover:bg-neutral-100 transition-colors flex items-center gap-1.5"
                    aria-label="My Account"
                  >
                    <User className="w-5 h-5" />
                  </Link>

                  {/* Profile Dropdown */}
                  <div className="absolute right-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="w-48 bg-white border border-neutral-100 shadow-xl rounded-md py-1.5 overflow-hidden">
                      <div className="px-4 py-2 border-b border-neutral-100">
                        <p className="text-[11px] uppercase tracking-wider text-neutral-400 font-semibold">Signed in as</p>
                        <p className="text-xs font-bold text-neutral-900 truncate">{user.name || user.email}</p>
                      </div>
                      <Link href="/profile" className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 hover:text-black">
                        <User className="w-4 h-4" /> My Profile
                      </Link>
                      <Link href="/orders" className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 hover:text-black">
                        <ShoppingBag className="w-4 h-4" /> My Orders
                      </Link>
                      <button 
                        onClick={handleLogout} 
                        className="w-full text-left flex items-center gap-2 px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 border-t border-neutral-50"
                      >
                        <LogOut className="w-4 h-4" /> Log Out
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={openLoginModal}
                  className="hidden sm:inline-flex items-center text-xs font-semibold tracking-wider uppercase text-neutral-800 hover:text-black py-2 px-3 transition-colors"
                >
                  Sign In
                </button>
              )}

            </div>
          </div>
        </div>

        {/* 3. Search Bar Dropdown Overlay */}
        {searchOpen && (
          <div className="border-t border-neutral-100 bg-neutral-50/95 backdrop-blur-sm px-4 py-4 sm:py-6 animate-fadeIn">
            <div className="max-w-3xl mx-auto relative">
              <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                <Search className="absolute left-4 w-5 h-5 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search collections, t-shirts, jackets, shoes..."
                  className="w-full pl-12 pr-12 py-3 bg-white border border-neutral-200 rounded-none focus:outline-none focus:border-black text-sm font-medium tracking-wide"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery.trim() && setShowDropdown(true)}
                  autoComplete="off"
                />
                {searchQuery ? (
                  <button 
                    type="button" 
                    onClick={() => { setSearchQuery(''); setShowDropdown(false); }}
                    className="absolute right-4 text-neutral-400 hover:text-black"
                  >
                    <X className="w-4 h-4" />
                  </button>
                ) : (
                  <button 
                    type="button" 
                    onClick={() => setSearchOpen(false)}
                    className="absolute right-4 text-neutral-400 hover:text-black"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </form>

              {/* Live search results */}
              {showDropdown && (
                <div className="mt-2 bg-white border border-neutral-200 shadow-2xl max-h-[350px] overflow-y-auto">
                  {isSearching ? (
                    <div className="p-4 text-center text-xs tracking-wider uppercase text-neutral-400">Searching catalog...</div>
                  ) : searchResults.length > 0 ? (
                    <div className="divide-y divide-neutral-100">
                      {searchResults.map((p) => (
                        <Link 
                          key={p.id || p._id} 
                          href={`/product/${p.slug}`}
                          onClick={() => { setSearchOpen(false); setShowDropdown(false); }}
                          className="flex items-center gap-3 p-3 hover:bg-neutral-50 transition-colors"
                        >
                          <div className="relative w-12 h-14 bg-neutral-100 flex-shrink-0">
                            <Image 
                              src={p.featuredImage || p.images?.[0] || '/tab-icon.png'} 
                              alt={p.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-neutral-900 truncate">{p.name}</p>
                            <p className="text-xs font-bold text-neutral-900 mt-0.5">৳ {Number(p.sellingPrice || p.price || 0).toLocaleString()}</p>
                          </div>
                        </Link>
                      ))}
                      <Link 
                        href={`/search?q=${encodeURIComponent(searchQuery)}`}
                        onClick={() => { setSearchOpen(false); setShowDropdown(false); }}
                        className="block text-center py-2.5 bg-neutral-900 text-white text-xs font-semibold tracking-wider uppercase hover:bg-black transition-colors"
                      >
                        View all results →
                      </Link>
                    </div>
                  ) : (
                    <div className="p-4 text-center text-xs text-neutral-500">No matching apparel found.</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </header>
      </div>

      {/* 4. Mobile Drawer Menu (Luxury Smooth Backdrop Fade & Gentle Cubic-Bezier Slide-in) */}
      <div 
        className={`lg:hidden fixed inset-0 z-[70] transition-all duration-500 ${
          mobileDrawerOpen ? 'visible pointer-events-auto' : 'invisible pointer-events-none'
        }`}
        aria-hidden={!mobileDrawerOpen}
      >
        {/* Backdrop */}
        <div 
          className={`fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-500 ease-in-out ${
            mobileDrawerOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={closeMobileDrawer}
        />

        {/* Drawer Content */}
        <div 
          className={`relative w-[300px] max-w-[85vw] bg-white h-full shadow-2xl flex flex-col z-[80] transform transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] will-change-transform ${
            mobileDrawerOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Drawer Header */}
          <div className="flex items-center justify-between p-4 border-b border-neutral-100">
            <BrandLogo size="sm" />
            <button 
              onClick={closeMobileDrawer}
              className="p-1.5 text-neutral-400 hover:text-black rounded-full active:scale-90 transition-all duration-150"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Navigation Links */}
          <div className="flex-1 overflow-y-auto py-4 px-4 space-y-1">
            <Link 
              href="/new" 
              onClick={closeMobileDrawer}
              className="flex items-center justify-between py-3 text-sm font-bold uppercase tracking-wider text-neutral-900 border-b border-neutral-100 hover:text-neutral-600 hover:translate-x-1 transition-all duration-150"
            >
              <span>New Arrival</span>
              <ChevronRight className="w-4 h-4 text-neutral-400" />
            </Link>

            <Link 
              href="/shop" 
              onClick={closeMobileDrawer}
              className="flex items-center justify-between py-3 text-sm font-bold uppercase tracking-wider text-neutral-900 border-b border-neutral-100 hover:text-neutral-600 hover:translate-x-1 transition-all duration-150"
            >
              <span>All Collections</span>
              <ChevronRight className="w-4 h-4 text-neutral-400" />
            </Link>

            <div className="pt-3 pb-1">
              <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-neutral-400 mb-2">Categories</p>
              {categories && categories.length > 0 ? (
                categories.map((c) => {
                  const hasSubs = Array.isArray(c.subcategories) && c.subcategories.length > 0;
                  const isExpanded = expandedCat === (c.id || c.slug);
                  return (
                    <div key={c.id || c.slug} className="border-b border-neutral-50 last:border-0">
                      <div className="flex items-center justify-between">
                        <Link
                          href={`/category/${c.slug}`}
                          onClick={closeMobileDrawer}
                          className="flex-1 py-2.5 text-xs font-semibold text-neutral-700 hover:text-black hover:translate-x-1 transition-all duration-150 uppercase tracking-wider"
                        >
                          {c.name}
                        </Link>
                        {hasSubs && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedCat(prev => prev === (c.id || c.slug) ? null : (c.id || c.slug));
                            }}
                            className="p-1.5 text-neutral-400 hover:text-black transition-colors"
                            aria-label="Toggle subcategories"
                          >
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-black' : ''}`} />
                          </button>
                        )}
                      </div>
                      {hasSubs && (
                        <div
                          className={`overflow-hidden transition-all duration-300 ease-in-out pl-3 space-y-1 ${
                            isExpanded ? 'max-h-60 pb-2 opacity-100' : 'max-h-0 opacity-0'
                          }`}
                        >
                          {c.subcategories.map((sub) => (
                            <Link
                              key={sub.id || sub.slug}
                              href={`/category/${sub.slug}`}
                              onClick={closeMobileDrawer}
                              className="block py-1.5 text-[11px] font-medium text-neutral-500 hover:text-black hover:translate-x-1 transition-all duration-150 uppercase tracking-wider"
                            >
                              {sub.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <>
                  <Link href="/category/t-shirts" onClick={closeMobileDrawer} className="block py-2 text-xs font-medium text-neutral-700 hover:text-black">T-Shirts</Link>
                  <Link href="/category/hoodies" onClick={closeMobileDrawer} className="block py-2 text-xs font-medium text-neutral-700 hover:text-black">Hoodies & Sweats</Link>
                  <Link href="/category/pants" onClick={closeMobileDrawer} className="block py-2 text-xs font-medium text-neutral-700 hover:text-black">Bottom Wear</Link>
                  <Link href="/category/shoes" onClick={closeMobileDrawer} className="block py-2 text-xs font-medium text-neutral-700 hover:text-black">Footwear</Link>
                </>
              )}
            </div>

            <div className="pt-4 border-t border-neutral-100 space-y-1">
              <Link 
                href="/about" 
                onClick={closeMobileDrawer}
                className="block py-2 text-xs font-medium text-neutral-600 hover:text-black hover:translate-x-1 transition-all duration-150 uppercase tracking-wider"
              >
                Our Story
              </Link>
              <Link 
                href="/track-order" 
                onClick={closeMobileDrawer}
                className="block py-2 text-xs font-medium text-neutral-600 hover:text-black hover:translate-x-1 transition-all duration-150 uppercase tracking-wider"
              >
                Track Order
              </Link>
              <Link 
                href="/contact" 
                onClick={closeMobileDrawer}
                className="block py-2 text-xs font-medium text-neutral-600 hover:text-black hover:translate-x-1 transition-all duration-150 uppercase tracking-wider"
              >
                Support & Contact
              </Link>
            </div>
          </div>

          {/* Drawer Footer */}
          <div className="p-4 border-t border-neutral-100 bg-neutral-50">
            {user ? (
              <div className="flex items-center justify-between">
                <div className="truncate">
                  <p className="text-xs font-bold text-neutral-900">{user.name || "Member"}</p>
                  <p className="text-[11px] text-neutral-500 truncate">{user.email}</p>
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                  aria-label="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => { closeMobileDrawer(); openLoginModal(); }}
                className="w-full py-2.5 bg-black text-white text-xs font-bold uppercase tracking-wider text-center active:scale-[0.98] transition-transform"
              >
                Sign In / Register
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 5. Mobile Sticky Bottom Navigation (Onfire style) */}
      {!isProductPage && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-neutral-200 z-40 py-2 px-4 shadow-[0_-2px_10px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-around">
            <Link 
              href="/" 
              className={`flex flex-col items-center gap-1 ${pathname === '/' ? 'text-black font-bold' : 'text-neutral-500'}`}
            >
              <Home className="w-5 h-5" />
              <span className="text-[10px] tracking-wider uppercase font-semibold">Home</span>
            </Link>

            <Link 
              href="/shop" 
              className={`flex flex-col items-center gap-1 ${pathname === '/shop' ? 'text-black font-bold' : 'text-neutral-500'}`}
            >
              <Layers className="w-5 h-5" />
              <span className="text-[10px] tracking-wider uppercase font-semibold">Shop</span>
            </Link>

            <Link 
              href="/wishlist" 
              className={`flex flex-col items-center gap-1 relative ${pathname === '/wishlist' ? 'text-black font-bold' : 'text-neutral-500'}`}
            >
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 right-1 w-3.5 h-3.5 bg-black text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                  {wishlistCount}
                </span>
              )}
              <span className="text-[10px] tracking-wider uppercase font-semibold">Wishlist</span>
            </Link>

            <button 
              onClick={() => setCartOpen(true)} 
              className="flex flex-col items-center gap-1 relative text-neutral-500 hover:text-black cursor-pointer"
            >
              <div className="relative">
                <ShoppingBag className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-black text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-wider uppercase font-semibold">Bag</span>
            </button>

            {user ? (
              <Link 
                href="/profile" 
                className={`flex flex-col items-center gap-1 ${pathname === '/profile' ? 'text-black font-bold' : 'text-neutral-500'}`}
              >
                <User className="w-5 h-5" />
                <span className="text-[10px] tracking-wider uppercase font-semibold">Account</span>
              </Link>
            ) : (
              <button 
                onClick={openLoginModal} 
                className="flex flex-col items-center gap-1 text-neutral-500 hover:text-black cursor-pointer"
              >
                <User className="w-5 h-5" />
                <span className="text-[10px] tracking-wider uppercase font-semibold">Sign In</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      <CartDrawer 
        isOpen={cartOpen} 
        onClose={() => setCartOpen(false)} 
      />
    </>
  );
}
