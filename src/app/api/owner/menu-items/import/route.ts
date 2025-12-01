import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import dbConnect from '@/lib/mongodb';
import MenuItem from '@/models/MenuItem';
import Category from '@/models/Category';
import Restaurant from '@/models/Restaurant';
import Subscription from '@/models/Subscription';
import { getUserFromRequest } from '@/lib/auth';
import { resolveEffectiveOwnerId } from '@/lib/ownership';
import { uploadImage } from '@/lib/cloudinary';

export const dynamic = 'force-dynamic';

type CsvRow = Record<string, string>;

function parseCsv(text: string): CsvRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length === 0) return [];

  const parseLine = (line: string): string[] => {
    const out: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        out.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    out.push(current.trim());
    return out;
  };

  const header = parseLine(lines[0]).map((h) => h.trim().toLowerCase());
  const rows: CsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseLine(lines[i]);
    if (cols.every((c) => !c)) continue;
    const row: CsvRow = {};
    header.forEach((h, idx) => {
      row[h] = (cols[idx] ?? '').trim();
    });
    rows.push(row);
  }
  return rows;
}

function normalizeKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function parseBoolean(value?: string): boolean | undefined {
  if (!value) return undefined;
  const v = value.trim().toLowerCase();
  if (!v) return undefined;
  if (['1', 'true', 'yes', 'y'].includes(v)) return true;
  if (['0', 'false', 'no', 'n'].includes(v)) return false;
  return undefined;
}

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');
    if (!restaurantId) {
      return NextResponse.json({ error: 'Restaurant ID is required' }, { status: 400 });
    }

    const ownerId = await resolveEffectiveOwnerId(user);
    if (!ownerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sub = await Subscription.findOne({ ownerId });
    if (!sub || (sub.status !== 'active' && sub.status !== 'trialing')) {
      return NextResponse.json({ error: 'Subscription required' }, { status: 402 });
    }

    const restaurant = await Restaurant.findOne({ _id: restaurantId, ownerId });
    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    const formData = await request.formData();
    const csvFile = formData.get('csv') as File | null;
    const zipFile = formData.get('imagesZip') as File | null;

    if (!csvFile) {
      return NextResponse.json(
        { error: 'CSV file is required (field name: csv)' },
        { status: 400 }
      );
    }

    const csvText = await csvFile.text();
    const rows = parseCsv(csvText);
    if (!rows.length) {
      return NextResponse.json({ error: 'CSV file has no data rows' }, { status: 400 });
    }

    const categories = await Category.find({ restaurantId }).lean();
    const categoriesByName = new Map<string, any>();
    let maxCategoryOrder = 0;
    for (const cat of categories) {
      categoriesByName.set(String(cat.name).toLowerCase(), cat);
      if (typeof (cat as any).order === 'number') {
        maxCategoryOrder = Math.max(maxCategoryOrder, (cat as any).order);
      }
    }

    const existingItems = await MenuItem.find({ restaurantId }).select('categoryId order').lean();
    const nextOrderByCategory: Record<string, number> = {};
    for (const item of existingItems) {
      const key = String(item.categoryId);
      const current = nextOrderByCategory[key] ?? 0;
      const order = typeof (item as any).order === 'number' ? (item as any).order + 1 : current;
      nextOrderByCategory[key] = Math.max(current, order);
    }

    let zip: JSZip | null = null;
    const zipEntriesByKey = new Map<string, JSZip.JSZipObject>();
    if (zipFile) {
      const zipBuffer = Buffer.from(await zipFile.arrayBuffer());
      zip = await JSZip.loadAsync(zipBuffer);
      zip.forEach((relativePath: string, entry: JSZip.JSZipObject) => {
        if (entry.dir) return;
        const base = relativePath.split('/').pop() || relativePath;
        const lowerBase = base.toLowerCase();
        const noExt = lowerBase.replace(/\.[a-z0-9]+$/i, '');
        zipEntriesByKey.set(lowerBase, entry);
        zipEntriesByKey.set(noExt, entry);
        zipEntriesByKey.set(normalizeKey(noExt), entry);
      });
    }

    const errors: string[] = [];
    const missingImages: string[] = [];
    let createdCount = 0;

    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      const lineNumber = index + 2;

      const name = row['name']?.trim();
      if (!name) {
        errors.push(`Row ${lineNumber}: Missing required 'name'`);
        continue;
      }

      const categoryName = (row['category'] || row['categoryname'] || 'Uncategorized').trim();
      const categoryKey = categoryName.toLowerCase();
      let category = categoriesByName.get(categoryKey);
      if (!category) {
        maxCategoryOrder += 1;
        category = await Category.create({
          restaurantId,
          name: categoryName,
          order: maxCategoryOrder,
        });
        categoriesByName.set(categoryKey, category);
      }

      const priceField = row['price'] || row['price_rupees'] || row['price_rupee'];
      const priceValue = priceField ? parseFloat(priceField) : NaN;
      if (!Number.isFinite(priceValue) || priceValue < 0) {
        errors.push(`Row ${lineNumber} ('${name}'): Invalid price '${priceField}'`);
        continue;
      }
      const priceCents = Math.round(priceValue * 100);

      const description = row['description']?.trim() || undefined;
      const orderable = parseBoolean(row['orderable']);
      const soldOut = parseBoolean(row['soldout']);

      let imageUrl: string | undefined;
      const imageRef = (row['image'] || row['imagefile'] || '').trim();
      if (zip && zipEntriesByKey.size) {
        const candidates: string[] = [];
        if (imageRef) {
          const lower = imageRef.toLowerCase();
          const noExt = lower.replace(/\.[a-z0-9]+$/i, '');
          candidates.push(lower, noExt, normalizeKey(noExt));
        }
        const normalizedName = normalizeKey(name);
        candidates.push(normalizedName);

        let entry: JSZip.JSZipObject | undefined;
        for (const key of candidates) {
          if (zipEntriesByKey.has(key)) {
            entry = zipEntriesByKey.get(key);
            break;
          }
        }

        if (entry) {
          try {
            const buffer = await entry.async('nodebuffer');
            const uploaded = await uploadImage(buffer, 'qr-menu/menu-items');
            imageUrl = uploaded.url;
          } catch (e: any) {
            errors.push(
              `Row ${lineNumber} ('${name}'): Failed to upload image from ZIP (${e.message || 'unknown error'})`
            );
          }
        } else if (imageRef) {
          missingImages.push(imageRef);
        }
      }

      const catId = String((category as any)._id);
      const currentOrder = nextOrderByCategory[catId] ?? 0;
      const nextOrder = currentOrder;
      nextOrderByCategory[catId] = currentOrder + 1;

      try {
        await MenuItem.create({
          restaurantId,
          categoryId: (category as any)._id,
          name,
          description,
          priceCents,
          images: imageUrl ? [imageUrl] : [],
          orderable: orderable ?? true,
          soldOut: soldOut ?? false,
          modifiers: [],
          order: nextOrder,
        });
        createdCount += 1;
      } catch (e: any) {
        errors.push(
          `Row ${lineNumber} ('${name}'): Failed to create item (${e.message || 'unknown error'})`
        );
      }
    }

    return NextResponse.json({
      success: true,
      createdCount,
      totalRows: rows.length,
      errors,
      missingImages,
    });
  } catch (error: any) {
    console.error('Bulk menu import error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
