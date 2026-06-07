import { Router, type Request, type Response } from "express";
import { z } from "zod";

export type DesignerAgentId = "designer-agent-001";

export type DesignerAgentRunStatus = "success" | "failed";

export type DesignerAgentAssetCategory =
  | "Shapes"
  | "Icons"
  | "Badges"
  | "Dividers"
  | "Frames"
  | "Backgrounds"
  | "Patterns"
  | "Callouts"
  | "Charts"
  | "Marketing Elements"
  | "Social Media Elements"
  | "UI Elements"
  | "Decorative Elements"
  | "Template Components";

export type DesignerAgentAsset = {
  id: string;
  name: string;
  description: string;
  category: DesignerAgentAssetCategory;
  premium: boolean;
  defaultWidth: number;
  defaultHeight: number;
  tags: string[];
  editableProperties: string[];
  svg: string;
  implementationNotes: string[];
};

export type DesignerAgentRunOutput = {
  runId: string;
  agentId: DesignerAgentId;
  agentName: string;
  status: DesignerAgentRunStatus;
  createdAt: string;
  summary: string;
  assetPack: {
    id: string;
    name: string;
    category: DesignerAgentAssetCategory;
    customerUse: string;
    visualSystem: {
      style: string;
      typography: string[];
      strokeWidth: string;
      cornerRadius: string;
      colorBehavior: string;
      accessibility: string[];
    };
    assets: DesignerAgentAsset[];
    developerHandoff: {
      suggestedFileLocation: string;
      suggestedIndexLocation: string;
      insertionStrategy: string;
      nextMilestone: string;
    };
    metadata: {
      searchKeywords: string[];
      customerFacingDescription: string;
      futureVariations: string[];
    };
    qualityChecklist: Record<string, boolean>;
  };
};

const runRequestSchema = z.object({
  assignment: z.string().trim().max(1000).optional(),
  packName: z.string().trim().max(160).optional(),
});

const DESIGNER_AGENT_001 = {
  id: "designer-agent-001" as const,
  name: "Designer Agent 001 — Canvas Asset Designer",
  role: "Production designer for Canvas editor asset-pack generation",
  mission:
    "Increase the quantity, quality, usability, and commercial value of reusable Canvas editor design assets.",
  sourceFiles: [
    "client/src/hooks/useCanvasEditor.ts",
    "client/src/Editor.tsx",
    "shared/designTypes.ts",
    "client/src/components/DownloadMenu.tsx",
    "docs/diagrams/canvas-ui-editor-detail.svg",
    "docs/diagrams/canvas-ui-interactions.mmd",
    "docs/diagrams/canvas-ui-layout.mmd",
    "ideas.md",
  ],
  defaultAssignment: "Premium Promo Badge Pack 001",
};

function createSvgDataUrl(svg: string): string {
  return `data:image/svg+xml;base64,${Buffer.from(svg, "utf8").toString("base64")}`;
}

function createBadgeAsset(input: {
  id: string;
  name: string;
  description: string;
  premium: boolean;
  defaultWidth: number;
  defaultHeight: number;
  tags: string[];
  editableProperties?: string[];
  svg: string;
  implementationNotes?: string[];
}): DesignerAgentAsset {
  return {
    id: input.id,
    name: input.name,
    description: input.description,
    category: "Badges",
    premium: input.premium,
    defaultWidth: input.defaultWidth,
    defaultHeight: input.defaultHeight,
    tags: input.tags,
    editableProperties:
      input.editableProperties ?? [
        "text",
        "fill",
        "stroke",
        "textColor",
        "accentColor",
      ],
    svg: input.svg,
    implementationNotes:
      input.implementationNotes ?? [
        "Insert with fabric.loadSVGFromString and groupSVGElements.",
        "Keep grouped SVG insertion for phase 1; split text into Fabric textboxes in phase 2.",
        `Preview may use ${createSvgDataUrl(input.svg).slice(0, 64)}...`,
      ],
  };
}

