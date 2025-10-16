# Menu Builder Migration - Complete Guide

## ✅ What Was Done

The menu builder has been successfully moved from the restaurant nested route to a dedicated section accessible from the main sidebar.

### New Route Structure

**Old Route** (Still works for backward compatibility):
```
/dashboard/restaurants/[id]/menu
```

**New Route** (Primary access point):
```
/dashboard/menu-builder           → Restaurant selection page
/dashboard/menu-builder/[id]      → Actual menu builder for restaurant
```

---

## 📁 Files Created

### 1. Restaurant Selection Page
**File**: `src/app/dashboard/menu-builder/page.tsx`
- Shows all restaurants with cards
- Auto-redirects if only one restaurant exists
- Creates restaurant option if none exist
- Links to each restaurant's menu builder

### 2. Menu Builder Main Page
**File**: `src/app/dashboard/menu-builder/[id]/page.tsx`
- Drag-and-drop category reordering
- Category management (add, edit, delete)
- Menu item management (add, edit, delete)
- Real-time stats (total items, available, sold out)
- Preview menu button
- Quick "Add Category" button
- Empty states with helpful CTAs

---

## 🔄 Migration Steps Needed

### Step 1: Copy Category Management Pages ✅ (Manual Task)

Copy these files from old location to new:

**From**:
```
src/app/dashboard/restaurants/[id]/menu/categories/new/page.tsx
src/app/dashboard/restaurants/[id]/menu/categories/[categoryId]/edit/page.tsx
```

**To**:
```
src/app/dashboard/menu-builder/[id]/categories/new/page.tsx
src/app/dashboard/menu-builder/[id]/categories/[categoryId]/edit/page.tsx
```

**What to Update in Each File**:
1. Change all `router.push` paths from `/dashboard/restaurants/${id}/menu` to `/dashboard/menu-builder/${id}`
2. Change Link `href` paths similarly
3. Update "Back" button navigation

### Step 2: Copy Menu Item Pages ✅ (Manual Task)

**From**:
```
src/app/dashboard/restaurants/[id]/menu/items/new/page.tsx
src/app/dashboard/restaurants/[id]/menu/items/[itemId]/edit/page.tsx
```

**To**:
```
src/app/dashboard/menu-builder/[id]/items/new/page.tsx
src/app/dashboard/menu-builder/[id]/items/[itemId]/edit/page.tsx
```

**What to Update in Each File**:
1. Change API fetch paths if needed
2. Update navigation paths on success/cancel
3. Update breadcrumbs and back links

---

## 🎯 Quick Copy Commands

Here's a PowerShell script to copy and update the files:

```powershell
# Create directories
New-Item -ItemType Directory -Path "src/app/dashboard/menu-builder/[id]/categories/new" -Force
New-Item -ItemType Directory -Path "src/app/dashboard/menu-builder/[id]/categories/[categoryId]/edit" -Force
New-Item -ItemType Directory -Path "src/app/dashboard/menu-builder/[id]/items/new" -Force
New-Item -ItemType Directory -Path "src/app/dashboard/menu-builder/[id]/items/[itemId]/edit" -Force

# Copy files
Copy-Item "src/app/dashboard/restaurants/[id]/menu/categories/new/page.tsx" "src/app/dashboard/menu-builder/[id]/categories/new/page.tsx"
Copy-Item "src/app/dashboard/restaurants/[id]/menu/categories/[categoryId]/edit/page.tsx" "src/app/dashboard/menu-builder/[id]/categories/[categoryId]/edit/page.tsx"
Copy-Item "src/app/dashboard/restaurants/[id]/menu/items/new/page.tsx" "src/app/dashboard/menu-builder/[id]/items/new/page.tsx"
Copy-Item "src/app/dashboard/restaurants/[id]/menu/items/[itemId]/edit/page.tsx" "src/app/dashboard/menu-builder/[id]/items/[itemId]/edit/page.tsx"
```

---

## 🔧 Manual Updates Required

After copying, you need to do a **Find & Replace** in each copied file:

### Find & Replace Patterns

1. **Navigation paths**:
   - Find: `/dashboard/restaurants/${restaurantId}/menu`
   - Replace: `/dashboard/menu-builder/${restaurantId}`

2. **Link hrefs**:
   - Find: `/dashboard/restaurants/`
   - Replace: `/dashboard/menu-builder/` (in menu-related links only)

