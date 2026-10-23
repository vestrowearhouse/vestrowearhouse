"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import { ShoppingBag, Heart, Search, User, Headphones, Menu, X, LogOut, Home } from "lucide-react";
import { useCategories } from "../context/CategoryContext";
import dynamic from "next/dynamic";
import { useRouter, usePathname } from "next/navigation";
import BrandLogo from "./BrandLogo";

// Dynamically import CartDrawer to reduce initial JS payload
const CartDrawer = dynamic(() => import("./CartDrawer"), { ssr: false });

export default function Navbar() {
  const { cartCount } = useCart();
  const { user, loading: authLoading, isCheckingAuth, logout, openLoginModal } = useAuth();
  const { wishlistCount } = useWishlist();
  const { isSidebarOpen, toggleSidebar } = useCategories();
  const router = useRouter();
  const pathname = usePathname();
  const isProductPage = pathname?.startsWith("/product/");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  // Log user state only in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Navbar] Current user state:', user ? `${user.name} (${user.email})` : 'No user');
    }
  }, [user]);

  // Live Search States
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Prevent body scroll when mobile menu, cart, or category sidebar is open
  useEffect(() => {
    if (mobileMenuOpen || cartOpen || isSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileMenuOpen, cartOpen, isSidebarOpen]);

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
        const res = await fetch(`/api/products?search=${encodeURIComponent(searchQuery)}&limit=5`);
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
    }, 600);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleLogout = async () => {
    try {
      const result = await logout();
      await new Promise(resolve => setTimeout(resolve, 300));
      window.location.href = "/";
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') console.error('[Navbar] Logout error:', error);
      window.location.href = "/";
    }
  };

  // Search without page reload
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
      {/* Desktop Navigation - White/Bluish Theme - Hidden on Mobile */}
      <nav className="hidden md:block bg-white shadow-md sticky top-0 z-50 border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <BrandLogo size="md" />
            
            {/* Search */}
            <div className="flex-1 max-w-xl mx-8 relative">
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  type="text"
                  placeholder="Search products, brands, or categories..."
                  className="w-full px-4 py-2.5 border-2 border-blue-200 rounded-lg focus:outline-none focus:border-[#083b66] focus:ring-2 focus:ring-blue-100 text-gray-800 font-medium"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery.trim() && setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                  autoComplete="off"
                />
                {searchQuery && (
                  <button 
                    type="button" 
                    onClick={() => { setSearchQuery(''); setShowDropdown(false); }}
                    aria-label="Clear Search"
                    className="absolute right-[100px] top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 p-1 transition-colors"
                  >
                    <X size={18} />
                  </button>
                )}
                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-[#083b66] text-white rounded-md hover:bg-[#062d4d] font-bold shadow-sm">
                  Search
                </button>
              </form>

              {/* Live Dropdown for Desktop */}
              {showDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden max-h-[400px] overflow-y-auto">
                  {isSearching ? (
                    <div className="p-4 text-center text-sm text-gray-500">Searching...</div>
                  ) : searchResults.length > 0 ? (
                    <div className="py-2">
                      {searchResults.map(product => (
                        <Link 
                          key={product._id} 
                          href={`/product/${product.slug}`}
                          className="flex items-center gap-3 px-4 py-2 hover:bg-blue-50 transition-colors"
                        >
                          <div className="relative w-12 h-12 flex-shrink-0">
                            <Image
                              src={product.featuredImage || product.images?.[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=48&h=48&fit=crop'}
                              alt={product.name || 'Product'}
                              width={48}
                              height={48}
                              className="object-cover rounded-md w-full h-full"
                              loading="lazy"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">{product.name}</p>
                            <p className="text-sm text-green-600 font-bold">৳{product.sellingPrice || product.price}</p>
                          </div>
                        </Link>
                      ))}
                      <Link href={`/search?q=${searchQuery}`} className="block text-center py-3 bg-gray-50 text-sm text-blue-600 font-bold hover:bg-gray-100 border-t">
                        View all results
                      </Link>
                    </div>
                  ) : (
                    <div className="p-4 text-center text-sm text-gray-500">No products found</div>
                  )}
                </div>
              )}
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-4 min-w-[260px] justify-end">
              <Link href="/wishlist" aria-label="Wishlist" className="p-2 hover:bg-blue-50 rounded-lg relative">
                <Heart className="w-6 h-6 text-[#083b66]" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {wishlistCount}
                  </span>
                )}
              </Link>
              <button onClick={() => setCartOpen(true)} aria-label="Open Cart" className="p-2 hover:bg-blue-50 rounded-lg relative">
                <ShoppingBag className="w-6 h-6 text-[#083b66]" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {cartCount}
                  </span>
                )}
              </button>
              
              {/* Auth Buttons - Show based on login state */}
              {user ? (
                // User is logged in - show profile button immediately
                <div className="relative group">
                  <Link href="/profile" className="flex items-center gap-2 px-4 py-2 bg-[#083b66] text-white font-bold rounded-lg hover:bg-[#062d4d] transition-colors shadow-md whitespace-nowrap">
                    <User className="w-4 h-4" />
                    {user.name || "Profile"}
                  </Link>
                    
                    {/* Hover Bridge (যাতে মাউস সরানোর সময় ড্রপডাউন বন্ধ না হয়) */}
                    <div className="absolute right-0 top-full h-3 w-full"></div>

                    {/* Profile Dropdown Menu */}
                    <div className="absolute right-0 top-[calc(100%+8px)] w-48 bg-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 flex flex-col overflow-hidden">
                      <Link href="/profile" className="px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-blue-50 hover:text-[#083b66] border-b border-gray-50 flex items-center gap-3">
                        <User className="w-4 h-4" /> My Profile
                      </Link>
                      <Link href="/orders" className="px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-blue-50 hover:text-[#083b66] border-b border-gray-50 flex items-center gap-3">
                        <ShoppingBag className="w-4 h-4" /> My Orders
                      </Link>
                      <button 
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                      >
                        <LogOut className="w-4 h-4" /> Logout
                      </button>
                    </div>
                  </div>
              ) : isCheckingAuth ? (
                // Skeleton matches the Sign In button exactly: same padding, height, and width
                <div className="px-5 py-2.5 bg-gray-200 rounded-lg w-[82px] h-[40px] animate-pulse" aria-hidden="true" />
              ) : (
                // Not logged in and done checking
                <button 
                  onClick={openLoginModal} 
                  className="px-5 py-2.5 bg-[#083b66] text-white font-bold rounded-lg hover:bg-[#062d4d] transition-colors shadow-md cursor-pointer"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Top Bar - Logo + Search (Sticky Top) */}
      <div className="md:hidden sticky top-0 z-50 bg-white shadow-xs border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo */}
          <BrandLogo size="sm" />

          {/* Search Toggle & Single Menu - Removed duplicate menu */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setSearchOpen(!searchOpen)}
              aria-label="Toggle Search"
              className="p-2 bg-blue-50 rounded-lg"
            >
              {searchOpen ? <X className="w-5 h-5 text-[#083b66]" /> : <Search className="w-5 h-5 text-[#083b66]" />}
            </button>
            <button 
              onClick={toggleSidebar}
              className="p-2 bg-blue-50 rounded-lg"
              aria-label="Categories"
            >
              <Menu className="w-5 h-5 text-[#083b66]" />
            </button>
          </div>
        </div>

        {/* Search Bar (Expandable) */}
        {searchOpen && (
          <div className="px-4 pb-3 relative">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Search products, brands, or categories..."
                className="w-full px-4 py-2 text-sm border-2 border-blue-200 rounded-lg focus:outline-none focus:border-[#083b66] text-gray-800"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.trim() && setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                autoComplete="off"
              />
              {searchQuery && (
                <button 
                  type="button" 
                  onClick={() => { setSearchQuery(''); setShowDropdown(false); }}
                  aria-label="Clear Search"
                  className="absolute right-[80px] top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 p-1 transition-colors"
                >
                  <X size={18} />
                </button>
              )}
              <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-[#083b66] text-white rounded-md text-sm font-bold">
                Search
              </button>
            </form>
            
            {/* Live Dropdown for Mobile */}
            {showDropdown && (
              <div className="absolute top-full left-4 right-4 mt-1 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden max-h-[300px] overflow-y-auto">
                {isSearching ? (
                  <div className="p-4 text-center text-sm text-gray-500">Searching...</div>
                ) : searchResults.length > 0 ? (
                  <div className="py-2">
                    {searchResults.map(product => (
                      <Link key={product._id} href={`/product/${product.slug}`} className="flex items-center gap-3 px-4 py-2 hover:bg-blue-50 transition-colors">
                        <div className="relative w-10 h-10 flex-shrink-0">
                          <Image
                            src={product.featuredImage || product.images?.[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=40&h=40&fit=crop'}
                            alt={product.name || 'Product'}
                            width={40}
                            height={40}
                            className="object-cover rounded-md w-full h-full"
                            loading="lazy"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-800 truncate">{product.name}</p>
                          <p className="text-xs text-green-600 font-bold">৳{product.sellingPrice || product.price}</p>
                        </div>
                      </Link>
                    ))}
                    <Link href={`/search?q=${searchQuery}`} className="block text-center py-3 bg-gray-50 text-sm text-blue-600 font-bold hover:bg-gray-100 border-t">
                      View all results
                    </Link>
                  </div>
                ) : (
                  <div className="p-4 text-center text-sm text-gray-500">No products found</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Mobile Menu */}
{/* No mobile dropdown menu - hamburger now opens categories only */}
      </div>

      {/* Mobile Bottom Bar - Profile, Support, Cart (Sticky Bottom) - Hidden on product details page */}
      {!isProductPage && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50">
          <div className="flex items-center justify-around py-1.5 px-2">
            {/* Home - Left */}
            <Link href="/" aria-label="Go to Homepage" className="flex flex-col items-center justify-center min-w-[48px] min-h-[48px] gap-1 px-1">
              <Home className="w-5 h-5 text-[#083b66]" />
              <span className="text-[11px] font-semibold text-[#083b66]">Home</span>
            </Link>

            {/* Support */}
            <Link href="/contact" aria-label="Contact Customer Support" className="flex flex-col items-center justify-center min-w-[48px] min-h-[48px] gap-1 px-1">
              <Headphones className="w-5 h-5 text-[#083b66]" />
              <span className="text-[11px] font-semibold text-[#083b66]">Support</span>
            </Link>

            {/* Wishlist */}
            <Link href="/wishlist" aria-label="View Wishlist" className="flex flex-col items-center justify-center min-w-[48px] min-h-[48px] gap-1 px-1 relative">
              <Heart className="w-5 h-5 text-[#083b66]" />
              {wishlistCount > 0 && (
                <span className="absolute top-1 right-2 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                  {wishlistCount}
                </span>
              )}
              <span className="text-[11px] font-semibold text-[#083b66]">Wishlist</span>
            </Link>

            {/* Cart - Opens Drawer */}
            <button onClick={() => setCartOpen(true)} aria-label="Open Shopping Cart" type="button" className="flex flex-col items-center justify-center min-w-[48px] min-h-[48px] gap-1 px-1 relative cursor-pointer">
              <ShoppingBag className="w-5 h-5 text-[#083b66]" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
              <span className="text-[11px] font-semibold text-[#083b66]">Cart</span>
            </button>

            {/* Profile - Right */}
            {user ? (
              <Link href="/profile" aria-label="View User Profile" className="flex flex-col items-center justify-center min-w-[48px] min-h-[48px] gap-1 px-1">
                <User className="w-5 h-5 text-[#083b66]" />
                <span className="text-[11px] font-semibold text-[#083b66]">Profile</span>
              </Link>
            ) : (
              <button onClick={openLoginModal} aria-label="Sign in to your account" type="button" className="flex flex-col items-center justify-center min-w-[48px] min-h-[48px] gap-1 px-1 cursor-pointer">
                <User className="w-5 h-5 text-[#083b66]" />
                <span className="text-[11px] font-semibold text-[#083b66]">Sign In</span>
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
