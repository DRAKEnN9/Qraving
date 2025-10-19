# Conflicting Route Issue

The file `src/app/api/restaurant/[slug]/menu/route.ts` needs to be deleted as it conflicts with `src/app/api/menu/[slug]/route.ts`.

Both routes handle the same functionality and cause a 508 Loop Detected error on deployment.

## Solution
Delete the conflicting route: `src/app/api/restaurant/[slug]/menu/route.ts`
Keep only: `src/app/api/menu/[slug]/route.ts`

## Manual Steps Required
1. Delete the file: `src/app/api/restaurant/[slug]/menu/route.ts`
2. Keep the directory structure but remove the route.ts file
3. Commit and redeploy

The main route at `/api/menu/[slug]` now has proper debugging logs and error handling.
