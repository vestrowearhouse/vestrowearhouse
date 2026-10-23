'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCategories } from '../context/CategoryContext';
import CategoryItem from './CategoryItem';

const cleanCategories = (list) => {
  if (!Array.isArray(list)) return [];
  const seen = new Set();
  return list.filter(cat => {
    if (!cat || cat.status === 'inactive') return false;
    if (
      cat.slug?.startsWith('system-') ||
      cat.name?.toLowerCase()?.includes('system quick') ||
      cat.name?.toLowerCase()?.includes('system category')
    ) {
      return false;
    }
    const normalizedName = cat.name?.trim().toLowerCase();
    if (seen.has(normalizedName)) return false;
    seen.add(normalizedName);
    return true;
  });
};

const CategoryMenu = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [openSubSubDropdown, setOpenSubSubDropdown] = useState(null);
  const { isSidebarOpen, closeSidebar } = useCategories();
  const sidebarRef = useRef(null);

  useEffect(() => {
    // Show cached categories instantly to prevent CLS
    try {
      const cached = sessionStorage.getItem('navCategories');
      if (cached) {
        setCategories(cleanCategories(JSON.parse(cached)));
        setLoading(false);
      }
    } catch (_) {}

    const fetchCategories = async () => {
      try {
        const res = await fetch(`/api/categories?nested=true&t=${Date.now()}`);
        const data = await res.json();
        if (data.categories) {
          const cleaned = cleanCategories(data.categories);
          setCategories(cleaned);
          try { sessionStorage.setItem('navCategories', JSON.stringify(cleaned)); } catch (_) {}
        }
        setLoading(false);
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.error('Error loading categories', err);
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div className="w-full bg-[#083b66] border-t border-blue-900/60 shadow-sm hidden md:block sticky top-16 z-40 h-10">
        <div className="max-w-7xl mx-auto px-4 h-full">
          <ul className="flex items-center h-full gap-6">
            <li className="h-3.5 w-12 bg-white/20 rounded animate-pulse"></li>
            <li className="h-3.5 w-20 bg-white/20 rounded animate-pulse"></li>
            <li className="h-3.5 w-24 bg-white/20 rounded animate-pulse"></li>
            <li className="h-3.5 w-20 bg-white/20 rounded animate-pulse"></li>
            <li className="h-3.5 w-20 bg-white/20 rounded animate-pulse ml-auto"></li>
          </ul>
        </div>
      </div>
    );
  }

  const displayCategories = cleanCategories(categories);

  return (
    <>
      {/* Desktop Category Menu - Clean, No Scrollbar, Multi-level Cascading Hover */}
      <div className="w-full bg-[#083b66] text-white border-t border-blue-900/60 shadow-md hidden md:block sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <ul className="flex items-center h-10 gap-5 lg:gap-7 text-[13px] font-semibold tracking-wide uppercase">
            <li className="h-full flex items-center hover:text-amber-300 cursor-pointer transition-colors shrink-0">
              <Link href="/" className="h-full flex items-center">Home</Link>
            </li>

            {displayCategories.map((cat, index) => {
              const isOpen = openDropdown === index;
              const isRightAligned = index >= displayCategories.length - 3;

              return (
                <li
                  key={cat.id || cat._id}
                  className="relative h-full flex items-center cursor-pointer shrink-0"
                  onMouseEnter={() => setOpenDropdown(index)}
                  onMouseLeave={() => {
                    setOpenDropdown(null);
                    setOpenSubSubDropdown(null);
                  }}
                >
                  <Link
                    href={`/category/${cat.slug}`}
                    className={`h-full flex items-center gap-1 transition-colors ${
                      isOpen ? 'text-amber-300 font-bold' : 'hover:text-amber-300'
                    }`}
                  >
                    <span>{cat.name}</span>
                    {cat.subcategories?.length > 0 && (
                      <ChevronDown
                        size={13}
                        className={`transition-transform duration-200 ${isOpen ? 'rotate-180 text-amber-300' : 'opacity-80'}`}
                      />
                    )}
                  </Link>

                  {/* Level 2 Dropdown (Subcategories) */}
                  {cat.subcategories?.length > 0 && isOpen && (
                    <div
                      className={`absolute top-full pt-1 z-[9999] min-w-[220px] ${
                        isRightAligned ? 'right-0' : 'left-0'
                      }`}
                    >
                      <div className="bg-white text-gray-800 shadow-2xl border border-gray-100 rounded-b-xl py-1.5 ring-1 ring-black/5">
                        {cat.subcategories.map((sub, subIndex) => {
                          const isSubActive = openSubSubDropdown === `${index}-${subIndex}`;
                          const hasSubSub = sub.subcategories?.length > 0;

                          return (
                            <div
                              key={sub.id || sub._id}
                              className="relative"
                              onMouseEnter={() => setOpenSubSubDropdown(`${index}-${subIndex}`)}
                            >
                              <Link
                                href={`/category/${sub.slug}`}
                                className={`flex items-center justify-between px-4 py-2.5 text-[13px] font-medium transition-colors border-b border-gray-50 last:border-0 ${
                                  isSubActive
                                    ? 'bg-[#083b66] text-white font-semibold'
                                    : 'hover:bg-[#083b66] hover:text-white text-gray-700'
                                }`}
                              >
                                <span>{sub.name}</span>
                                {hasSubSub && (
                                  <ChevronRight
                                    size={14}
                                    className={`transition-transform ${isSubActive ? 'text-white' : 'text-gray-400'}`}
                                  />
                                )}
                              </Link>

                              {/* Level 3 Dropdown (Sub-subcategories) */}
                              {hasSubSub && isSubActive && (
                                <div
                                  className={`absolute top-0 z-[10000] min-w-[210px] ${
                                    isRightAligned
                                      ? 'right-full pr-1.5 -mr-0.5'
                                      : 'left-full pl-1.5 -ml-0.5'
                                  }`}
                                  onMouseEnter={() => setOpenSubSubDropdown(`${index}-${subIndex}`)}
                                >
                                  <div className="bg-white text-gray-800 shadow-2xl border border-gray-100 rounded-xl py-1.5 ring-1 ring-black/5">
                                    {sub.subcategories.map((subSub) => (
                                      <Link
                                        key={subSub.id || subSub._id}
                                        href={`/category/${subSub.slug}`}
                                        className="block px-4 py-2.5 hover:bg-[#083b66] hover:text-white text-[13px] font-medium text-gray-700 transition-colors border-b border-gray-50 last:border-0"
                                      >
                                        {subSub.name}
                                      </Link>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}

            <li className="h-full flex items-center hover:text-amber-300 cursor-pointer transition-colors uppercase ml-auto shrink-0 font-bold">
              <Link href="/flash-sale" prefetch={false} className="h-full flex items-center gap-1 text-red-400 hover:text-red-300">
                <span>Flash Sale</span>
                <span>🔥</span>
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Mobile Category Sidebar - Only on mobile with smooth transition */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            {/* Backdrop Overlay with smooth fade */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[55] md:hidden"
              onClick={closeSidebar}
            />
            
            {/* Sidebar Drawer with smooth slide-in from left */}
            <motion.div 
              ref={sidebarRef}
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="fixed left-0 top-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl z-[60] md:hidden overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10">
                <h2 className="text-xl font-bold text-gray-800">Categories</h2>
                <button 
                  onClick={closeSidebar}
                  aria-label="Close categories"
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              {/* Categories List */}
              <div className="p-4 overflow-y-auto flex-1 overscroll-contain">
                {displayCategories.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <p>No categories available</p>
                  </div>
                ) : (
                  <nav className="space-y-1">
                    {displayCategories.map((category) => (
                      <CategoryItem 
                        key={category.id || category._id}
                        category={category}
                        level={0}
                      />
                    ))}
                  </nav>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default CategoryMenu;
