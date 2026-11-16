'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Star,
  Heart,
  ShoppingBag,
  Truck,
  Shield,
  RotateCcw,
  Minus,
  Plus,
  Check,
  ChevronRight,
  ArrowLeft,
  Share2,
  Sparkles,
  Loader2,
  Zap,
  MessageCircle,
  CheckCircle2,
  Store,
  ShieldCheck,
  X,
  MapPin,
  ChevronLeft,
  CheckCheck,
  HelpCircle,
  Clock
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import ProductCard from '../../components/ProductCard';
import BuyNowModal from '../../components/BuyNowModal';
import { findActiveVariant } from '@/lib/variantUtils';
import { normalizeId } from '@/lib/normalizeId';

async function getProduct(slug) {
  try {
    const res = await fetch(`/api/products?slug=${encodeURIComponent(slug)}`, { next: { revalidate: 120 } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.products?.[0] || null;
  } catch {
    return null;
  }
}

async function getCategoryInfo(categoryIdOrSlug) {
  if (!categoryIdOrSlug) return null;
  try {
    const res = await fetch('/api/categories', { cache: 'force-cache' });
    if (!res.ok) return null;
    const data = await res.json();
    const categories = data.categories || [];
    const flatten = (cats) => {
      let out = [];
      for (const c of cats) {
        out.push(c);
        if (c.subcategories && c.subcategories.length) {
          out = out.concat(flatten(c.subcategories));
        }
      }
      return out;
    };
    const flat = flatten(categories);
    return flat.find((c) => c.id === categoryIdOrSlug || c._id === categoryIdOrSlug || c.slug === categoryIdOrSlug) || null;
  } catch {
    return null;
  }
}

async function getRelatedProducts(categoryId, currentProductId) {
  try {
    const res = await fetch(`/api/products?category=${encodeURIComponent(categoryId)}&limit=12`, { cache: 'force-cache' });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.products || []).filter((p) => (p._id || p.id) !== currentProductId);
  } catch {
    return [];
  }
}

async function fetchProductReviews(productId) {
  if (!productId) return [];
  try {
    const res = await fetch(`/api/products/${productId}/reviews`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return data.reviews || [];
  } catch {
    return [];
  }
}

async function fetchProductQuestions(productId) {
  if (!productId) return [];
  try {
    const res = await fetch(`/api/products/${productId}/questions`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return data.questions || [];
  } catch {
    return [];
  }
}

function getGuaranteedDeliveryDates() {
  const now = new Date();
  const start = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
  const end = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
  const startDay = start.getDate();
  const endDay = end.getDate();
  const monthName = end.toLocaleDateString('en-US', { month: 'short' });
  return `${startDay}-${endDay} ${monthName}`;
}

export default function ProductPage({ params }) {
  const { slug } = params;
  const router = useRouter();
  const { addToCart, cartCount } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [categoryData, setCategoryData] = useState({ name: '', slug: '' });
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Active top tab state for scroll-spy
  const [activeNavTab, setActiveNavTab] = useState('overview');

  // Modals & Drawers
  const [optionsDrawerOpen, setOptionsDrawerOpen] = useState(false);
  const [buyNowModalOpen, setBuyNowModalOpen] = useState(false);
  const [specsDrawerOpen, setSpecsDrawerOpen] = useState(false);
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [serviceDrawerOpen, setServiceDrawerOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [allReviewsModalOpen, setAllReviewsModalOpen] = useState(false);
  const [writeReviewModalOpen, setWriteReviewModalOpen] = useState(false);
  const [allQuestionsModalOpen, setAllQuestionsModalOpen] = useState(false);
  const [askQuestionModalOpen, setAskQuestionModalOpen] = useState(false);

  // Dynamic variant state
  const [selectedAttrs, setSelectedAttrs] = useState({});

  // Delivery Location State
  const [deliveryLocation, setDeliveryLocation] = useState({
    division: 'Dhaka',
    city: 'Dhaka North',
    area: 'Banani Road No. 12 - 19',
    cost: 60
  });

  // Store follow state
  const [isStoreFollowed, setIsStoreFollowed] = useState(false);

  // Recommendations tab filter
  const [recFilter, setRecFilter] = useState('all');

  // Interactive Reviews state
  const [reviewsList, setReviewsList] = useState([]);
  const [newReviewForm, setNewReviewForm] = useState({
    name: '',
    rating: 5,
    comment: ''
  });

  // Interactive Questions state
  const [questionsList, setQuestionsList] = useState([]);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newQuestionAuthor, setNewQuestionAuthor] = useState('');

  // AI Summary State
  const [aiSummary, setAiSummary] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);

  // Section Refs for Scroll Spy
  const overviewRef = useRef(null);
  const ratingsRef = useRef(null);
  const detailsRef = useRef(null);
  const recsRef = useRef(null);

  // Load saved delivery location from localStorage
  useEffect(() => {
    try {
      const savedLoc = localStorage.getItem('vestro_delivery_location') || localStorage.getItem('stellar_delivery_location');
      if (savedLoc) {
        setDeliveryLocation(JSON.parse(savedLoc));
      }
    } catch {
      // ignore
    }
  }, [slug]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const productData = await getProduct(slug);

      if (!productData) {
        setProduct(null);
        setLoading(false);
        return;
      }

      // Safely parse attributes & variants
      let rawAttrs = productData?.attributes;
      if (typeof rawAttrs === 'string') {
        try { rawAttrs = JSON.parse(rawAttrs); } catch { rawAttrs = []; }
      }
      let rawVars = productData?.variants;
      if (typeof rawVars === 'string') {
        try { rawVars = JSON.parse(rawVars); } catch { rawVars = []; }
      }
      productData.attributes = Array.isArray(rawAttrs) ? rawAttrs : [];
      productData.variants = Array.isArray(rawVars) ? rawVars : [];

      // Pre-select first value of each attribute
      if (productData.attributes.length > 0) {
        const initial = {};
        productData.attributes.forEach((attr) => {
          if (attr.values?.length > 0) initial[attr.name] = attr.values[0];
        });
        setSelectedAttrs(initial);
      }

      setProduct(productData);
      setLoading(false);


      // Load REAL reviews from database - no demo data
      const realReviews = await fetchProductReviews(productData._id || productData.id);
      setReviewsList(realReviews.map(r => ({
        id: r.id,
        customer: r.customer_name,
        customer_name: r.customer_name,
        rating: r.rating,
        date: new Date(r.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        created_at: r.created_at,
        comment: r.comment,
        images: Array.isArray(r.images) ? r.images : [],
        verified_purchase: r.verified_purchase || false,
        admin_reply: r.admin_reply || null,
      })));


      // Load REAL questions from database — no demo data
      const realQuestions = await fetchProductQuestions(productData._id || productData.id);
      setQuestionsList(realQuestions.map(q => ({
        id: q.id,
        question: q.question,
        asker: q.asker_name,
        asker_name: q.asker_name,
        date: new Date(q.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        created_at: q.created_at,
        answer: q.answer || null,
        answerer: q.answerer || null,
        answered_by: q.answered_by || null,
        status: q.status || 'pending',
      })));


      // Resolve category name and related products
      const rawCat = productData?.category;
      let catId = rawCat?.id || rawCat?._id || rawCat?.slug || (typeof rawCat === 'string' ? rawCat : null);

      if (rawCat && typeof rawCat === 'object' && rawCat.name) {
        setCategoryData({ name: rawCat.name, slug: rawCat.slug || '' });
      }

      if (catId) {
        Promise.all([
          getCategoryInfo(catId),
          getRelatedProducts(catId, productData._id || productData.id)
        ])
          .then(([catInfo, related]) => {
            if (catInfo) {
              setCategoryData({ name: catInfo.name, slug: catInfo.slug || '' });
            } else if (!rawCat?.name) {
              const isUuid = /^[0-9a-f-]{36}$/i.test(catId);
              setCategoryData({ name: isUuid ? 'Category' : catId, slug: isUuid ? '' : catId });
            }
            if (related && related.length > 0) {
              setRelatedProducts(related);
            }
          })
          .catch((err) => {
            console.warn('Background category/related fetch:', err);
          });
      }
    }
    fetchData();
  }, [slug]);

  // Derived variant & attributes values
  const parsedAttributes = useMemo(() => {
    const attrs = product?.attributes;
    if (Array.isArray(attrs)) return attrs;
    if (typeof attrs === 'string') {
      try { const p = JSON.parse(attrs); return Array.isArray(p) ? p : []; } catch { return []; }
    }
    return [];
  }, [product?.attributes]);

  const parsedVariants = useMemo(() => {
    const vars = product?.variants;
    if (Array.isArray(vars)) return vars;
    if (typeof vars === 'string') {
      try { const p = JSON.parse(vars); return Array.isArray(p) ? p : []; } catch { return []; }
    }
    return [];
  }, [product?.variants]);

  const hasAttributes = parsedAttributes.length > 0;
  const hasVariants = parsedVariants.length > 0;

  const allAttributesSelected =
    !hasAttributes || parsedAttributes.every((attr) => selectedAttrs[attr.name]);

  const activeVariant = useMemo(() => {
    if (!hasVariants) return null;
    return findActiveVariant(parsedVariants, selectedAttrs);
  }, [hasVariants, parsedVariants, selectedAttrs]);

  const sellingPrice = Number(
    activeVariant?.discountPrice ||
      activeVariant?.price ||
      product?.sellingPrice ||
      product?.selling_price ||
      product?.price ||
      0
  );

  const regularPrice = Number(
    (activeVariant?.discountPrice && activeVariant?.price)
      ? activeVariant.price
      : (activeVariant?.price ||
          product?.regularPrice ||
          product?.regular_price ||
          product?.originalPrice ||
          product?.oldPrice ||
          product?.original_price ||
          0)
  );

  const discount =
    regularPrice > sellingPrice && sellingPrice > 0
      ? Math.round(((regularPrice - sellingPrice) / regularPrice) * 100)
      : 0;

  const hasStockField =
    (product?.stock !== undefined && product?.stock !== null) ||
    (product?.stockQuantity !== undefined && product?.stockQuantity !== null);

  const productBaseStock = Math.max(
    Number(product?.stockQuantity ?? 0),
    Number(product?.stock ?? 0)
  );

  const stockQty = Number(
    activeVariant
      ? activeVariant.stock !== undefined && activeVariant.stock !== null
        ? activeVariant.stock
        : hasStockField
        ? productBaseStock
        : 1
      : hasStockField
      ? productBaseStock
      : 1
  );

  const isInStock =
    product?.stockStatus === 'out_of_stock'
      ? false
      : activeVariant
      ? activeVariant.status !== 'inactive' && stockQty > 0
      : hasStockField && productBaseStock <= 0
      ? false
      : product?.stockStatus === 'in_stock'
      ? true
      : hasStockField
      ? stockQty > 0
      : true;

  const displaySku = useMemo(() => {
    if (activeVariant?.sku) return activeVariant.sku.toUpperCase();
    if (product?.sku && product.sku.trim()) {
      return product.sku.toUpperCase();
    }
    return '';
  }, [activeVariant?.sku, product?.sku]);

  const selectedOptionsSummary = useMemo(() => {
    const entries = Object.entries(selectedAttrs);
    if (entries.length === 0) return 'Standard';
    return entries.map(([k, v]) => `${k}: ${v}`).join(', ');
  }, [selectedAttrs]);

  // Images resolution
  const allImages = useMemo(() => {
    const parseImages = (imgs) => {
      if (!imgs) return [];
      if (Array.isArray(imgs)) return imgs.filter(Boolean);
      if (typeof imgs === 'string') {
        try {
          const parsed = JSON.parse(imgs);
          if (Array.isArray(parsed)) return parsed.filter(Boolean);
        } catch {
          return [imgs];
        }
      }
      return [];
    };

    const variantImgs = parseImages(activeVariant?.images);
    if (variantImgs.length > 0) return variantImgs;

    const productImgs = parseImages(product?.images);
    if (productImgs.length > 0) return productImgs;

    if (product?.featuredImage) return [product.featuredImage];
    if (product?.image) return [product.image];
    return ['https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&q=80'];
  }, [activeVariant, product]);

  useEffect(() => {
    setSelectedImage(0);
  }, [activeVariant]);

  const currentImage = allImages[selectedImage] || allImages[0];
  const productId = normalizeId(product);
  const isWishlisted = isInWishlist(productId);

  const handleToggleWishlist = async () => {
    if (!productId) return;
    if (isWishlisted) {
      await removeFromWishlist(productId);
    } else {
      await addToWishlist({
        _id: productId,
        id: productId,
        name: product?.name || 'Product',
        slug: product?.slug || productId,
        image: currentImage || product?.featuredImage || '/placeholder.jpg',
        price: sellingPrice || 0,
        inStock: isInStock
      });
    }
  };

  const handleAttrSelect = (attrName, value) => {
    setSelectedAttrs((prev) => ({ ...prev, [attrName]: value }));
    setQuantity(1);
  };

  const handleQuantityChange = (delta) => {
    const max = Math.max(stockQty, 1);
    const newQty = quantity + delta;
    if (newQty >= 1 && newQty <= max) setQuantity(newQty);
  };

  const handleAddToCart = async () => {
    if (isAdding || added || !isInStock) return;
    if (hasAttributes && !allAttributesSelected) {
      setOptionsDrawerOpen(true);
      return;
    }
    setIsAdding(true);
    const variantData = (activeVariant || Object.keys(selectedAttrs).length > 0)
      ? {
          variantSku: activeVariant?.sku || displaySku,
          selectedAttributes: selectedAttrs,
          variantPrice: sellingPrice,
          variantImage: activeVariant?.images?.[0] || null,
        }
      : null;
    const res = await addToCart(product, quantity, variantData);
    setIsAdding(false);
    if (res?.success) {
      setAdded(true);
      setTimeout(() => setAdded(false), 2200);
      setOptionsDrawerOpen(false);
    } else {
      alert(res?.message || 'Failed to add to cart');
    }
  };

  const handleBuyNow = () => {
    if (isAdding || added || !isInStock) return;
    if (hasAttributes && !allAttributesSelected) {
      setOptionsDrawerOpen(true);
      return;
    }
    if (optionsDrawerOpen) {
      setOptionsDrawerOpen(false);
    }
    setBuyNowModalOpen(true);
  };

  const handleDirectOrder = () => {
    const selectedVariantPayload = {
      variantSku: activeVariant?.sku || displaySku,
      selectedAttributes: selectedAttrs,
      variantPrice: sellingPrice,
      variantImage: activeVariant?.images?.[0] || null,
    };
    try {
      sessionStorage.setItem('vestro_buynow_variant', JSON.stringify(selectedVariantPayload));
    } catch (e) {}

    const attrParam = encodeURIComponent(JSON.stringify(selectedAttrs));
    const skuParam = encodeURIComponent(activeVariant?.sku || displaySku);
    router.push(`/checkout?buyNow=${productId}&qty=${quantity}&price=${sellingPrice}&variantSku=${skuParam}&attrs=${attrParam}&source=product`);
  };

  const handleShare = async () => {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: product?.name || 'Vestro Wear House',
          text: `Check out ${product?.name} at Vestro Wear House!`,
          url: shareUrl,
        });
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
      }
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      } catch {
        // ignore
      }
    }
  };

  const toggleStoreFollow = () => {
    setIsStoreFollowed(!isStoreFollowed);
  };



  // Save new review → POST to real database
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');

  const handleAddReview = async (e) => {
    e.preventDefault();
    if (!newReviewForm.comment.trim() || !newReviewForm.name.trim()) return;
    const productId = product?._id || product?.id;
    if (!productId) return;

    setReviewSubmitting(true);
    setReviewError('');
    try {
      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: newReviewForm.name.trim(),
          rating: Number(newReviewForm.rating) || 5,
          comment: newReviewForm.comment.trim(),
          images: [],
          user_id: user?.id || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit review');

      // Map DB fields to UI shape and prepend
      const saved = data.review;
      const newRev = {
        id: saved.id,
        customer: saved.customer_name,
        customer_name: saved.customer_name,
        rating: saved.rating,
        date: new Date(saved.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        created_at: saved.created_at,
        comment: saved.comment,
        images: saved.images || [],
        verified_purchase: false,
      };
      setReviewsList((prev) => [newRev, ...prev]);
      setNewReviewForm({ name: '', rating: 5, comment: '' });
      setWriteReviewModalOpen(false);
    } catch (err) {
      setReviewError(err.message || 'Could not submit review. Please try again.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  // Save new question → POST to real database
  const [questionSubmitting, setQuestionSubmitting] = useState(false);
  const [questionError, setQuestionError] = useState('');

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    if (!newQuestionText.trim()) return;
    const productId = product?._id || product?.id;
    if (!productId) return;

    setQuestionSubmitting(true);
    setQuestionError('');
    try {
      const res = await fetch(`/api/products/${productId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: newQuestionText.trim(),
          asker_name: newQuestionAuthor.trim() || (user?.name || user?.email?.split('@')[0]) || 'Anonymous',
          user_id: user?.id || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit question');

      const saved = data.question;
      const newQ = {
        id: saved.id,
        question: saved.question,
        asker: saved.asker_name,
        asker_name: saved.asker_name,
        date: new Date(saved.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        created_at: saved.created_at,
        answer: null,
        answerer: null,
      };
      setQuestionsList((prev) => [newQ, ...prev]);
      setNewQuestionText('');
      setNewQuestionAuthor('');
      setAskQuestionModalOpen(false);
    } catch (err) {
      setQuestionError(err.message || 'Could not submit question. Please try again.');
    } finally {
      setQuestionSubmitting(false);
    }
  };

  // Delivery location selection handler
  const handleUpdateLocation = (div, ct, ar, fee) => {
    const loc = { division: div, city: ct, area: ar, cost: fee };
    setDeliveryLocation(loc);
    try {
      localStorage.setItem('vestro_delivery_location', JSON.stringify(loc));
    } catch {
      // ignore
    }
    setDeliveryModalOpen(false);
  };

  // AI Review summary generator
  const generateReviewSummary = async () => {
    setIsSummarizing(true);
    try {
      const reviewsData = reviewsList.map((r) => ({ text: r.comment }));
      const res = await fetch('/api/ai/summarize-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviews: reviewsData, productName: product?.name }),
      });
      const data = await res.json();
      if (data.summary) setAiSummary(data.summary);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSummarizing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold tracking-wider uppercase text-neutral-500">Loading collection...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 mx-auto mb-4 bg-neutral-100 rounded-2xl flex items-center justify-center text-2xl">
            📦
          </div>
          <h1 className="text-xl font-bold text-neutral-900 mb-2">Product Not Found</h1>
          <p className="text-sm text-neutral-500 mb-6">
            The item you are looking for might have been moved or is currently out of stock.
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center justify-center gap-2 w-full px-5 py-3 bg-neutral-900 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-sm hover:bg-black transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Collection
          </Link>
        </div>
      </div>
    );
  }

  const categoryTitle = categoryData.name || 'Products';
  const categorySlug = categoryData.slug;
  const isOfficial = true;
  const storeName = 'Vestro Wear House';
  const guaranteedDate = getGuaranteedDeliveryDates();

  const filteredRecs = relatedProducts.length > 0 ? relatedProducts : [];

  return (
    <div className="min-h-screen bg-white pb-24 md:pb-16 text-neutral-900 selection:bg-neutral-200 w-full max-w-full">
      
      {/* Toast notifications */}
      {copiedLink && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-black text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg flex items-center gap-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          Link copied to clipboard!
        </div>
      )}

      {/* ── BREADCRUMB ROW ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 hidden md:block">
        <nav className="flex items-center gap-2 text-xs text-neutral-500 uppercase tracking-wider truncate">
          <Link href="/" className="hover:text-black transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3 text-neutral-400 shrink-0" />
          <Link href="/shop" className="hover:text-black transition-colors">Shop</Link>
          <ChevronRight className="w-3 h-3 text-neutral-400 shrink-0" />
          <Link
            href={categorySlug ? `/category/${categorySlug}` : '/categories'}
            className="hover:text-black transition-colors font-semibold text-neutral-800 truncate max-w-[200px]"
          >
            {categoryTitle}
          </Link>
          <Link href="/" className="hover:text-[#083b66] transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3 text-gray-400 shrink-0" />
          <Link href="/shop" className="hover:text-[#083b66] transition-colors">Shop</Link>
          <ChevronRight className="w-3 h-3 text-gray-400 shrink-0" />
          <Link
            href={categorySlug ? `/category/${categorySlug}` : '/categories'}
            className="hover:text-[#083b66] transition-colors font-medium text-gray-700 truncate max-w-[200px]"
          >
            {categoryTitle}
          </Link>
          <ChevronRight className="w-3 h-3 text-gray-400 shrink-0" />
          <span className="text-gray-400 truncate max-w-[300px]">{product.name}</span>
        </nav>
      </div>

      {/* ── MAIN CONTENT CONTAINER (FULL DESKTOP WIDTH max-w-7xl) ── */}
      <div className="max-w-7xl mx-auto px-0 sm:px-4 lg:px-6 w-full min-w-0">

        {/* ── SECTION 1: OVERVIEW (HERO CARD WITH 2-COLUMN SPLIT ON PC) ── */}
        <section id="sec-overview" ref={overviewRef} className="bg-white sm:rounded-2xl border-y sm:border border-gray-200/80 shadow-xs overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 lg:gap-8 items-start">

            {/* ── LEFT COLUMN: PRODUCT IMAGES (lg:col-span-5) ── */}
            <div className="lg:col-span-5 w-full p-0 sm:p-5 lg:sticky lg:top-[120px] self-start">
              
              {/* Main Image Frame (Fashion Portrait aspect-[3/4]) */}
              <div className="relative aspect-[3/4] w-full bg-neutral-100 sm:rounded-xl overflow-hidden border-b sm:border border-neutral-200 flex items-center justify-center">
                <Image
                  src={currentImage}
                  alt={product.name}
                  fill
                  priority
                  quality={90}
                  sizes="(max-width: 1024px) 100vw, 550px"
                  className="object-cover select-none transition-transform duration-500 md:hover:scale-105"
                />

                {/* Discount Badge */}
                {discount > 0 && (
                  <div className="absolute top-3.5 left-3.5 z-10 px-2.5 py-1 bg-black text-white text-[11px] font-black uppercase tracking-wider rounded shadow-sm">
                    -{discount}%
                  </div>
                )}

                {/* Wishlist & Share buttons on image (Mobile Floating) */}
                <div className="md:hidden absolute top-3.5 right-3.5 z-10 flex items-center gap-1.5">
                  <button
                    onClick={handleToggleWishlist}
                    aria-label="Wishlist"
                    className="p-2 bg-white/90 hover:bg-white backdrop-blur-sm rounded-full shadow-sm text-neutral-700 active:scale-95 transition-transform"
                  >
                    <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-neutral-900 text-neutral-900' : ''}`} />
                  </button>
                  <button
                    onClick={handleShare}
                    aria-label="Share"
                    className="p-2 bg-white/90 hover:bg-white backdrop-blur-sm rounded-full shadow-sm text-neutral-700 active:scale-95 transition-transform"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Out of Stock Overlay */}
                {!isInStock && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] flex items-center justify-center z-20 pointer-events-none">
                    <span className="bg-neutral-900 text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-full shadow-lg">
                      Out of Stock
                    </span>
                  </div>
                )}

                {/* Mobile Image Counter Pill 1/3 */}
                {allImages.length > 0 && (
                  <div className="sm:hidden absolute bottom-3 right-3 z-10 px-2.5 py-0.5 bg-black/70 backdrop-blur-sm text-white text-[11px] font-bold rounded-full pointer-events-none">
                    {selectedImage + 1}/{allImages.length}
                  </div>
                )}
              </div>

              {/* Thumbnails Row */}
              {allImages.length > 1 && (
                <div className="flex gap-2 p-3 sm:px-0 sm:pt-3 overflow-x-auto no-scrollbar bg-white">
                  {allImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`flex-shrink-0 w-16 h-20 rounded-lg border-2 transition-all p-0.5 bg-neutral-100 cursor-pointer overflow-hidden ${
                        selectedImage === idx
                          ? 'border-neutral-900 ring-2 ring-neutral-900/20 shadow-xs'
                          : 'border-neutral-200 hover:border-neutral-400 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <div className="relative w-full h-full aspect-[3/4]">
                        <Image
                          src={img}
                          alt={`Thumbnail ${idx + 1}`}
                          fill
                          className="object-cover rounded"
                          sizes="64px"
                        />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── RIGHT COLUMN: PRODUCT INFO & DESKTOP ACTIONS (lg:col-span-7) ── */}
            <div className="lg:col-span-7 p-4 sm:p-6 lg:p-7 flex flex-col justify-start">
              
              {/* Brand & SKU Header */}
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="text-[11px] font-bold tracking-[0.2em] text-neutral-500 uppercase">
                  Vestro Wear House
                </span>

                {product.brand && (
                  <span className="px-2 py-0.5 bg-neutral-100 text-neutral-700 text-[11px] font-semibold rounded uppercase tracking-wider">
                    {product.brand}
                  </span>
                )}

                <span className="text-[11px] font-medium text-neutral-400 font-mono ml-auto">
                  SKU: {displaySku}
                </span>
              </div>

              {/* Product Title */}
              <h1 className="text-xl sm:text-2xl lg:text-[28px] font-bold text-neutral-900 leading-snug tracking-tight mb-2.5">
                {product.name}
              </h1>

              {/* Rating, Reviews and Wishlist Bar */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-neutral-100 flex-wrap gap-2">
                <div className="flex items-center gap-2 text-xs">
                  <div className="flex text-amber-400">
                    {[...Array(5)].map((_, i) => {
                      const curRating = reviewsList.length > 0
                        ? (reviewsList.reduce((acc, r) => acc + (Number(r.rating) || 5), 0) / reviewsList.length)
                        : (Number(product.rating) || 5);
                      return (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < Math.floor(curRating)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-neutral-200 fill-neutral-200'
                          }`}
                        />
                      );
                    })}
                  </div>
                  <span className="font-bold text-neutral-900">
                    {reviewsList.length > 0
                      ? (reviewsList.reduce((acc, r) => acc + (Number(r.rating) || 5), 0) / reviewsList.length).toFixed(1)
                      : (product.rating ? Number(product.rating).toFixed(1) : '5.0')}
                  </span>
                  <span className="text-neutral-400">
                    ({reviewsList.length} {reviewsList.length === 1 ? 'review' : 'reviews'})
                  </span>
                  {Number(product.sold_count || product.sales_count || 0) > 0 && (
                    <>
                      <span className="text-neutral-300">•</span>
                      <span className="text-neutral-900 bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded text-[11px] font-semibold">
                        {product.sold_count || product.sales_count} sold
                      </span>
                    </>
                  )}
                </div>

                {/* Desktop Wishlist & Share buttons */}
                <div className="hidden md:flex items-center gap-2">
                  <button
                    onClick={handleToggleWishlist}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                      isWishlisted
                        ? 'bg-neutral-900 border-neutral-900 text-white'
                        : 'border-neutral-200 text-neutral-600 hover:border-neutral-900'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-white text-white' : ''}`} />
                    <span>{isWishlisted ? 'Wishlisted' : 'Add to Wishlist'}</span>
                  </button>

                  <button
                    onClick={handleShare}
                    className="p-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:border-neutral-900 hover:text-neutral-900 transition-colors"
                    title="Share product"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Price Block */}
              <div className="flex items-baseline gap-3 mb-4 bg-neutral-50 p-3.5 sm:p-4 rounded-xl border border-neutral-200">
                <span className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-neutral-900 tracking-tight">
                  ৳{sellingPrice.toLocaleString('en-IN')}
                </span>
                {discount > 0 && (
                  <>
                    <span className="text-sm sm:text-base text-neutral-400 line-through font-mono">
                      ৳{regularPrice.toLocaleString('en-IN')}
                    </span>
                    <span className="px-2 py-0.5 bg-neutral-900 text-white text-xs font-bold rounded">
                      Save ৳{(regularPrice - sellingPrice).toLocaleString('en-IN')} (-{discount}%)
                    </span>
                  </>
                )}
                <span className="text-xs text-neutral-400 ml-auto hidden sm:inline">
                  (VAT Inclusive)
                </span>
              </div>

              {/* Dynamic Variant Attributes (Desktop & Mobile Inline) */}
              {hasAttributes && (
                <div className="space-y-3.5 mb-4">
                  {parsedAttributes.map((attr) => (
                    <div key={attr.name}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                          {attr.name}: <span className="text-neutral-900 font-extrabold">{selectedAttrs[attr.name] || 'Select'}</span>
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {attr.values?.map((val) => {
                          const isSelected = selectedAttrs[attr.name] === val;
                          return (
                            <button
                              key={val}
                              type="button"
                              onClick={() => handleAttrSelect(attr.name, val)}
                              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border cursor-pointer active:scale-95 ${
                                isSelected
                                  ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm ring-2 ring-neutral-900/20'
                                  : 'bg-white text-neutral-800 border-neutral-200 hover:border-neutral-900'
                              }`}
                            >
                              {val}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Mobile-Only Product Options Drawer Trigger Row */}
              {hasAttributes && (
                <div
                  onClick={() => setOptionsDrawerOpen(true)}
                  className="md:hidden flex items-center justify-between p-3.5 mb-3 bg-neutral-50 rounded-xl border border-neutral-200 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-500 font-medium">Product Options:</span>
                    <span className="text-xs text-neutral-900 font-bold truncate max-w-[170px]">
                      {selectedOptionsSummary}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-neutral-900 font-bold">
                    <span>Change</span>
                    <ChevronRight className="w-4 h-4 text-neutral-400" />
                  </div>
                </div>
              )}

              {/* ── DESKTOP BUTTONS & QUANTITY STEPPER (High Fashion Minimalist Aesthetic) ── */}
              <div className="hidden md:flex items-center gap-3 pt-2 mb-5">
                
                {/* Quantity */}
                <div className="flex items-center border border-neutral-300 rounded-lg overflow-hidden bg-white h-12 shadow-2xs">
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                    className="w-10 h-full flex items-center justify-center hover:bg-neutral-100 disabled:opacity-40 transition-colors"
                  >
                    <Minus className="w-4 h-4 text-neutral-700" />
                  </button>
                  <span className="w-10 text-center font-bold text-sm text-neutral-900">
                    {quantity}
                  </span>
                  <button
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= stockQty}
                    className="w-10 h-full flex items-center justify-center hover:bg-neutral-100 disabled:opacity-40 transition-colors"
                  >
                    <Plus className="w-4 h-4 text-neutral-700" />
                  </button>
                </div>

                {/* Add to Cart - Minimalist Black/White */}
                <button
                  onClick={handleAddToCart}
                  disabled={!isInStock || isAdding}
                  className={`flex-1 h-12 px-6 rounded-lg font-bold text-xs uppercase tracking-[0.16em] flex items-center justify-center gap-2 transition-all shadow-sm active:scale-98 cursor-pointer ${
                    added
                      ? 'bg-neutral-900 text-white'
                      : isInStock
                      ? 'bg-white hover:bg-neutral-100 text-neutral-900 border-2 border-neutral-900'
                      : 'bg-neutral-100 text-neutral-400 border border-neutral-200 cursor-not-allowed'
                  }`}
                >
                  {added ? (
                    <>
                      <Check className="w-4 h-4" /> Added to Bag
                    </>
                  ) : isAdding ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Adding...
                    </>
                  ) : !isInStock ? (
                    'Out of Stock'
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" /> Add to Bag
                    </>
                  )}
                </button>

                {/* Buy Now - Solid Black Primary Button */}
                <button
                  onClick={handleBuyNow}
                  disabled={!isInStock || isAdding}
                  className="flex-1 h-12 px-6 rounded-lg font-bold text-xs uppercase tracking-[0.16em] flex items-center justify-center gap-2 transition-all shadow-sm bg-neutral-900 hover:bg-black text-white active:scale-98 cursor-pointer disabled:bg-neutral-200 disabled:text-neutral-400 disabled:cursor-not-allowed"
                >
                  <Zap className="w-4 h-4 fill-current" /> Order Now
                </button>
              </div>

              {/* ── DELIVERY & SERVICE INFO CARDS (Desktop & Mobile) ── */}
              <div className="space-y-2.5 pt-2 border-t border-neutral-100">
                
                {/* Delivery Box */}
                <div
                  onClick={() => setDeliveryModalOpen(true)}
                  className="p-3.5 bg-neutral-50 hover:bg-neutral-100/80 border border-neutral-200 rounded-xl cursor-pointer transition-all"
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-bold text-neutral-900 flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-neutral-900" /> হোম ডেলিভারি (Nationwide Delivery)
                    </span>
                    <span className="text-neutral-900 font-bold flex items-center gap-0.5 hover:underline">
                      লোকেশন পরিবর্তন <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <div className="text-xs text-neutral-600 flex items-center justify-between">
                    <span>
                      {deliveryLocation.district === 'Dhaka' ? 'ঢাকার ভেতরে (২-৩ দিন)' : 'ঢাকার বাইরে (৩-৫ দিন)'}:{' '}
                      <span className="font-bold text-neutral-900 font-mono">
                        ৳{deliveryLocation.district === 'Dhaka' ? '60' : '120'}
                      </span>
                    </span>
                    <span className="text-[11px] text-neutral-500">{guaranteedDate}</span>
                  </div>
                </div>

                {/* Return & Warranty Strip */}
                <div className="p-3.5 bg-white border border-neutral-200 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <RotateCcw className="w-4 h-4 text-neutral-900 shrink-0" />
                      <span className="font-bold text-neutral-800">৭ দিনের সাইজ ও পণ্য এক্সচেঞ্জ পলিসি</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-neutral-500 pl-5">
                    সাইজ অমিল বা ত্রুটি থাকলে ডেলিভারির ৭ দিনের মধ্যে সহজ এক্সচেঞ্জ সুবিধা পাবেন।
                  </p>
                  
                  <div className="flex items-center justify-between pt-1 border-t border-neutral-100">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-neutral-900 shrink-0" />
                      <span className="font-bold text-neutral-800">১০০% অথেনটিক কোয়ালিটি গ্যারান্টি</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-neutral-500 pl-5">
                    প্রিমিয়াম ফেব্রিক ও পারফেক্ট স্টিচিং। রাইডারের সামনে চেক করে রিসিভ করার সুযোগ রয়েছে।
                  </p>
                </div>

                {/* Vestro Brand Trust Card */}
                <div className="p-3.5 bg-neutral-900 text-white rounded-xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center shrink-0 overflow-hidden p-1.5">
                      <img
                        src="/vestro-logo-white.png"
                        alt="Vestro Wear House"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-white truncate tracking-wide">
                        Vestro Wear House
                      </h4>
                      <p className="text-[11px] text-neutral-400">
                        Official Streetwear & Fashion Flagship
                      </p>
                    </div>
                  </div>

                  <Link
                    href="/shop"
                    className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-white text-neutral-900 hover:bg-neutral-100 transition-colors uppercase tracking-wider"
                  >
                    View All
                  </Link>
                </div>

              </div>

            </div>
          </div>
        </section>

        {/* ── SECTION 2: PRODUCT DETAILS & SPECIFICATIONS (FULL DESKTOP WIDTH) ── */}
        <section id="sec-details" ref={detailsRef} className="mt-4 bg-white sm:rounded-2xl border-y sm:border border-gray-200/80 shadow-xs p-4 sm:p-7">
          <h2 className="text-base sm:text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
            <span>Product Details & Specifications</span>
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Description */}
            <div className="lg:col-span-8 prose prose-sm max-w-none text-gray-700 leading-relaxed text-xs sm:text-sm break-words overflow-x-auto">
              {product.description ? (
                <div dangerouslySetInnerHTML={{ __html: product.description }} />
              ) : (
                <p>Authentic quality product crafted by Vestro Wear House. Experience premium fabric, precise tailoring, and high durability.</p>
              )}

              {product.tags?.length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-gray-500">Tags:</span>
                  {product.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-0.5 bg-blue-50 text-[#083b66] text-xs font-semibold rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Specifications Table */}
            <div className="lg:col-span-4">
              <div className="rounded-xl border border-gray-200 overflow-hidden divide-y divide-gray-100 text-xs">
                <div className="p-3 bg-gray-50 font-bold text-gray-900">
                  Technical Specifications
                </div>
                <div className="flex p-3 bg-white">
                  <span className="w-1/3 text-gray-500 font-medium">Brand</span>
                  <span className="w-2/3 font-bold text-gray-900">{product.brand || 'No Brand'}</span>
                </div>
                <div className="flex p-3 bg-gray-50/50">
                  <span className="w-1/3 text-gray-500 font-medium">SKU</span>
                  <span className="w-2/3 font-mono text-gray-900">{displaySku}</span>
                </div>
                <div className="flex p-3 bg-white">
                  <span className="w-1/3 text-gray-500 font-medium">Category</span>
                  <span className="w-2/3 text-gray-900">{categoryTitle}</span>
                </div>
                <div className="flex p-3 bg-gray-50/50">
                  <span className="w-1/3 text-gray-500 font-medium">Warranty</span>
                  <span className="w-2/3 text-gray-900">14 Days Easy Return</span>
                </div>
                <div className="flex p-3 bg-white">
                  <span className="w-1/3 text-gray-500 font-medium">Box Content</span>
                  <span className="w-2/3 text-gray-900">1x Main Product Unit, Standard Packaging</span>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ── SECTION 3: RATINGS AND REVIEWS ── */}
        <section id="sec-ratings" ref={ratingsRef} className="mt-4 bg-white sm:rounded-2xl border-y sm:border border-gray-200/80 shadow-xs p-4 sm:p-7">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100 flex-wrap gap-2">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900">
                Customer Ratings & Reviews ({reviewsList.length})
              </h2>
              <p className="text-xs text-gray-500">Verified buyer feedback and unboxing photos</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={generateReviewSummary}
                disabled={isSummarizing || reviewsList.length === 0}
                className="text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                {isSummarizing ? 'Analyzing...' : aiSummary ? 'AI Summary' : 'AI Review Insights'}
              </button>

              <button
                onClick={() => {
                  if (user) {
                    setNewReviewForm((prev) => ({
                      ...prev,
                      name: user.name || user.fullName || user.email?.split('@')[0] || ''
                    }));
                  }
                  setWriteReviewModalOpen(true);
                }}
                className="text-xs text-white bg-[#083b66] hover:bg-[#062d4d] px-3.5 py-1.5 rounded-lg font-bold transition-colors cursor-pointer shadow-xs"
              >
                Write a Review
              </button>
            </div>
          </div>

          {aiSummary && (
            <div className="mb-4 p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl text-xs sm:text-sm text-blue-950 leading-relaxed font-medium">
              <span className="font-bold text-blue-700 block mb-0.5">✨ AI Consensus Summary:</span>
              "{aiSummary}"
            </div>
          )}

          {reviewsList.length === 0 ? (
            <div className="text-center py-10 px-4 bg-gray-50/70 rounded-xl border border-dashed border-gray-200">
              <MessageCircle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-gray-700">No reviews yet</p>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                Be the first to review this product and help others make a confident choice!
              </p>
              <button
                onClick={() => {
                  if (user) {
                    setNewReviewForm((prev) => ({
                      ...prev,
                      name: user.name || user.fullName || user.email?.split('@')[0] || ''
                    }));
                  }
                  setWriteReviewModalOpen(true);
                }}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-[#083b66] hover:bg-[#062d4d] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                <Star className="w-3.5 h-3.5 fill-current text-amber-300" />
                Write the First Review
              </button>
            </div>
          ) : (
            <>
              {/* Featured Reviews List */}
              <div className="space-y-4">
                {reviewsList.slice(0, 3).map((rev, revIdx) => (
                  <div key={rev.id || revIdx} className="pb-4 border-b border-gray-100 last:border-b-0 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">{rev.customer || rev.customer_name}</span>
                        {rev.verified_purchase && (
                          <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded font-semibold">
                            Verified Purchase
                          </span>
                        )}
                      </div>
                      <div className="flex text-amber-400">
                        {[...Array(Number(rev.rating) || 5)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                      {rev.comment}
                    </p>

                    {/* Customer Photo Thumbnails */}
                    {rev.images && rev.images.length > 0 && (
                      <div className="flex gap-2 pt-1 max-w-md">
                        {rev.images.slice(0, 4).map((photoUrl, idx) => (
                          <div
                            key={idx}
                            onClick={() => setLightboxIndex(idx)}
                            className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 cursor-pointer group shrink-0"
                          >
                            <Image
                              src={photoUrl}
                              alt="Customer photo review"
                              fill
                              className="object-cover group-hover:scale-105 transition-transform"
                              sizes="80px"
                            />
                            {idx === 3 && rev.images.length > 4 && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-sm font-bold">
                                +{rev.images.length - 3}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Seller or Admin Response */}
                    {rev.admin_reply && (
                      <div className="mt-2.5 pl-3 py-2 bg-slate-50 border-l-2 border-[#083b66] rounded-r-lg text-xs">
                        <span className="font-bold text-[#083b66] block">Seller Reply:</span>
                        <p className="text-gray-700 mt-0.5">{rev.admin_reply}</p>
                      </div>
                    )}

                    <div className="text-[11px] text-gray-400">
                      {rev.date}
                    </div>
                  </div>
                ))}
              </div>

              {reviewsList.length > 3 && (
                <div className="pt-2 text-center">
                  <button
                    onClick={() => setAllReviewsModalOpen(true)}
                    className="text-xs font-bold text-[#0066cc] hover:underline"
                  >
                    View All Reviews ({reviewsList.length}) →
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        {/* ── SECTION 4: QUESTIONS ABOUT THIS PRODUCT (Q&A) ── */}
        <section className="mt-4 bg-white sm:rounded-2xl border-y sm:border border-gray-200/80 shadow-xs p-4 sm:p-7">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900">
                Questions About This Product ({questionsList.length})
              </h2>
              <p className="text-xs text-gray-500">Have questions? Get answers from the seller and community</p>
            </div>

            <button
              onClick={() => {
                if (user) {
                  setNewQuestionAuthor(user.name || user.fullName || user.email?.split('@')[0] || '');
                }
                setAskQuestionModalOpen(true);
              }}
              className="text-xs font-bold text-[#083b66] border border-[#083b66] hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              Ask Question
            </button>
          </div>

          {questionsList.length === 0 ? (
            <div className="text-center py-10 px-4 bg-gray-50/70 rounded-xl border border-dashed border-gray-200">
              <HelpCircle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-gray-700">Have a question about this product?</p>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                Ask about product details, sizing, material, or delivery. The store seller will respond directly!
              </p>
              <button
                onClick={() => {
                  if (user) {
                    setNewQuestionAuthor(user.name || user.fullName || user.email?.split('@')[0] || '');
                  }
                  setAskQuestionModalOpen(true);
                }}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 border-2 border-[#083b66] text-[#083b66] hover:bg-[#083b66] hover:text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Ask a Question
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {questionsList.map((q) => (
                <div key={q.id} className="pb-3 border-b border-gray-100 last:border-b-0 space-y-2 text-xs sm:text-sm">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded bg-[#083b66] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      Q
                    </span>
                    <div>
                      <p className="font-bold text-gray-900">{q.question}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{q.asker || q.asker_name || 'Anonymous'} • {q.date}</p>
                    </div>
                  </div>

                  {q.answer ? (
                    <div className="flex items-start gap-2.5 pl-7 bg-blue-50/50 p-2.5 rounded-lg border border-blue-100/60">
                      <span className="w-5 h-5 rounded bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                        A
                      </span>
                      <div>
                        <p className="font-medium text-gray-800">{q.answer}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {q.answerer || (q.answered_by === 'vendor' ? 'Store Official' : 'Official Reply')} • Answered {q.date}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="pl-7 text-[11px] text-amber-600 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      <span>Awaiting answer from seller</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="pt-3 text-center">
            <button
              onClick={() => {
                if (user) {
                  setNewQuestionAuthor(user.name || user.fullName || user.email?.split('@')[0] || '');
                }
                setAskQuestionModalOpen(true);
              }}
              className="py-2.5 px-6 border-2 border-[#083b66] text-[#083b66] hover:bg-[#083b66] hover:text-white text-xs font-bold rounded-lg uppercase tracking-wider transition-all cursor-pointer shadow-2xs"
            >
              ASK QUESTIONS
            </button>
          </div>
        </section>

        {/* ── SECTION 5: RECOMMENDATIONS / "JUST FOR YOU" (RESPONSIVE GRID) ── */}
        <section id="sec-recommendations" ref={recsRef} className="mt-6 mb-8 px-4 sm:px-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-2xl font-black text-gray-900 tracking-tight">
                Just For You
              </h2>
              <Sparkles className="w-5 h-5 text-amber-500 fill-amber-500" />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setRecFilter('all')}
                className={`px-3 py-1 text-xs font-bold rounded-full transition-all cursor-pointer ${
                  recFilter === 'all'
                    ? 'bg-[#083b66] text-white shadow-xs'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
                }`}
              >
                All
              </button>

              <button
                onClick={() => setRecFilter('deals')}
                className={`px-3 py-1 text-xs font-bold rounded-full transition-all cursor-pointer ${
                  recFilter === 'deals'
                    ? 'bg-[#083b66] text-white shadow-xs'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
                }`}
              >
                🔥 Mega Deals
              </button>
            </div>
          </div>

          {/* 2-column mobile / 4-column desktop grid using standard ProductCard */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {filteredRecs.map((relProduct) => (
              <ProductCard key={relProduct._id || relProduct.id} product={relProduct} />
            ))}
          </div>
        </section>

      </div>

      {/* ── MOBILE-ONLY STICKY BOTTOM ACTION BAR (md:hidden) ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
        <div className="flex items-center h-14 px-3 gap-2">
          
          {/* Shop Catalog Link */}
          <Link
            href="/shop"
            className="flex flex-col items-center justify-center w-12 h-full text-neutral-600 hover:text-black transition-colors"
          >
            <ShoppingBag className="w-4 h-4 text-neutral-800" />
            <span className="text-[10px] font-semibold mt-0.5 leading-none">Shop</span>
          </Link>

          {/* Chat button */}
          <button
            onClick={() => {
              window.dispatchEvent(
                new CustomEvent('open-ai-chat-with-product', {
                  detail: { productId: product.id, productName: product.name },
                })
              );
            }}
            className="flex flex-col items-center justify-center w-12 h-full text-neutral-600 hover:text-black transition-colors"
          >
            <MessageCircle className="w-4 h-4 text-neutral-700" />
            <span className="text-[10px] font-semibold mt-0.5 leading-none">Chat</span>
          </button>

          {/* Buttons: Add to Bag & Order Now */}
          <div className="flex-1 flex items-center gap-2">
            <button
              onClick={handleAddToCart}
              disabled={!isInStock || isAdding}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-all active:scale-95 shadow-xs ${
                added
                  ? 'bg-neutral-900 text-white'
                  : isInStock
                  ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-900 border border-neutral-300'
                  : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
              }`}
            >
              {added ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Added!
                </>
              ) : isAdding ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Adding...
                </>
              ) : !isInStock ? (
                'Out of Stock'
              ) : (
                <>Add to Bag</>
              )}
            </button>

            <button
              onClick={handleBuyNow}
              disabled={!isInStock || isAdding}
              className="flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-all active:scale-95 shadow-xs bg-black text-white hover:bg-neutral-900 disabled:bg-neutral-200 disabled:text-neutral-400 disabled:cursor-not-allowed"
            >
              <Zap className="w-3.5 h-3.5 fill-current" /> Order Now
            </button>
          </div>

        </div>
      </div>

      {/* ── MODAL 1: PRODUCT OPTIONS / VARIATION DRAWER ── */}
      {optionsDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs">
          <div
            className="w-full max-w-lg bg-white rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="relative w-16 h-16 rounded-lg border border-gray-200 overflow-hidden bg-gray-50 shrink-0">
                  <Image
                    src={currentImage}
                    alt="Variant preview"
                    fill
                    className="object-contain p-1"
                  />
                </div>
                <div>
                  <div className="text-xl font-extrabold text-[#f85606]">
                    ৳{sellingPrice.toLocaleString('en-IN')}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Stock: {stockQty} available
                  </div>
                  <div className="text-xs font-semibold text-gray-800">
                    Selected: {selectedOptionsSummary}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setOptionsDrawerOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dynamic Attributes */}
            {hasAttributes && (
              <div className="space-y-4 py-4 border-b border-gray-100">
                {parsedAttributes.map((attr) => (
                  <div key={attr.name}>
                    <div className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      {attr.name}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {attr.values?.map((val) => {
                        const isSelected = selectedAttrs[attr.name] === val;
                        return (
                          <button
                            key={val}
                            type="button"
                            onClick={() => handleAttrSelect(attr.name, val)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                              isSelected
                                ? 'bg-[#083b66] text-white border-[#083b66]'
                                : 'bg-gray-50 text-gray-800 border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            {val}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quantity */}
            <div className="flex items-center justify-between py-4 border-b border-gray-100">
              <span className="text-xs font-bold text-gray-700">Quantity</span>
              <div className="flex items-center border border-gray-200 rounded-lg">
                <button
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                  className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40"
                >
                  <Minus className="w-3.5 h-3.5 text-gray-600" />
                </button>
                <span className="w-8 text-center text-xs font-bold text-gray-800">
                  {quantity}
                </span>
                <button
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= stockQty}
                  className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40"
                >
                  <Plus className="w-3.5 h-3.5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 flex items-center gap-2.5">
              <button
                onClick={handleAddToCart}
                disabled={!isInStock || isAdding}
                className="flex-1 py-3 bg-[#0066cc] hover:bg-[#0052a3] text-white text-xs font-bold rounded-lg uppercase tracking-wider"
              >
                Add to Cart
              </button>
              <button
                onClick={handleBuyNow}
                disabled={!isInStock || isAdding}
                className="flex-1 py-3 bg-[#15803d] hover:bg-[#166534] text-white text-xs font-bold rounded-lg uppercase tracking-wider"
              >
                Buy Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: DELIVERY LOCATION PICKER ── */}
      {deliveryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs">
          <div
            className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900">Select Delivery Location</h3>
              <button onClick={() => setDeliveryModalOpen(false)} className="p-1 text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 py-4 text-xs">
              <p className="text-gray-500">
                Choose your division and delivery area to view shipping charges and delivery time:
              </p>

              <div className="space-y-2">
                {[
                  { div: 'Dhaka', city: 'Dhaka North', area: 'Banani Road No. 12 - 19', fee: 60 },
                  { div: 'Dhaka', city: 'Dhaka South', area: 'Dhanmondi, Road 27', fee: 60 },
                  { div: 'Dhaka', city: 'Uttara', area: 'Sector 3, Jashimuddin', fee: 60 },
                  { div: 'Chattogram', city: 'Chittagong City', area: 'GEC Circle, Nasirabad', fee: 120 },
                  { div: 'Sylhet', city: 'Sylhet Sadar', area: 'Zindabazar', fee: 120 },
                  { div: 'Rajshahi', city: 'Rajshahi City', area: 'Shaheb Bazar', fee: 120 },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleUpdateLocation(item.div, item.city, item.area, item.fee)}
                    className="p-3 border border-gray-200 rounded-lg hover:border-[#083b66] cursor-pointer flex items-center justify-between transition-colors bg-gray-50/50 hover:bg-blue-50/50"
                  >
                    <div>
                      <p className="font-bold text-gray-900">{item.area}</p>
                      <p className="text-[11px] text-gray-500">{item.city}, {item.div}</p>
                    </div>
                    <span className="font-bold text-[#083b66] text-xs">
                      ৳{item.fee}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 3: SERVICE DETAILS DRAWER ── */}
      {serviceDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs">
          <div
            className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900">Service & Returns Policy</h3>
              <button onClick={() => setServiceDrawerOpen(false)} className="p-1 text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 py-4 text-xs text-gray-700 leading-relaxed">
              <div className="flex items-start gap-2.5">
                <RotateCcw className="w-4 h-4 text-[#083b66] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-gray-900">14 Days Easy Return</h4>
                  <p className="text-gray-500 mt-0.5">
                    If your product is damaged, defective, or not as described, return it within 14 days for a replacement or full refund.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-neutral-900 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-neutral-900">100% Authentic Guarantee</h4>
                  <p className="text-neutral-500 mt-0.5">
                    Every garment is directly designed and quality verified by Vestro Wear House.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setServiceDrawerOpen(false)}
              className="w-full py-2.5 bg-neutral-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-lg"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* ── MODAL 4: CUSTOMER PHOTO LIGHTBOX ── */}
      {lightboxIndex !== null && reviewsList[0]?.images && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between p-4">
          <div className="flex items-center justify-between text-white">
            <span className="text-xs font-bold">
              Photo {lightboxIndex + 1} of {reviewsList[0].images.length}
            </span>
            <button
              onClick={() => setLightboxIndex(null)}
              className="p-2 text-white hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="relative flex-1 flex items-center justify-center my-4">
            <Image
              src={reviewsList[0].images[lightboxIndex]}
              alt="Customer photo review"
              fill
              className="object-contain"
            />
          </div>

          <div className="flex items-center justify-between text-white max-w-xs mx-auto w-full pb-2">
            <button
              onClick={() =>
                setLightboxIndex((prev) =>
                  prev > 0 ? prev - 1 : reviewsList[0].images.length - 1
                )
              }
              className="p-2 bg-white/20 rounded-full hover:bg-white/30"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-xs text-gray-300">
              {reviewsList[0].customer}
            </span>
            <button
              onClick={() =>
                setLightboxIndex((prev) =>
                  prev < reviewsList[0].images.length - 1 ? prev + 1 : 0
                )
              }
              className="p-2 bg-white/20 rounded-full hover:bg-white/30"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* ── MODAL 5: WRITE A REVIEW ── */}
      {writeReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs">
          <div
            className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900">Write a Customer Review</h3>
              <button onClick={() => setWriteReviewModalOpen(false)} className="p-1 text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddReview} className="space-y-3 py-4 text-xs">
              {reviewError && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs font-medium">
                  {reviewError}
                </div>
              )}
              <div>
                <label className="block font-bold text-gray-700 mb-1">Your Rating</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewReviewForm((prev) => ({ ...prev, rating: star }))}
                      className="p-1 text-amber-400"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= newReviewForm.rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-gray-200 fill-gray-200'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Your Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shakil Ahmed"
                  value={newReviewForm.name}
                  onChange={(e) => setNewReviewForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#083b66]"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Your Review</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Share your thoughts about this product..."
                  value={newReviewForm.comment}
                  onChange={(e) => setNewReviewForm((prev) => ({ ...prev, comment: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#083b66]"
                />
              </div>

              <button
                type="submit"
                disabled={reviewSubmitting}
                className="w-full py-2.5 bg-[#083b66] hover:bg-[#062d4d] text-white text-xs font-bold rounded-lg uppercase tracking-wider mt-2 cursor-pointer disabled:opacity-50"
              >
                {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 6: ASK A QUESTION ── */}
      {askQuestionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs">
          <div
            className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900">Ask Question About This Product</h3>
              <button onClick={() => setAskQuestionModalOpen(false)} className="p-1 text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddQuestion} className="space-y-3 py-4 text-xs">
              {questionError && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs font-medium">
                  {questionError}
                </div>
              )}
              <div>
                <label className="block font-bold text-gray-700 mb-1">Your Question</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Is there any warranty? What is the material?"
                  value={newQuestionText}
                  onChange={(e) => setNewQuestionText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#083b66]"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Your Name</label>
                <input
                  type="text"
                  placeholder="e.g. Russell"
                  value={newQuestionAuthor}
                  onChange={(e) => setNewQuestionAuthor(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#083b66]"
                />
              </div>

              <button
                type="submit"
                disabled={questionSubmitting}
                className="w-full py-2.5 bg-[#083b66] hover:bg-[#062d4d] text-white text-xs font-bold rounded-lg uppercase tracking-wider mt-2 cursor-pointer disabled:opacity-50"
              >
                {questionSubmitting ? 'Submitting...' : 'Submit Question'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 7: ALL REVIEWS ── */}
      {allReviewsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs">
          <div
            className="w-full max-w-lg bg-white rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900">All Ratings & Reviews ({reviewsList.length})</h3>
              <button onClick={() => setAllReviewsModalOpen(false)} className="p-1 text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="divide-y divide-gray-100 py-2">
              {reviewsList.map((rev) => (
                <div key={rev.id} className="py-3 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-800">{rev.customer || rev.customer_name}</span>
                    <div className="flex text-amber-400">
                      {[...Array(Number(rev.rating) || 5)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-700">{rev.comment}</p>
                  {rev.admin_reply && (
                    <div className="pl-3 py-1.5 bg-slate-50 border-l-2 border-[#083b66] rounded-r text-[11px]">
                      <span className="font-bold text-[#083b66]">Seller Reply: </span>
                      <span className="text-gray-600">{rev.admin_reply}</span>
                    </div>
                  )}
                  <p className="text-[10px] text-gray-400">{rev.date}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 8: BUY NOW OPTION (WHATSAPP & DIRECT ORDER) ── */}
      <BuyNowModal
        isOpen={buyNowModalOpen}
        onClose={() => setBuyNowModalOpen(false)}
        product={product}
        quantity={quantity}
        variant={
          activeVariant || Object.keys(selectedAttrs).length > 0
            ? {
                sku: activeVariant?.sku || displaySku,
                title: activeVariant?.title || activeVariant?.name,
                selectedAttributes: selectedAttrs,
                price: sellingPrice,
                image: activeVariant?.images?.[0] || null,
              }
            : null
        }
        onDirectOrder={handleDirectOrder}
      />

    </div>
  );
}
