import { config as loadEnv } from "dotenv";
import { getPrisma } from "../server/db.js";
import {
  getCustomAssetSource,
  getGeneratedStockAssetSeedData,
} from "../server/stockAssets.js";

loadEnv({ path: ".env.local" });
loadEnv();

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set. Configure PostgreSQL before seeding.");
  }

  const prisma = await getPrisma();
  const assets = getGeneratedStockAssetSeedData();
  const customSource = getCustomAssetSource();

  await prisma.$transaction([
    prisma.stockAsset.deleteMany({
      where: { source: customSource },
    }),
    prisma.stockAsset.createMany({
      data: assets.map(asset => ({
        id: asset.id,
        mediaType: asset.mediaType,
        url: asset.url,
        thumbUrl: asset.thumbUrl,
        alt: asset.alt,
        category: asset.category,
        tags: asset.tags,
        orientation: asset.orientation,
        colorHints: asset.colorHints,
        source: asset.source,
        sourceUrl: asset.sourceUrl,
        license: asset.license,
        licenseUrl: asset.licenseUrl,
        attribution: asset.attribution,
        attributionRequired: asset.attributionRequired,
        commercialUse: asset.commercialUse,
        createdAt: new Date(asset.createdAt),
      })),
    }),
  ]);

  console.log(`Seeded ${assets.length} generated stock assets into PostgreSQL.`);
  await prisma.$disconnect();
}

main().catch(async error => {
  console.error("Failed to seed stock assets.", error);

  try {
    const prisma = await getPrisma();
    await prisma.$disconnect();
  } catch {
    // Ignore disconnect failures after startup errors.
  }

  process.exitCode = 1;
});
