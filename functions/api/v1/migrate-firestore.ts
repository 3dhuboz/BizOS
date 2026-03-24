/**
 * One-time Firestore → D1 migration endpoint.
 * Reads all collections from the old Firebase project and inserts into D1.
 *
 * POST /api/v1/migrate-firestore
 * Body: { "apiKey": "AIza..." } (optional — needed if Firestore rules require auth)
 *
 * This endpoint is idempotent (uses INSERT OR REPLACE).
 */
import { getDB } from './_lib/db';
import { verifyAuth, requireAuth } from './_lib/auth';

const FIREBASE_PROJECT_ID = 'bizos';
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;

// --- Firestore REST value parsers ---
function fromFirestoreValue(field: any): any {
  if (!field || typeof field !== 'object') return null;
  if ('nullValue' in field) return null;
  if ('booleanValue' in field) return field.booleanValue;
  if ('integerValue' in field) return Number(field.integerValue);
  if ('doubleValue' in field) return field.doubleValue;
  if ('stringValue' in field) return field.stringValue;
  if ('timestampValue' in field) return field.timestampValue;
  if ('arrayValue' in field) return (field.arrayValue.values || []).map(fromFirestoreValue);
  if ('mapValue' in field) return fromFirestoreFields(field.mapValue.fields || {});
  return null;
}

function fromFirestoreFields(fields: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(fields)) {
    result[key] = fromFirestoreValue(value);
  }
  return result;
}