function generatePremiumPromoBadgePack001(): DesignerAgentRunOutput {
  const now = new Date();
  const createdAt = now.toISOString();
  const runId = `da001-run-${now.getTime()}`;

  const assets: DesignerAgentAsset[] = [
    createBadgeAsset({
      id: "promo-badge-sale-001",
      name: "Sale Badge",
      description:
        "A high-contrast rounded capsule badge for sale campaigns and discount promotions.",
      premium: false,
      defaultWidth: 360,
      defaultHeight: 112,
      tags: ["sale", "discount", "promo", "offer", "ecommerce", "deal"],
      svg: `<svg viewBox="0 0 360 112" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="6" width="348" height="100" rx="50" fill="#EF4444" stroke="#111827" stroke-width="3"/><text x="180" y="68" text-anchor="middle" font-family="Inter, sans-serif" font-size="42" font-weight="800" letter-spacing="3" fill="#FFFFFF">SALE</text><path d="M296 34 L304 48 L318 56 L304 64 L296 78 L288 64 L274 56 L288 48 Z" fill="#F59E0B"/></svg>`,
    }),
    createBadgeAsset({
      id: "promo-badge-new-arrival-001",
      name: "New Arrival Badge",
      description:
        "A clean soft-rectangle badge for product launches and new inventory announcements.",
      premium: true,
      defaultWidth: 340,
      defaultHeight: 128,
      tags: ["new", "arrival", "launch", "product", "boutique", "announcement"],
      svg: `<svg viewBox="0 0 340 128" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="6" width="328" height="116" rx="24" fill="#111827" stroke="#8B5CF6" stroke-width="3"/><circle cx="38" cy="42" r="6" fill="#8B5CF6"/><circle cx="38" cy="64" r="6" fill="#F59E0B"/><circle cx="38" cy="86" r="6" fill="#FFFFFF"/><text x="190" y="55" text-anchor="middle" font-family="Inter, sans-serif" font-size="28" font-weight="800" fill="#FFFFFF">NEW</text><text x="190" y="88" text-anchor="middle" font-family="Inter, sans-serif" font-size="28" font-weight="800" fill="#FFFFFF">ARRIVAL</text></svg>`,
    }),
    createBadgeAsset({
      id: "promo-badge-limited-time-001",
      name: "Limited Time Badge",
      description:
        "Urgency-focused badge for flash sales, timed offers, and seasonal campaigns.",
      premium: true,
      defaultWidth: 380,
      defaultHeight: 116,
      tags: ["limited", "time", "flash sale", "urgency", "countdown"],
      svg: `<svg viewBox="0 0 380 116" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="6" width="368" height="104" rx="52" fill="#F59E0B" stroke="#111827" stroke-width="3"/><circle cx="62" cy="58" r="28" fill="none" stroke="#111827" stroke-width="5"/><path d="M62 42 V60 L76 68" fill="none" stroke="#111827" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><text x="230" y="66" text-anchor="middle" font-family="Inter, sans-serif" font-size="30" font-weight="800" fill="#111827">LIMITED TIME</text></svg>`,
    }),
    createBadgeAsset({
      id: "promo-badge-best-seller-001",
      name: "Best Seller Badge",
      description:
        "A circular seal-style badge for best-selling products and high-performing offers.",
      premium: true,
      defaultWidth: 190,
      defaultHeight: 190,
      tags: ["best seller", "popular", "top product", "ecommerce", "ranking"],
      editableProperties: ["text", "fill", "stroke", "textColor", "starColor", "ringColor"],
      svg: `<svg viewBox="0 0 190 190" xmlns="http://www.w3.org/2000/svg"><circle cx="95" cy="95" r="86" fill="#111827" stroke="#F59E0B" stroke-width="6"/><circle cx="95" cy="95" r="68" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-dasharray="8 8"/><path d="M95 49 L106 76 L135 78 L113 96 L120 124 L95 109 L70 124 L77 96 L55 78 L84 76 Z" fill="#F59E0B"/><text x="95" y="142" text-anchor="middle" font-family="Inter, sans-serif" font-size="20" font-weight="800" fill="#FFFFFF">BEST SELLER</text></svg>`,
    }),
    createBadgeAsset({
      id: "promo-badge-customer-favorite-001",
      name: "Customer Favorite Badge",
      description:
        "A trust-building badge for products or services with strong customer approval.",
      premium: true,
      defaultWidth: 400,
      defaultHeight: 126,
      tags: ["customer favorite", "favorite", "reviews", "trusted", "recommended"],
      editableProperties: ["text", "fill", "stroke", "textColor", "heartColor", "accentColor"],
      svg: `<svg viewBox="0 0 400 126" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="6" width="388" height="114" rx="32" fill="#F3F4F6" stroke="#111827" stroke-width="3"/><path d="M74 45 C74 32 90 28 99 39 C108 28 124 32 124 45 C124 67 99 81 99 81 C99 81 74 67 74 45 Z" fill="#EF4444"/><text x="250" y="72" text-anchor="middle" font-family="Inter, sans-serif" font-size="28" font-weight="800" fill="#111827">CUSTOMER FAVORITE</text></svg>`,
    }),
    createBadgeAsset({
      id: "promo-badge-grand-opening-001",
      name: "Grand Opening Badge",
      description:
        "A celebratory badge for new business launches, grand openings, and first-time announcements.",
      premium: true,
      defaultWidth: 420,
      defaultHeight: 140,
      tags: ["grand opening", "launch", "business", "opening", "celebration"],
      svg: `<svg viewBox="0 0 420 140" xmlns="http://www.w3.org/2000/svg"><path d="M28 18 H392 V104 H300 L284 130 L268 104 H28 Z" fill="#3B82F6" stroke="#111827" stroke-width="3" stroke-linejoin="round"/><path d="M64 34 L76 22 M352 36 L366 24 M340 88 L356 96 M72 90 L54 100" stroke="#F59E0B" stroke-width="5" stroke-linecap="round"/><text x="210" y="72" text-anchor="middle" font-family="Inter, sans-serif" font-size="32" font-weight="800" fill="#FFFFFF">GRAND OPENING</text></svg>`,
    }),
    createBadgeAsset({
      id: "promo-badge-free-shipping-001",
      name: "Free Shipping Badge",
      description: "A practical ecommerce badge for shipping promotions.",
      premium: false,
      defaultWidth: 400,
      defaultHeight: 116,
      tags: ["free shipping", "shipping", "ecommerce", "delivery", "store"],
      editableProperties: ["text", "fill", "stroke", "textColor", "iconColor"],
      svg: `<svg viewBox="0 0 400 116" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="6" width="388" height="104" rx="52" fill="#10B981" stroke="#111827" stroke-width="3"/><path d="M48 66 H102 V44 H128 L150 66 V82 H140 M64 82 H124" fill="none" stroke="#111827" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="72" cy="84" r="8" fill="#111827"/><circle cx="132" cy="84" r="8" fill="#111827"/><text x="266" y="68" text-anchor="middle" font-family="Inter, sans-serif" font-size="31" font-weight="800" fill="#FFFFFF">FREE SHIPPING</text></svg>`,
    }),
    createBadgeAsset({
      id: "promo-badge-handmade-001",
      name: "Handmade Badge",
      description:
        "A warm badge for handmade goods, boutique sellers, and maker businesses.",
      premium: true,
      defaultWidth: 360,
      defaultHeight: 128,
      tags: ["handmade", "maker", "craft", "boutique", "artisan", "small shop"],
      editableProperties: ["text", "fill", "stroke", "textColor", "accentColor", "borderStyle"],
      svg: `<svg viewBox="0 0 360 128" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="8" width="344" height="112" rx="30" fill="#FFFBEB" stroke="#92400E" stroke-width="3"/><rect x="20" y="20" width="320" height="88" rx="24" fill="none" stroke="#92400E" stroke-width="2" stroke-dasharray="8 7"/><path d="M72 72 C94 42 124 48 132 70 C106 78 88 82 72 72 Z" fill="#10B981"/><text x="220" y="75" text-anchor="middle" font-family="Inter, sans-serif" font-size="34" font-weight="800" fill="#92400E">HANDMADE</text></svg>`,
    }),
    createBadgeAsset({
      id: "promo-badge-digital-download-001",
      name: "Digital Download Badge",
      description:
        "A badge for downloadable templates, SVG files, printables, ebooks, and digital assets.",
      premium: true,
      defaultWidth: 430,
      defaultHeight: 126,
      tags: ["digital download", "download", "printable", "svg", "template", "digital product"],
      editableProperties: ["text", "fill", "stroke", "textColor", "iconColor", "accentColor"],
      svg: `<svg viewBox="0 0 430 126" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="6" width="418" height="114" rx="28" fill="#EFF6FF" stroke="#1D4ED8" stroke-width="3"/><path d="M72 34 V72 M54 56 L72 74 L90 56 M48 88 H96" fill="none" stroke="#1D4ED8" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><text x="270" y="72" text-anchor="middle" font-family="Inter, sans-serif" font-size="30" font-weight="800" fill="#1E3A8A">DIGITAL DOWNLOAD</text></svg>`,
    }),
    createBadgeAsset({
      id: "promo-badge-small-business-001",
      name: "Small Business Badge",
      description:
        "A community-forward badge for independent shops, local brands, and creator businesses.",
      premium: true,
      defaultWidth: 420,
      defaultHeight: 128,
      tags: ["small business", "local", "independent", "shop small", "creator", "entrepreneur"],
      svg: `<svg viewBox="0 0 420 128" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="6" width="408" height="116" rx="30" fill="#111827" stroke="#F59E0B" stroke-width="3"/><path d="M50 60 H116 L108 38 H58 Z M58 60 V92 H108 V60 M70 92 V72 H96 V92" fill="none" stroke="#F59E0B" stroke-width="5" stroke-linejoin="round"/><text x="270" y="74" text-anchor="middle" font-family="Inter, sans-serif" font-size="31" font-weight="800" fill="#FFFFFF">SMALL BUSINESS</text></svg>`,
    }),
    createBadgeAsset({
      id: "promo-badge-trending-001",
      name: "Trending Badge",
      description:
        "A modern badge for popular, viral, or high-engagement products and content.",
      premium: true,
      defaultWidth: 360,
      defaultHeight: 112,
      tags: ["trending", "popular", "viral", "hot", "social media", "creator"],
      editableProperties: ["text", "fill", "stroke", "textColor", "arrowColor", "accentColor"],
      svg: `<svg viewBox="0 0 360 112" xmlns="http://www.w3.org/2000/svg"><path d="M28 6 H354 L332 106 H6 Z" fill="#8B5CF6" stroke="#111827" stroke-width="3" stroke-linejoin="round"/><path d="M62 76 L94 44 L116 66 L146 36 M120 36 H146 V62" fill="none" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><text x="245" y="68" text-anchor="middle" font-family="Inter, sans-serif" font-size="32" font-weight="800" fill="#FFFFFF">TRENDING</text></svg>`,
    }),
    createBadgeAsset({
      id: "promo-badge-exclusive-001",
      name: "Exclusive Badge",
      description:
        "A premium-feeling badge for exclusive products, members-only offers, limited collections, and VIP content.",
      premium: true,
      defaultWidth: 380,
      defaultHeight: 116,
      tags: ["exclusive", "premium", "vip", "limited", "members only", "special offer"],
      editableProperties: ["text", "fill", "stroke", "textColor", "accentColor", "ringColor"],
      svg: `<svg viewBox="0 0 380 116" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="6" width="368" height="104" rx="52" fill="#111827" stroke="#F59E0B" stroke-width="4"/><path d="M68 34 L96 58 L68 82 L40 58 Z" fill="none" stroke="#F59E0B" stroke-width="5" stroke-linejoin="round"/><path d="M40 58 H96 M68 34 V82" stroke="#F59E0B" stroke-width="3"/><text x="242" y="68" text-anchor="middle" font-family="Inter, sans-serif" font-size="34" font-weight="800" letter-spacing="2" fill="#FFFFFF">EXCLUSIVE</text></svg>`,
    }),
  ];

  return {
    runId,
    agentId: DESIGNER_AGENT_001.id,
    agentName: DESIGNER_AGENT_001.name,
    status: "success",
    createdAt,
    summary:
      "Created Premium Promo Badge Pack 001: a 12-asset SVG badge pack for ecommerce, social media, flyers, and small-business marketing workflows.",
    assetPack: {
      id: "premium-promo-badge-pack-001",
      name: "Premium Promo Badge Pack 001",
      category: "Badges",
      customerUse:
        "Customers use this pack to add polished promotional labels to product photos, listing graphics, social posts, flyers, launch announcements, and digital ads.",
      visualSystem: {
        style: "Modern, clean, slightly premium, small-business friendly.",
        typography: ["Inter SemiBold", "Montserrat Bold", "Poppins ExtraBold"],
        strokeWidth: "3px default stroke, 1.5px secondary decorative stroke.",
        cornerRadius:
          "20px to 999px depending on badge geometry: rounded capsules, soft rectangles, circular seals, and ribbon tabs.",
        colorBehavior:
          "Each asset supports fill, text, stroke, and accent color customization.",
        accessibility: [
          "Use strong contrast pairings by default.",
          "Do not rely on color alone; visible label text carries meaning.",
          "Avoid tiny decorative details that disappear at thumbnail sizes.",
        ],
      },
      assets,
      developerHandoff: {
        suggestedFileLocation:
          "client/src/assets/packs/premiumPromoBadgePack001.ts",
        suggestedIndexLocation: "client/src/assets/packs/index.ts",
        insertionStrategy:
          "Use fabric.loadSVGFromString(asset.svg), groupSVGElements, center on canvas, then set active object.",
        nextMilestone:
          "Load this pack into the Elements panel under a Badges category and insert selected badges as grouped SVG objects.",
      },
      metadata: {
        searchKeywords: [
          "promo badge",
          "sale badge",
          "marketing badge",
          "ecommerce label",
          "product sticker",
          "social media badge",
          "premium badge",
          "shop small",
          "digital download",
          "handmade",
          "free shipping",
          "exclusive",
          "trending",
        ],
        customerFacingDescription:
          "Add polished promotional badges to product photos, social posts, flyers, and digital ads. Includes editable labels for sales, launches, shipping offers, handmade products, digital downloads, and exclusive campaigns.",
        futureVariations: [
          "Holiday Promo Badge Pack",
          "Black Friday Badge Pack",
          "Etsy Seller Badge Pack",
          "Digital Product Badge Pack",
          "Luxury Gold Badge Pack",
          "Minimal Monochrome Badge Pack",
          "Retro Sticker Badge Pack",
        ],
      },
      qualityChecklist: {
        scalable: true,
        svgCompatible: true,
        canvasEditorSuitable: true,
        usefulToPayingCustomers: true,
        searchableWithMetadata: true,
        organizedIntoPack: true,
        developerImplementationReady: true,
        commerciallyValuable: true,
        consistentVisualSystem: true,
      },
    },
  };
}