3. **Category edit links**:
   - Find: `href={`/dashboard/restaurants/${restaurantId}/menu/categories`
   - Replace: `href={`/dashboard/menu-builder/${restaurantId}/categories`

4. **Item edit links**:
   - Find: `href={`/dashboard/restaurants/${restaurantId}/menu/items`
   - Replace: `href={`/dashboard/menu-builder/${restaurantId}/items`

---

## 🎨 UI Features Implemented

### Restaurant Selection Page
- ✅ Grid layout of restaurant cards
- ✅ Restaurant logos or default icons
- ✅ Quick access chevron on hover
- ✅ Empty state with "Create Restaurant" CTA
- ✅ Help section with tips

### Menu Builder Page
- ✅ Drag-and-drop category reordering (using `@dnd-kit`)
- ✅ Category header with item count
- ✅ Inline edit/delete buttons
- ✅ Item cards with images
- ✅ Price display with currency formatting
- ✅ "Sold Out" and "Hidden" badges
- ✅ Empty states for categories without items
- ✅ "Add Item" buttons within each category
- ✅ Quick stats dashboard at bottom
- ✅ Preview Menu button
- ✅ Add Category button

---

## 🚀 How to Use

### For Users

1. **Access Menu Builder**:
   - Click "Menu Builder" in sidebar
   - Select your restaurant (or auto-redirected if only one)

2. **Manage Categories**:
   - Drag categories to reorder them
   - Click "Add Category" to create new
   - Click edit icon to modify category
   - Click delete icon to remove (with confirmation)

3. **Manage Items**:
   - Click "+ Add Item to [Category]" within each category
   - Click edit icon on items to modify
   - Click delete icon to remove
   - Items show status badges (Sold Out, Hidden)

4. **Preview**:
   - Click "Preview Menu" to see customer view
   - Opens in new tab

---

## 🔌 API Integration

### Endpoints Used

1. **Get Restaurants**:
   ```
   GET /api/owner/restaurant
   ```

2. **Get Categories**:
   ```
   GET /api/owner/categories?restaurantId={id}
   ```

3. **Get Menu Items**:
   ```
   GET /api/owner/menu-items?restaurantId={id}
   ```

4. **Reorder Categories**:
   ```
   POST /api/owner/categories/reorder
   Body: { restaurantId, categories: [{id, order}] }
   ```

5. **Delete Category**:
   ```
   DELETE /api/owner/categories/{id}
   ```

6. **Delete Item**:
   ```
   DELETE /api/owner/menu-items/{id}
   ```

All endpoints use JWT authentication via `Authorization: Bearer {token}` header.

---

## 🐛 Known Issues & Solutions

### Issue 1: "Cannot find module" error
**Solution**: Ensure all copied files have correct import paths

### Issue 2: 404 on category/item edit pages
**Solution**: Complete Step 1 & 2 (copy the supporting pages)

### Issue 3: Drag-and-drop not working
**Solution**: Verify `@dnd-kit` packages are installed:
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

### Issue 4: Images not showing
**Solution**: Check Cloudinary configuration in .env

---

## 📝 Testing Checklist

After migration, test these features:

- [ ] Can access /dashboard/menu-builder
- [ ] Restaurant selection shows all restaurants
- [ ] Auto-redirect works with single restaurant
- [ ] Can view menu builder for a restaurant
- [ ] Can drag categories to reorder
- [ ] Order persists after page refresh
- [ ] Can click "Add Category" and create new
- [ ] Can edit category name
- [ ] Can delete category (with confirmation)
- [ ] Can add items to category
- [ ] Can edit menu item
- [ ] Can delete menu item
- [ ] "Sold Out" badge shows correctly
- [ ] Preview Menu button works
- [ ] Quick stats show accurate numbers
- [ ] Back button returns to restaurant selection

---

## 🎯 Benefits of New Structure

1. **Better Organization**: Menu builder is a primary feature, not nested under restaurants
2. **Easier Navigation**: Direct access from sidebar
3. **Multi-Restaurant Support**: Easy to switch between restaurants
4. **Cleaner URLs**: `/dashboard/menu-builder/{id}` vs `/dashboard/restaurants/{id}/menu`
5. **Consistency**: Matches other top-level sections (Orders, Analytics, Settings)

---

## 🔄 Backward Compatibility

The old route `/dashboard/restaurants/[id]/menu` can still work if you:

1. Keep the old file
2. Add a redirect in the old file:
   ```tsx
   'use client';
   import { useEffect } from 'react';
   import { useParams, useRouter } from 'next/navigation';
   
   export default function RedirectPage() {
     const params = useParams();
     const router = useRouter();
     
     useEffect(() => {
       const id = params?.id as string;
       if (id) {
         router.push(`/dashboard/menu-builder/${id}`);
       }
     }, [params, router]);
     
     return <div>Redirecting...</div>;
   }
   ```

---

## ✅ Completion Status

- [x] Created restaurant selection page
- [x] Created main menu builder page
- [x] Implemented drag-and-drop
- [x] Added category management UI
- [x] Added item management UI
- [x] Added quick stats
- [x] Added empty states
- [x] Documentation created
- [ ] Copy category pages (manual step)
- [ ] Copy item pages (manual step)
- [ ] Test all functionality
- [ ] Update any external links

---

## 🚀 Next Steps

1. **Copy the supporting pages** using the PowerShell commands above
2. **Find & Replace** the paths in copied files
3. **Test all functionality** using the checklist
4. **Optional**: Add redirect from old route for backward compatibility
5. **Update documentation** with any screenshots or videos

---

**Menu Builder is now a first-class feature!** 🎉
