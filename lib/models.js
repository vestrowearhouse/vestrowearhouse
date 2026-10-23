/**
 * Mongoose Models for MongoDB Atlas
 * 
 * Collections:
 * - Reviews (product reviews with Cloudinary media)
 * - Questions (product Q&A with vendor/admin replies)
 * - ActivityLog (admin action logs)
 * - PageLog (page view / analytics logs)
 * - WebsiteLog (server error / request logs)
 */
import mongoose from 'mongoose';

// ─── Reply Sub-Schema ───────────────────────────────────────────────────────
const ReplySchema = new mongoose.Schema({
  body: { type: String, required: true },
  author: { type: String, default: 'Shop' },     // display name
  role: { type: String, enum: ['admin', 'vendor', 'user'], default: 'vendor' },
  authorId: { type: String },                     // uid / vendor_id / user_id
  createdAt: { type: Date, default: Date.now },
}, { _id: true });

// ─── Media Sub-Schema (Cloudinary) ─────────────────────────────────────────
const MediaSchema = new mongoose.Schema({
  url: { type: String, required: true },          // Cloudinary secure_url
  publicId: { type: String },                     // Cloudinary public_id (for deletion)
  type: { type: String, enum: ['image', 'video'], default: 'image' },
  thumbnail: { type: String },                    // video thumbnail
}, { _id: false });

// ─── Product Review Schema ──────────────────────────────────────────────────
const ReviewSchema = new mongoose.Schema({
  productId: { type: String, required: true, index: true },    // Supabase products.id
  productSlug: { type: String, index: true },
  shopId: { type: String, index: true },           // vendor/shop ID for vendor replies

  // Reviewer
  userId: { type: String, index: true },
  userName: { type: String, required: true },
  userEmail: { type: String },
  userAvatar: { type: String },

  // Review Content
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String, maxlength: 200 },
  body: { type: String, maxlength: 5000 },

  // Media (Cloudinary)
  media: [MediaSchema],

  // Status & Moderation
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    index: true,
  },
  flagged: { type: Boolean, default: false },
  flagReason: { type: String },

  // Replies (admin + vendor)
  replies: [ReplySchema],

  // Helpful votes
  helpfulCount: { type: Number, default: 0 },
  helpfulVoters: [{ type: String }],              // userIds who voted helpful

  // Purchase verification
  verifiedPurchase: { type: Boolean, default: false },
  orderId: { type: String },

}, {
  timestamps: true,
  collection: 'reviews',
});

// Compound index for listing reviews by product, sorted by date
ReviewSchema.index({ productId: 1, status: 1, createdAt: -1 });
ReviewSchema.index({ shopId: 1, status: 1, createdAt: -1 });

// ─── Product Question Schema ────────────────────────────────────────────────
const QuestionSchema = new mongoose.Schema({
  productId: { type: String, required: true, index: true },
  productSlug: { type: String, index: true },
  shopId: { type: String, index: true },

  // Asker
  userId: { type: String, index: true },
  userName: { type: String, required: true },
  userEmail: { type: String },
  userAvatar: { type: String },

  // Question
  question: { type: String, required: true, maxlength: 2000 },

  // Status
  status: {
    type: String,
    enum: ['pending', 'answered', 'rejected'],
    default: 'pending',
    index: true,
  },

  // Replies (vendor, admin, community)
  replies: [ReplySchema],

  // Media attachments
  media: [MediaSchema],

  // Helpful votes
  helpfulCount: { type: Number, default: 0 },
  helpfulVoters: [{ type: String }],

}, {
  timestamps: true,
  collection: 'questions',
});

QuestionSchema.index({ productId: 1, status: 1, createdAt: -1 });
QuestionSchema.index({ shopId: 1, status: 1, createdAt: -1 });

// ─── Activity Log Schema ────────────────────────────────────────────────────
const ActivityLogSchema = new mongoose.Schema({
  actorId: { type: String, index: true },
  actorEmail: { type: String },
  actorRole: { type: String, enum: ['admin', 'vendor', 'user', 'system'] },
  action: { type: String, required: true },       // e.g., 'review.approved'
  resource: { type: String },                     // e.g., 'review', 'product'
  resourceId: { type: String },
  details: { type: mongoose.Schema.Types.Mixed }, // flexible extra data
  ip: { type: String },
  userAgent: { type: String },
  level: { type: String, enum: ['info', 'warn', 'error'], default: 'info' },
}, {
  timestamps: true,
  collection: 'activity_logs',
});

ActivityLogSchema.index({ actorId: 1, createdAt: -1 });
ActivityLogSchema.index({ action: 1, createdAt: -1 });
ActivityLogSchema.index({ createdAt: -1 });

// ─── Page Log Schema ────────────────────────────────────────────────────────
const PageLogSchema = new mongoose.Schema({
  path: { type: String, required: true, index: true },
  referrer: { type: String },
  userId: { type: String },
  sessionId: { type: String },
  ip: { type: String },
  country: { type: String },
  device: { type: String },
  browser: { type: String },
  os: { type: String },
  duration: { type: Number },                    // ms on page
  exitPage: { type: Boolean, default: false },
}, {
  timestamps: true,
  collection: 'page_logs',
});

PageLogSchema.index({ path: 1, createdAt: -1 });
PageLogSchema.index({ createdAt: -1 });

// ─── Website / Error Log Schema ─────────────────────────────────────────────
const WebsiteLogSchema = new mongoose.Schema({
  level: { type: String, enum: ['info', 'warn', 'error', 'debug'], default: 'info' },
  message: { type: String, required: true },
  source: { type: String },                      // e.g., API route path
  stack: { type: String },                       // error stack trace
  requestId: { type: String },
  userId: { type: String },
  meta: { type: mongoose.Schema.Types.Mixed },
}, {
  timestamps: true,
  collection: 'website_logs',
});

WebsiteLogSchema.index({ level: 1, createdAt: -1 });
WebsiteLogSchema.index({ createdAt: -1 });
// Auto-expire logs after 90 days
WebsiteLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

// ─── Export Models (with Next.js hot-reload guard) ──────────────────────────
export const Review = mongoose.models.Review || mongoose.model('Review', ReviewSchema);
export const Question = mongoose.models.Question || mongoose.model('Question', QuestionSchema);
export const ActivityLog = mongoose.models.ActivityLog || mongoose.model('ActivityLog', ActivityLogSchema);
export const PageLog = mongoose.models.PageLog || mongoose.model('PageLog', PageLogSchema);
export const WebsiteLog = mongoose.models.WebsiteLog || mongoose.model('WebsiteLog', WebsiteLogSchema);
