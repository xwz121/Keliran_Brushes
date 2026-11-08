# Dedicated catalogue images

Generated using the built-in imagegen tool on 2026-09-23: 16 product images and 3 finishing-service images. Each image was generated with its own product-specific prompt. The exact prompt set and titles are in `scripts/seed/product-images.json`.

Original PNGs and optimized 1536 × 1024 WebP files are stored in `public/images/products/<slug>.{png,webp}`. The WebP set totals approximately 1.31 MB. The images remain conceptual illustrations (`illustrative: true`, `approved: false`).

## Ownership and permitted reuse

- Every distinct product owns one dedicated image; images must never be assigned to another product.
- The same product may show its image in its listing, detail page, related-product card, language versions, and corresponding category. These are navigation views of the same subject, not separate product assignments.
- The 3 finishing services each own a separate image. Category cards no longer share the generic family montage.
- Generic family montages in `public/images/keliran-v2` remain available for editorial/hero use, but are no longer assigned as product or category images by the seed.

## CMS integration

`scripts/seed/catalogue.ts` now uses the product/category slug as its image key. `scripts/seed/product-media.ts` imports the matching asset with a stable source note, allowing repeat runs without duplicate uploads.

The existing local CMS drafts are updated with:

```sh
node scripts/local-env.mjs pnpm exec tsx scripts/replace-product-images.ts
```

This command is restricted to the local `keliran_redesign` database. It backs up existing records under `.local/image-backups`, changes only image references and the associated facts-confirmation flag, and checks that all products have exactly one unique media record. Text and translations are preserved. It does not publish drafts.

Audit output: `docs/review/product-image-audit.json`.