// --- Fetch all docs from a Firestore collection ---
async function listCollection(collection: string, apiKey?: string): Promise<{ id: string; data: Record<string, any> }[]> {
  const docs: { id: string; data: Record<string, any> }[] = [];
  let pageToken = '';

  do {
    let url = `${FIRESTORE_BASE}/${collection}?pageSize=300`;
    if (pageToken) url += `&pageToken=${pageToken}`;
    if (apiKey) url += `&key=${apiKey}`;

    const res = await fetch(url);
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Firestore ${collection} fetch failed (${res.status}): ${err.slice(0, 300)}`);
    }

    const data = await res.json();
    if (data.documents) {
      for (const doc of data.documents) {
        const docPath = doc.name as string;
        const id = docPath.split('/').pop()!;
        const fields = fromFirestoreFields(doc.fields || {});
        docs.push({ id, data: fields });
      }
    }
    pageToken = data.nextPageToken || '';
  } while (pageToken);

  return docs;
}

// --- Fetch a single Firestore document ---
async function getDocument(path: string, apiKey?: string): Promise<Record<string, any> | null> {
  let url = `${FIRESTORE_BASE}/${path}`;
  if (apiKey) url += `?key=${apiKey}`;

  const res = await fetch(url);
  if (!res.ok) return null;

  const doc = await res.json();
  return fromFirestoreFields(doc.fields || {});
}

export const onRequest = async (context: any) => {
  const { request, env } = context;
  const json = (d: any, s = 200) => new Response(JSON.stringify(d, null, 2), { status: s, headers: { 'Content-Type': 'application/json' } });

  try {
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

    // Require admin auth
    const auth = await verifyAuth(request, env);
    requireAuth(auth, 'ADMIN');

    const body = await request.json().catch(() => ({}));
    const apiKey = body.apiKey || env.FIREBASE_API_KEY || '';

    const db = getDB(env);
    const results: Record<string, any> = {};

    // 1. Migrate Settings (single document: settings/general)
    try {
      const settings = await getDocument('settings/general', apiKey);
      if (settings) {
        await db.prepare("INSERT OR REPLACE INTO settings (key, data) VALUES ('general', ?)")
          .bind(JSON.stringify(settings)).run();
        results.settings = 'Migrated settings/general';
      } else {
        results.settings = 'No settings document found';
      }
    } catch (e: any) {
      results.settings = `Error: ${e.message}`;
    }

    // 2. Migrate Menu Items
    try {
      const menuDocs = await listCollection('menu', apiKey);
      let count = 0;
      for (const { id, data: item } of menuDocs) {
        await db.prepare(
          `INSERT OR REPLACE INTO menu_items (id, name, description, price, unit, min_quantity, preparation_options, image, category, available, availability_type, specific_date, specific_dates, is_pack, pack_groups, available_for_catering, catering_category, moq) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          id,
          item.name || '',
          item.description || null,
          item.price || 0,
          item.unit || null,
          item.minQuantity || item.min_quantity || null,
          item.preparationOptions ? JSON.stringify(item.preparationOptions) : (item.preparation_options ? JSON.stringify(item.preparation_options) : null),
          item.image || null,
          item.category || 'Uncategorized',
          item.available !== undefined ? (item.available ? 1 : 0) : 1,
          item.availabilityType || item.availability_type || 'everyday',
          item.specificDate || item.specific_date || null,
          item.specificDates ? JSON.stringify(item.specificDates) : (item.specific_dates || null),
          item.isPack || item.is_pack ? 1 : 0,
          item.packGroups ? JSON.stringify(item.packGroups) : (item.pack_groups || null),
          item.availableForCatering || item.available_for_catering ? 1 : 0,
          item.cateringCategory || item.catering_category || null,
          item.moq || null,
        ).run();
        count++;
      }
      results.menu = `Migrated ${count} menu items`;
    } catch (e: any) {
      results.menu = `Error: ${e.message}`;
    }

    // 3. Migrate Orders
    try {
      const orderDocs = await listCollection('orders', apiKey);
      let count = 0;
      for (const { id, data: order } of orderDocs) {
        await db.prepare(
          `INSERT OR REPLACE INTO orders (id, user_id, customer_name, customer_email, customer_phone, items, total, deposit_amount, status, cook_day, type, pickup_time, created_at, temperature, fulfillment_method, delivery_address, delivery_fee, tracking_number, courier, collection_pin, pickup_location, discount_applied, payment_intent_id, square_checkout_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          id,
          order.userId || order.user_id || null,
          order.customerName || order.customer_name || 'Unknown',
          order.customerEmail || order.customer_email || null,
          order.customerPhone || order.customer_phone || null,
          typeof order.items === 'string' ? order.items : JSON.stringify(order.items || []),
          order.total || 0,
          order.depositAmount || order.deposit_amount || null,
          order.status || 'Pending',
          order.cookDay || order.cook_day || '',
          order.type || 'pickup',
          order.pickupTime || order.pickup_time || null,
          order.createdAt || order.created_at || new Date().toISOString(),
          order.temperature || null,
          order.fulfillmentMethod || order.fulfillment_method || null,
          order.deliveryAddress || order.delivery_address || null,
          order.deliveryFee || order.delivery_fee || null,
          order.trackingNumber || order.tracking_number || null,
          order.courier || null,
          order.collectionPin || order.collection_pin || null,
          order.pickupLocation || order.pickup_location || null,
          order.discountApplied || order.discount_applied ? 1 : 0,
          order.paymentIntentId || order.payment_intent_id || null,
          order.squareCheckoutId || order.square_checkout_id || null,
        ).run();
        count++;
      }
      results.orders = `Migrated ${count} orders`;
    } catch (e: any) {
      results.orders = `Error: ${e.message}`;
    }

    // 4. Migrate Users
    try {
      const userDocs = await listCollection('users', apiKey);
      let count = 0;
      for (const { id, data: user } of userDocs) {
        await db.prepare(
          `INSERT OR REPLACE INTO users (id, name, email, role, is_verified, phone, address, dietary_preferences, stamps, has_catering_discount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          id,
          user.name || user.displayName || 'Unknown',
          user.email || '',
          user.role || 'CUSTOMER',
          user.isVerified || user.is_verified ? 1 : 0,
          user.phone || null,
          user.address || null,
          user.dietaryPreferences || user.dietary_preferences || null,
          user.stamps || 0,
          user.hasCateringDiscount || user.has_catering_discount ? 1 : 0,
        ).run();
        count++;
      }
      results.users = `Migrated ${count} users`;
    } catch (e: any) {
      results.users = `Error: ${e.message}`;
    }

    // 5. Migrate Calendar Events
    try {
      const eventDocs = await listCollection('events', apiKey);
      let count = 0;
      for (const { id, data: evt } of eventDocs) {
        await db.prepare(
          `INSERT OR REPLACE INTO calendar_events (id, date, type, title, description, location, time, start_time, end_time, order_id, image, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          id,
          evt.date || '',
          evt.type || 'EVENT',
          evt.title || 'Untitled',
          evt.description || null,
          evt.location || null,
          evt.time || null,
          evt.startTime || evt.start_time || null,
          evt.endTime || evt.end_time || null,
          evt.orderId || evt.order_id || null,
          evt.image || null,
          evt.tags ? (typeof evt.tags === 'string' ? evt.tags : JSON.stringify(evt.tags)) : null,
        ).run();
        count++;
      }
      results.events = `Migrated ${count} calendar events`;
    } catch (e: any) {
      results.events = `Error: ${e.message}`;
    }

    // 6. Migrate Social Posts
    try {
      const socialDocs = await listCollection('social_posts', apiKey);
      let count = 0;
      for (const { id, data: post } of socialDocs) {
        await db.prepare(
          `INSERT OR REPLACE INTO social_posts (id, platform, content, image, scheduled_for, status, hashtags, published_at, platform_post_id, publish_error) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          id,
          post.platform || 'Instagram',
          post.content || '',
          post.image || null,
          post.scheduledFor || post.scheduled_for || new Date().toISOString(),
          post.status || 'Draft',
          post.hashtags ? (typeof post.hashtags === 'string' ? post.hashtags : JSON.stringify(post.hashtags)) : null,
          post.publishedAt || post.published_at || null,
          post.platformPostId || post.platform_post_id || null,
          post.publishError || post.publish_error || null,
        ).run();
        count++;
      }
      results.socialPosts = `Migrated ${count} social posts`;
    } catch (e: any) {
      results.socialPosts = `Error: ${e.message}`;
    }

    // 7. Migrate Gallery Posts
    try {
      const galleryDocs = await listCollection('gallery_posts', apiKey);
      let count = 0;
      for (const { id, data: post } of galleryDocs) {
        await db.prepare(
          `INSERT OR REPLACE INTO gallery_posts (id, user_id, user_name, image_url, caption, created_at, approved, likes, liked_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          id,
          post.userId || post.user_id || 'unknown',
          post.userName || post.user_name || 'Unknown',
          post.imageUrl || post.image_url || post.image || '',
          post.caption || null,
          post.createdAt || post.created_at || new Date().toISOString(),
          post.approved ? 1 : 0,
          post.likes || 0,
          post.likedBy ? (typeof post.likedBy === 'string' ? post.likedBy : JSON.stringify(post.likedBy)) : null,
        ).run();
        count++;
      }
      results.galleryPosts = `Migrated ${count} gallery posts`;
    } catch (e: any) {
      results.galleryPosts = `Error: ${e.message}`;
    }

    return json({
      success: true,
      message: 'Firestore → D1 migration complete',
      results,
    });

  } catch (err: any) {
    const status = err.status || 500;
    return json({ error: err.message || 'Internal Server Error' }, status);
  }
};
