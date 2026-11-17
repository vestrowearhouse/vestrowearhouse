"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import { CategoryProvider } from "../context/CategoryContext";
import { WishlistProvider } from "../context/WishlistContext";
import { CartProvider } from "../context/CartContext";
import dynamic from "next/dynamic";

// Lazy-load Footer — it's below the fold and not needed for first paint
const Footer = dynamic(() => import("./Footer"), { ssr: true });

export default function UserLayoutWrapper({ children }) {
  const pathname = usePathname();
  
  // Check if we're on an admin route
  const isSpecialRoute = pathname?.startsWith("/admin") || pathname?.startsWith("/admin-login");

  return (
    <>
      {isSpecialRoute ? (
        children
      ) : (
        <CategoryProvider>
          <WishlistProvider>
            <CartProvider>
              <Navbar />
              {children}
              <Footer />
            </CartProvider>
          </WishlistProvider>
        </CategoryProvider>
      )}
    </>
  );
}

