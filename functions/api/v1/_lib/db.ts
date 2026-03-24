/**
 * D1 database helpers for Cloudflare Pages Functions.
 * Provides typed query helpers and JSON serialization for complex fields.
 */

export function getDB(env: any): D1Database {
  if (!env.DB) throw new Error('D1 database binding "DB" not configured');
  return env.DB;
}

export function generateId(): string {
  return crypto.randomUUID();
}

/** Parse JSON text column, return fallback on error */
export function parseJson<T>(val: string | null | undefined, fallback: T): T {
  if (!val) return fallback;
  try { return JSON.parse(val); } catch { return fallback; }
}

/** Convert D1 row (snake_case, integers for bools) to app types (camelCase, booleans) */
export function rowToMenuItem(r: any) {
  return {
    id: r.id,
    name: r.name,
    description: r.description || '',
    price: r.price,
    unit: r.unit,
    minQuantity: r.min_quantity,
    preparationOptions: parseJson(r.preparation_options, undefined),
    image: r.image || '',
    category: r.category,
    available: !!r.available,
    availabilityType: r.availability_type || 'everyday',
    specificDate: r.specific_date,
    specificDates: parseJson(r.specific_dates, undefined),
    isPack: !!r.is_pack,
    packGroups: parseJson(r.pack_groups, undefined),
    availableForCatering: !!r.available_for_catering,
    cateringCategory: r.catering_category,
    moq: r.moq,
  };
}

export function rowToOrder(r: any) {
  return {
    id: r.id,
    userId: r.user_id,
    customerName: r.customer_name,
    customerEmail: r.customer_email,
    customerPhone: r.customer_phone,
    items: parseJson(r.items, []),
    total: r.total,
    depositAmount: r.deposit_amount,
    status: r.status,
    cookDay: r.cook_day,
    type: r.type,
    pickupTime: r.pickup_time,
    createdAt: r.created_at,
    temperature: r.temperature,
    fulfillmentMethod: r.fulfillment_method,
    deliveryAddress: r.delivery_address,
    deliveryFee: r.delivery_fee,
    trackingNumber: r.tracking_number,
    courier: r.courier,
    collectionPin: r.collection_pin,
    pickupLocation: r.pickup_location,
    discountApplied: !!r.discount_applied,
    paymentIntentId: r.payment_intent_id,
    squareCheckoutId: r.square_checkout_id,
  };
}

export function rowToEvent(r: any) {
  return {
    id: r.id,
    date: r.date,
    type: r.type,
    title: r.title,
    description: r.description,
    location: r.location,
    time: r.time,
    startTime: r.start_time,
    endTime: r.end_time,
    orderId: r.order_id,
    image: r.image,
    tags: parseJson(r.tags, undefined),
  };
}

export function rowToUser(r: any) {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    role: r.role,
    isVerified: !!r.is_verified,
    phone: r.phone,
    address: r.address,
    dietaryPreferences: r.dietary_preferences,
    stamps: r.stamps || 0,
    hasCateringDiscount: !!r.has_catering_discount,
    tags: parseJson(r.tags, undefined),
    notificationPrefs: parseJson(r.notification_prefs, undefined),
    lifetimeValue: r.lifetime_value || 0,
    lastOrderDate: r.last_order_date,
    tier: r.tier || 'bronze',
  };
}

export function rowToSocialPost(r: any) {
  return {
    id: r.id,
    platform: r.platform,
    content: r.content,
    image: r.image,
    scheduledFor: r.scheduled_for,
    status: r.status,
    hashtags: parseJson(r.hashtags, []),
    publishedAt: r.published_at,
    platformPostId: r.platform_post_id,
    publishError: r.publish_error,
  };
}

export function rowToGalleryPost(r: any) {
  return {
    id: r.id,
    userId: r.user_id,
    userName: r.user_name,
    imageUrl: r.image_url,
    caption: r.caption || '',
    createdAt: r.created_at,
    approved: !!r.approved,
    likes: r.likes || 0,
    likedBy: parseJson(r.liked_by, []),
  };
}

export function rowToCustomerNote(r: any) {
  return {
    id: r.id,
    userId: r.user_id,
    note: r.note,
    createdBy: r.created_by,
    createdAt: r.created_at,
  };
}

export function rowToBooking(r: any) {
  return {
    id: r.id,
    customerName: r.customer_name,
    customerEmail: r.customer_email,
    customerPhone: r.customer_phone,
    eventDate: r.event_date,
    serviceType: r.service_type,
    guestCount: r.guest_count,
    packageId: r.package_id,
    packageName: r.package_name,
    estimatedTotal: r.estimated_total,
    depositAmount: r.deposit_amount,
    depositPaid: !!r.deposit_paid,
    balanceDue: r.balance_due || 0,
    status: r.status,
    notes: r.notes,
    createdAt: r.created_at,
    squareCheckoutId: r.square_checkout_id,
    orderId: r.order_id,
  };
}

export function rowToSharedPlan(r: any) {
  return {
    id: r.id,
    hostName: r.host_name,
    hostEmail: r.host_email,
    title: r.title,
    eventDate: r.event_date,
    packageId: r.package_id,
    selectedItems: parseJson(r.selected_items, []),
    status: r.status,
    createdAt: r.created_at,
    expiresAt: r.expires_at,
  };
}

export function rowToSharedPlanResponse(r: any) {
  return {
    id: r.id,
    sharedPlanId: r.shared_plan_id,
    respondentName: r.respondent_name,
    respondentEmail: r.respondent_email,
    dietaryPreferences: r.dietary_preferences,
    headcount: r.headcount || 1,
    itemVotes: parseJson(r.item_votes, {}),
    notes: r.notes,
    createdAt: r.created_at,
  };
}

export function rowToContract(r: any) {
  return {
    id: r.id,
    orderId: r.order_id,
    bookingId: r.booking_id,
    customerName: r.customer_name,
    customerEmail: r.customer_email,
    termsText: r.terms_text,
    signed: !!r.signed,
    signedAt: r.signed_at,
    signatureData: r.signature_data,
    createdAt: r.created_at,
  };
}

export function rowToPaymentReminder(r: any) {
  return {
    id: r.id,
    bookingId: r.booking_id,
    orderId: r.order_id,
    type: r.type,
    scheduledFor: r.scheduled_for,
    sent: !!r.sent,
    sentAt: r.sent_at,
    createdAt: r.created_at,
  };
}

// ─── Multi-Tenant Helpers ────────────────────────────────────

/** Extract tenant ID from request context (set by middleware) */
export function getTenantId(context: any): string {
  return context.tenantId || 'default';
}

export function rowToTenant(r: any) {
  return {
    id: r.id,
    businessName: r.business_name,
    businessType: r.business_type,
    ownerEmail: r.owner_email,
    adminUsername: r.admin_username,
    status: r.status,
    subscriptionTier: r.subscription_tier,
    customDomain: r.custom_domain,
    settingsJson: r.settings_json,
    createdAt: r.created_at,
    lastActiveAt: r.last_active_at,
  };
}

export function rowToAuditEntry(r: any) {
  return {
    id: r.id,
    tenantId: r.tenant_id,
    action: r.action,
    performedBy: r.performed_by,
    details: r.details,
    createdAt: r.created_at,
  };
}