export function runDesignerAgent001(input?: {
  assignment?: string;
  packName?: string;
}): DesignerAgentRunOutput {
  const requestedPack = input?.packName?.trim() || input?.assignment?.trim();

  if (
    requestedPack &&
    !requestedPack.toLowerCase().includes("premium promo badge pack")
  ) {
    return {
      ...generatePremiumPromoBadgePack001(),
      summary:
        "Designer Agent 001 currently supports Premium Promo Badge Pack 001 as its first implemented production run. Additional pack generators should be registered as new run handlers.",
    };
  }

  return generatePremiumPromoBadgePack001();
}

export function createDesignerAgentRouter(): Router {
  const router = Router();

  router.get("/health", (_req: Request, res: Response) => {
    return res.json({
      ok: true,
      agents: [
        {
          id: DESIGNER_AGENT_001.id,
          name: DESIGNER_AGENT_001.name,
          role: DESIGNER_AGENT_001.role,
          mission: DESIGNER_AGENT_001.mission,
          defaultAssignment: DESIGNER_AGENT_001.defaultAssignment,
        },
      ],
    });
  });

  router.get("/designer-agent-001", (_req: Request, res: Response) => {
    return res.json(DESIGNER_AGENT_001);
  });

  router.post("/designer-agent-001/runs", (req: Request, res: Response) => {
    const parsed = runRequestSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid designer agent run request",
        details: parsed.error.issues.map(issue => issue.message).join("; "),
      });
    }

    const run = runDesignerAgent001(parsed.data);
    return res.status(201).json(run);
  });

  return router;
}
