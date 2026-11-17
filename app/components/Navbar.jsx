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

export default function Navbar() {
  const { cartCount, cartTotal } = useCart();
  const { user, logout, openLoginModal } = useAuth();
  const { wishlistCount } = useWishlist();
  const router = useRouter();
  const pathname = usePathname();
  const isProductPage = pathname?.startsWith("/product/");

  const [categories, setCategories] = useState([
    { id: '1', name: 'T-Shirts', slug: 't-shirts' },
    { id: '2', name: 'Hoodies & Sweats', slug: 'hoodies-sweats' },
    { id: '3', name: 'Jackets & Outerwear', slug: 'outerwear' },
    { id: '4', name: 'Pants & Cargo', slug: 'pants-cargo' },
    { id: '5', name: 'Caps & Accessories', slug: 'accessories' }
  ]);

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  // Fetch live categories from database
  useEffect(() => {
    try {
      const cached = sessionStorage.getItem('vestro_nav_categories');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) setCategories(parsed);
      }
    } catch (_) {}

    fetch('/api/categories?nested=true')
      .then(res => res.json())
      .then(data => {
        if (data?.categories && Array.isArray(data.categories) && data.categories.length > 0) {
          setCategories(data.categories);
          try { sessionStorage.setItem('vestro_nav_categories', JSON.stringify(data.categories)); } catch (_) {}
        }
      })
      .catch(err => {
        console.error('[Navbar] Category fetch error:', err);
      });
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
      {/* 1. Top Announcement Bar (Onfire style) */}
      <div className="bg-black text-white text-[11px] sm:text-[12px] font-medium tracking-[0.14em] uppercase py-2 px-4 text-center">
        <span>Free Nationwide Delivery On Orders Over ৳3,000 · Cash On Delivery Available</span>
      </div>

      {/* 2. Main Sticky Navigation */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-100 transition-shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
            
            {/* Mobile: Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              className="lg:hidden p-2 -ml-2 text-neutral-800 hover:text-black transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Brand Logo */}
            <div className="flex-shrink-0">
              <BrandLogo size="md" />
            </div>

            {/* Desktop Center Navigation (Onfire style) */}
            <nav className="hidden lg:flex items-center justify-center gap-6 xl:gap-8 text-[12px] xl:text-[13px] font-semibold tracking-wider uppercase text-neutral-800">
              <Link 
                href="/new" 
                className={`group relative pb-1 hover:text-black transition-colors ${pathname === '/new' ? 'text-black font-bold' : ''}`}
              >
                New Arrival
                <span className={`absolute inset-x-0 -bottom-0.5 h-[2px] bg-black transition-transform duration-300 ${pathname === '/new' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}></span>
              </Link>

              <Link 
                href="/shop" 
                className={`group relative pb-1 hover:text-black transition-colors ${pathname === '/shop' ? 'text-black font-bold' : ''}`}
              >
                Collections
                <span className={`absolute inset-x-0 -bottom-0.5 h-[2px] bg-black transition-transform duration-300 ${pathname === '/shop' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}></span>
              </Link>

              {/* Dynamic Categories from Supabase Database */}
              {categories.map((cat) => {
                const isCatActive = pathname === `/category/${cat.slug}`;
                const hasSubs = Array.isArray(cat.subcategories) && cat.subcategories.length > 0;

                return (
                  <div key={cat.id || cat.slug} className="relative group/cat py-2">
                    <Link 
                      href={`/category/${cat.slug}`} 
                      className={`group relative pb-1 flex items-center gap-1 hover:text-black transition-colors ${isCatActive ? 'text-black font-bold' : ''}`}
                    >
                      <span>{cat.name}</span>
                      {hasSubs && <ChevronDown className="w-3 h-3 text-neutral-400 group-hover/cat:text-black transition-transform duration-200 group-hover/cat:rotate-180" />}
                      <span className={`absolute inset-x-0 -bottom-0.5 h-[2px] bg-black transition-transform duration-300 ${isCatActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}></span>
                    </Link>

                    {/* Subcategories Dropdown */}
                    {hasSubs && (
                      <div className="absolute left-0 top-full pt-1 opacity-0 invisible group-hover/cat:opacity-100 group-hover/cat:visible transition-all duration-200 z-50">
                        <div className="min-w-[200px] bg-white border border-neutral-200 shadow-xl py-2">
                          {cat.subcategories.map((sub) => (
                            <Link
                              key={sub.id || sub.slug}
                              href={`/category/${sub.slug}`}
                              className="block px-4 py-2 text-xs font-semibold uppercase tracking-wider text-neutral-700 hover:text-black hover:bg-neutral-50 transition-colors"
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

              <Link 
                href="/about" 
                className={`group relative pb-1 hover:text-black transition-colors ${pathname === '/about' ? 'text-black font-bold' : ''}`}
              >
                Our Story
                <span className={`absolute inset-x-0 -bottom-0.5 h-[2px] bg-black transition-transform duration-300 ${pathname === '/about' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}></span>
              </Link>
            </nav>

            {/* Right Action Icons */}
            <div className="flex items-center gap-1 sm:gap-3">
              
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

      {/* 4. Mobile Drawer Menu (Onfire Style Slide-in) */}
      {mobileDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
          ></div>

          {/* Drawer Content */}
          <div className="relative w-[300px] max-w-[85vw] bg-white h-full shadow-2xl flex flex-col z-10 animate-slideRight">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-100">
              <BrandLogo size="sm" />
              <button 
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-black rounded-full"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Navigation Links */}
            <div className="flex-1 overflow-y-auto py-4 px-4 space-y-1">
              <Link 
                href="/new" 
                onClick={() => setMobileDrawerOpen(false)}
                className="flex items-center justify-between py-3 text-sm font-bold uppercase tracking-wider text-neutral-900 border-b border-neutral-100"
              >
                <span>New Arrival</span>
                <ChevronRight className="w-4 h-4 text-neutral-400" />
              </Link>

              <Link 
                href="/shop" 
                onClick={() => setMobileDrawerOpen(false)}
                className="flex items-center justify-between py-3 text-sm font-bold uppercase tracking-wider text-neutral-900 border-b border-neutral-100"
              >
                <span>All Collections</span>
                <ChevronRight className="w-4 h-4 text-neutral-400" />
              </Link>

              <div className="pt-2 pb-1">
                <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-neutral-400 mb-2">Categories</p>
                {categories && categories.length > 0 ? (
                  categories.slice(0, 8).map(c => (
                    <Link
                      key={c.id || c.slug}
                      href={`/category/${c.slug}`}
                      onClick={() => setMobileDrawerOpen(false)}
                      className="block py-2 text-xs font-medium text-neutral-700 hover:text-black"
                    >
                      {c.name}
                    </Link>
                  ))
                ) : (
                  <>
                    <Link href="/category/t-shirts" onClick={() => setMobileDrawerOpen(false)} className="block py-2 text-xs font-medium text-neutral-700">T-Shirts</Link>
                    <Link href="/category/hoodies" onClick={() => setMobileDrawerOpen(false)} className="block py-2 text-xs font-medium text-neutral-700">Hoodies & Sweats</Link>
                    <Link href="/category/pants" onClick={() => setMobileDrawerOpen(false)} className="block py-2 text-xs font-medium text-neutral-700">Bottom Wear</Link>
                    <Link href="/category/shoes" onClick={() => setMobileDrawerOpen(false)} className="block py-2 text-xs font-medium text-neutral-700">Footwear</Link>
                  </>
                )}
              </div>

              <div className="pt-4 border-t border-neutral-100 space-y-2">
                <Link 
                  href="/about" 
                  onClick={() => setMobileDrawerOpen(false)}
                  className="block py-2 text-xs font-medium text-neutral-600 hover:text-black uppercase tracking-wider"
                >
                  Our Story
                </Link>
                <Link 
                  href="/track-order" 
                  onClick={() => setMobileDrawerOpen(false)}
                  className="block py-2 text-xs font-medium text-neutral-600 hover:text-black uppercase tracking-wider"
                >
                  Track Order
                </Link>
                <Link 
                  href="/contact" 
                  onClick={() => setMobileDrawerOpen(false)}
                  className="block py-2 text-xs font-medium text-neutral-600 hover:text-black uppercase tracking-wider"
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
                  onClick={() => { setMobileDrawerOpen(false); openLoginModal(); }}
                  className="w-full py-2.5 bg-black text-white text-xs font-bold uppercase tracking-wider text-center"
                >
                  Sign In / Register
                </button>
              )}
            </div>
          </div>
        </div>
      )}

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
