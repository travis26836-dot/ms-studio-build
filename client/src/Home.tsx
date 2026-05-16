/**
 * Style note: Neo-industrial editorial workspace with a gothic-retro wordmark,
 * centered dashboard modules, dark glass surfaces, and restrained utility-first motion.
 * Ask: Does this choice reinforce or dilute the studio-grade identity?
 */
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { AccountMenu } from "@/components/AccountMenu";
import {
  Plus,
  Search,
  LayoutTemplate,
  FileText,
  Image as ImageIcon,
  Presentation,
  Star,
  Clock,
  Folder,
  Sparkles,
  Palette,
  ArrowRight,
  Zap,
  Layers,
  Wand2,
  Code2,
  Bot,
  Download,
  Trash2,
  Loader2,
} from "lucide-react";
import { getLoginUrl, getPortalUrl } from "@/const";
import {
  FlashInElement,
  PageLoadAnimator,
} from "@/components/PageLoadAnimator";
import { ParallaxScroll, RevealOnScroll } from "@/components/ParallaxScroll";
import { useLocation } from "wouter";
import { useEffect, useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

type CuratedTemplate = {
  id: string;
  title: string;
  subtitle: string;
  size: string;
  width: number;
  height: number;
  categories: string[];
  color: string;
  icon: typeof LayoutTemplate;
};

const DESIGN_PRESETS = [
  { key: "instagram-post", label: "Instagram Post", width: 1080, height: 1080 },
  {
    key: "instagram-story",
    label: "Instagram Story",
    width: 1080,
    height: 1920,
  },
  { key: "facebook-post", label: "Facebook Post", width: 1200, height: 630 },
  { key: "facebook-story", label: "Facebook Story", width: 1080, height: 1920 },
  { key: "pinterest-pin", label: "Pinterest Pin", width: 1000, height: 1500 },
  { key: "x-post", label: "Twitter/X Post", width: 1600, height: 900 },
  {
    key: "youtube-thumbnail",
    label: "YouTube Thumbnail",
    width: 1280,
    height: 720,
  },
  { key: "linkedin-post", label: "LinkedIn Post", width: 1200, height: 627 },
  { key: "flyer-letter", label: "Flyer (Letter)", width: 2550, height: 3300 },
  { key: "flyer-a4", label: "Flyer (A4)", width: 2480, height: 3508 },
  { key: "menu", label: "Menu", width: 1080, height: 1920 },
  { key: "presentation", label: "Presentation", width: 1920, height: 1080 },
  { key: "business-card", label: "Business Card", width: 1050, height: 600 },
  { key: "poster", label: "Poster", width: 2400, height: 3600 },
];

const COMMON_CANVAS_SIZES = [
  { key: "instagram-post", label: "Instagram Post", width: 1080, height: 1080 },
  { key: "instagram-story", label: "Instagram Story", width: 1080, height: 1920 },
  { key: "facebook-post", label: "Facebook Post", width: 1200, height: 630 },
  { key: "x-post", label: "Twitter/X Post", width: 1600, height: 900 },
  { key: "youtube-thumbnail", label: "YouTube Thumbnail", width: 1280, height: 720 },
  { key: "presentation", label: "Presentation", width: 1920, height: 1080 },
  { key: "flyer-letter", label: "Flyer (Letter)", width: 2550, height: 3300 },
  { key: "flyer-a4", label: "Flyer (A4)", width: 2480, height: 3508 },
];

const TEMPLATE_CATEGORIES = [
  { value: "all", label: "All" },
  { value: "social-media", label: "Social Media" },
  { value: "menu", label: "Menus" },
  { value: "invitation", label: "Invitations" },
  { value: "certificate", label: "Certificates" },
  { value: "flyer", label: "Flyers" },
  { value: "document", label: "Documents" },
  { value: "presentation", label: "Presentations" },
  { value: "promotional", label: "Promotional" },
  { value: "logo", label: "Logos" },
  { value: "business", label: "Business" },
  { value: "ecommerce", label: "Ecommerce" },
  { value: "ads", label: "Ads" },
  { value: "print", label: "Print" },
];

const CURATED_TEMPLATE_IDEAS: CuratedTemplate[] = [
  {
    id: "featured-brand-kit",
    title: "Brand Kit Board",
    subtitle: "Logo, palette, typography, and brand notes in one workspace.",
    size: "1600x1200",
    width: 1600,
    height: 1200,
    categories: ["all", "business", "document", "logo"],
    color: "#8b5cf6",
    icon: Palette,
  },
  {
    id: "featured-promo-carousel",
    title: "Promo Carousel",
    subtitle: "Create a homepage-ready multi-slide campaign set.",
    size: "1080x1080",
    width: 1080,
    height: 1080,
    categories: ["all", "social-media", "promotional", "ads"],
    color: "#06b6d4",
    icon: Presentation,
  },
  {
    id: "featured-pinterest-collage",
    title: "Pinterest Mood Board",
    subtitle: "Build tall, shoppable mood boards for product storytelling.",
    size: "1000x1500",
    width: 1000,
    height: 1500,
    categories: ["all", "social-media", "ecommerce"],
    color: "#ec4899",
    icon: ImageIcon,
  },
  {
    id: "featured-menu-highlight",
    title: "Menu Highlight",
    subtitle: "Turn bestsellers into polished restaurant promo panels.",
    size: "1080x1920",
    width: 1080,
    height: 1920,
    categories: ["all", "menu", "promotional", "print"],
    color: "#f59e0b",
    icon: FileText,
  },
];

const FOOTER_LINKS = [
  { key: "contact", title: "Contact", href: "/contact" },
  { key: "privacy-policy", title: "Privacy Policy", href: "/privacy-policy" },
  {
    key: "terms-of-service",
    title: "Terms of Service",
    href: "/terms-of-service",
  },
  {
    key: "refund-return-policy",
    title: "Refund / Return Policy",
    href: "/refund-policy",
  },
] as const;

function matchesTemplateCategory(template: any, activeTab: string) {
  if (activeTab === "all") return true;

  const haystack =
    `${template?.category || ""} ${template?.name || ""}`.toLowerCase();
  const matchers: Record<string, string[]> = {
    "social-media": [
      "social",
      "instagram",
      "facebook",
      "pinterest",
      "linkedin",
      "youtube",
      "post",
    ],
    menu: ["menu", "restaurant", "food"],
    invitation: ["invitation", "invite", "event", "wedding"],
    certificate: ["certificate", "award", "diploma"],
    flyer: ["flyer", "poster", "brochure"],
    document: ["document", "letter", "proposal", "report"],
    presentation: ["presentation", "slide", "deck"],
    promotional: ["promo", "promotional", "campaign", "sale", "launch"],
    logo: ["logo", "brand", "identity"],
    business: ["business", "invoice", "proposal", "brand"],
    ecommerce: ["ecommerce", "product", "listing", "shop"],
    ads: ["ad", "ads", "campaign", "banner"],
    print: ["print", "menu", "flyer", "poster", "brochure"],
  };

  return (matchers[activeTab] || []).some(term => haystack.includes(term));
}

function SiteFooter() {
  const [, setLocation] = useLocation();

  return (
    <footer className="mt-16 border-t border-border bg-card/50 px-6 py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p
            className="text-sm font-semibold uppercase tracking-[0.18em] text-foreground"
            style={{ fontFamily: '"Cinzel Decorative", serif' }}
          >
            ManuScript Studio
          </p>
          <p className="mt-2 max-w-xl text-xs leading-6 text-muted-foreground">
            Custom image editing, templates, branding systems, listing mockups,
            and digital marketing assets in one studio workspace.
          </p>
        </div>
        <nav className="flex flex-wrap items-center gap-2 md:justify-end">
          {FOOTER_LINKS.map(link => (
            <Button
              key={link.key}
              type="button"
              variant="ghost"
              className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setLocation(link.href)}
            >
              {link.title}
            </Button>
          ))}
        </nav>
      </div>
    </footer>
  );
}

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  if (!isAuthenticated && !loading) {
    return <LandingPage />;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-0.5 w-32 bg-[oklch(0.22_0.008_260)] overflow-hidden rounded-full">
            <div className="h-full bg-[oklch(0.78_0.17_75)] animate-[systemInit_1.2s_ease-in-out_infinite]" style={{ width: '60%' }} />
          </div>
          <p className="text-[10px] tracking-[0.22em] uppercase text-[oklch(0.55_0.008_75)]" style={{ fontFamily: '"Space Grotesk", ui-sans-serif' }}>Initializing</p>
        </div>
      </div>
    );
  }

  return (
    <Dashboard
      user={user}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      setLocation={setLocation}
    />
  );
}

function Dashboard({
  user,
  searchQuery,
  setSearchQuery,
  setLocation,
}: {
  user: any;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  setLocation: (path: string) => void;
}) {
  const {
    data: myProjects,
    isLoading: projectsLoading,
    refetch: refetchProjects,
  } = trpc.projects.list.useQuery();
  const { data: dbTemplates, isLoading: templatesLoading } =
    trpc.templates.list.useQuery(undefined);
  const deleteMutation = trpc.projects.delete.useMutation();
  const [activeTab, setActiveTab] = useState("all");
  const [showAllPresets, setShowAllPresets] = useState(false);
  const [showAllTemplates, setShowAllTemplates] = useState(false);
  const [pendingPreset, setPendingPreset] = useState<{
    width: number;
    height: number;
    label: string;
    isCustomSize?: boolean;
  } | null>(null);
  const [newProjectName, setNewProjectName] = useState("");
  const [customWidth, setCustomWidth] = useState("1080");
  const [customHeight, setCustomHeight] = useState("1080");

  function navigateToPortal() {
    const mainAppUrl = window.location.origin;

    const portalUrl = getPortalUrl({
      returnTo: mainAppUrl,
      user: user
        ? { name: user.name, email: user.email, clerkId: user.id }
        : undefined,
    });
    
    window.location.assign(portalUrl);
  }

  const q = searchQuery.trim().toLowerCase();

  const filteredTemplates = useMemo(() => {
    const templates = dbTemplates || [];
    return templates.filter((template: any) => {
      const matchesCategory = matchesTemplateCategory(template, activeTab);
      if (!q) return matchesCategory;
      return (
        matchesCategory &&
        ((template.name || "").toLowerCase().includes(q) ||
          (template.category || "").toLowerCase().includes(q))
      );
    });
  }, [dbTemplates, activeTab, q]);

  const visiblePresets = useMemo(() => {
    const base = showAllPresets ? DESIGN_PRESETS : DESIGN_PRESETS.slice(0, 10);
    if (!q) return base;
    return DESIGN_PRESETS.filter(p => p.label.toLowerCase().includes(q));
  }, [showAllPresets, q]);

  const visibleCuratedTemplates = useMemo(() => {
    const matches = CURATED_TEMPLATE_IDEAS.filter(template => {
      const matchesCategory =
        activeTab === "all" || template.categories.includes(activeTab);
      if (!q) return matchesCategory;
      return (
        matchesCategory &&
        (template.title.toLowerCase().includes(q) ||
          template.subtitle.toLowerCase().includes(q))
      );
    });
    return showAllTemplates ? matches : matches.slice(0, 2);
  }, [activeTab, showAllTemplates, q]);

  const visibleDbTemplates = useMemo(
    () =>
      showAllTemplates
        ? filteredTemplates.slice(0, 10)
        : filteredTemplates.slice(0, 6),
    [filteredTemplates, showAllTemplates]
  );

  const filteredProjects = useMemo(() => {
    if (!q || !myProjects) return myProjects;
    return (myProjects as any[]).filter((p: any) =>
      (p.name || "").toLowerCase().includes(q)
    );
  }, [myProjects, q]);

  const handleDeleteProject = async (id: string) => {
    try {
      await deleteMutation.mutateAsync({ id });
      refetchProjects();
      toast.success("Project deleted");
    } catch {
      toast.error("Failed to delete project");
    }
  };

  const openCreateDialog = (preset: {
    width: number;
    height: number;
    label: string;
    isCustomSize?: boolean;
  }) => {
    setNewProjectName(preset.label);
    setCustomWidth(String(preset.width));
    setCustomHeight(String(preset.height));
    setPendingPreset(preset);
  };

  const applyCommonCanvasSize = (size: {
    label: string;
    width: number;
    height: number;
  }) => {
    setCustomWidth(String(size.width));
    setCustomHeight(String(size.height));
    setNewProjectName(current =>
      current.trim() === "" || current === "Custom Design" ? size.label : current
    );
  };

  const handleCreateProject = () => {
    if (!pendingPreset) return;

    let width = pendingPreset.width;
    let height = pendingPreset.height;

    if (pendingPreset.isCustomSize) {
      const parsedWidth = Number.parseInt(customWidth, 10);
      const parsedHeight = Number.parseInt(customHeight, 10);

      if (
        Number.isNaN(parsedWidth) ||
        Number.isNaN(parsedHeight) ||
        parsedWidth <= 0 ||
        parsedHeight <= 0
      ) {
        toast.error("Enter a valid canvas size in pixels");
        return;
      }

      width = parsedWidth;
      height = parsedHeight;
    }

    const name = newProjectName.trim() || pendingPreset.label;
    setLocation(
      `/editor?w=${width}&h=${height}&name=${encodeURIComponent(name)}`
    );
    setPendingPreset(null);
    setNewProjectName("");
  };

  const templateColors = [
    "#6366f1",
    "#ec4899",
    "#14b8a6",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#06b6d4",
    "#22c55e",
    "#f97316",
    "#64748b",
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="site-header">
        <div className="site-header-inner">
          <div className="site-header-left">
            <a href="#" className="site-logo" aria-label="ManuScript Studio">
              <div className="site-logo-icon">
                <img
                  src="/icon-192.png"
                  alt="ManuScript Studio logo"
                />
              </div>
              <span className="site-logo-wordmark">ManuScript Studio</span>
            </a>
          </div>

          <div className="site-header-search">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="What are you trying to make?"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && searchQuery.trim()) {
                    openCreateDialog({
                      width: 1080,
                      height: 1080,
                      label: searchQuery.trim(),
                    });
                  }
                }}
                className="w-full h-10 rounded-lg bg-secondary/70 border border-border pl-10 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-red-600/50 focus:bg-secondary transition-all"
              />
            </div>
          </div>

          <AccountMenu />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <section className="mb-12 text-center relative">
          <div className="absolute inset-x-0 top-0 h-px bg-[var(--measurement-line)]" />
          <div className="mx-auto mb-6 max-w-3xl">
            <h2 className="text-xl font-semibold tracking-[0.05em] text-foreground" style={{ fontFamily: '"Space Grotesk", ui-sans-serif' }}>
              Create a design
            </h2>
            <p className="mt-2 text-xs text-muted-foreground">
              Start faster with the most-requested social, print, product, and
              marketing canvas sizes.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
            {visiblePresets.length === 0 && q ? (
              <div className="col-span-full py-6 text-sm text-muted-foreground">
                No sizes match "{searchQuery}"
              </div>
            ) : (
              visiblePresets.map(preset => (
                <button
                  key={preset.key}
                  onClick={() =>
                    openCreateDialog({
                      width: preset.width,
                      height: preset.height,
                      label: preset.label,
                    })
                  }
                  className="group flex flex-col items-center gap-3 rounded-sm border border-border bg-card/80 p-4 text-center transition-all duration-150 hover:border-[oklch(0.78_0.17_75)]/50 hover:bg-[oklch(0.78_0.17_75)]/5"
                >
                  <div className="flex h-20 w-20 items-center justify-center rounded-sm border border-border bg-secondary transition-all group-hover:border-[oklch(0.78_0.17_75)]/40">
                    <Plus className="h-6 w-6 text-muted-foreground transition-colors group-hover:text-[oklch(0.78_0.17_75)]" />
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-foreground" style={{ fontFamily: '"Space Grotesk", ui-sans-serif' }}>
                      {preset.label}
                    </span>
                    <span className="mt-1 block text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                      {preset.width}×{preset.height}
                    </span>
                  </div>
                </button>
              ))
            )}

            {!q && (
              <>
                <button
                  onClick={() =>
                    openCreateDialog({
                      width: 1080,
                      height: 1080,
                      label: "Custom Design",
                      isCustomSize: true,
                    })
                  }
                  className="group flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-border bg-card/40 p-4 text-center transition-all hover:border-primary/50 hover:bg-primary/5"
                >
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-dashed border-border transition-all group-hover:border-primary/50">
                    <Plus className="h-6 w-6 text-muted-foreground group-hover:text-primary" />
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-foreground">
                      Custom Size
                    </span>
                    <span className="mt-1 block text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                      Open editor
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setShowAllPresets(current => !current)}
                  className="group flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card/60 p-4 text-center transition-all hover:border-primary/50 hover:bg-primary/5"
                >
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <LayoutTemplate className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-foreground">
                      {showAllPresets ? "Show Fewer" : "View More"}
                    </span>
                    <span className="mt-1 block text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                      More preset sizes
                    </span>
                  </div>
                </button>
              </>
            )}
          </div>
        </section>

        <section className="mb-12 text-center">
          <div className="mx-auto mb-6 max-w-3xl">
            <h2 className="text-2xl font-semibold text-foreground" style={{ fontFamily: '"Space Grotesk", ui-sans-serif' }}>
              Start from a template
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Explore broader categories inspired by modern template libraries,
              then jump into a ready-made layout.
            </p>
            <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">
              {(dbTemplates?.length || 0) + CURATED_TEMPLATE_IDEAS.length}{" "}
              homepage-ready options
            </p>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <div className="flex justify-center">
              <ScrollArea className="w-full max-w-6xl whitespace-nowrap">
                <TabsList className="mb-6 inline-flex h-auto flex-nowrap gap-1 bg-secondary p-1">
                  {TEMPLATE_CATEGORIES.map(category => (
                    <TabsTrigger
                      key={category.value}
                      value={category.value}
                      className="px-4"
                    >
                      {category.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </ScrollArea>
            </div>

            <TabsContent value={activeTab} className="mt-0">
              {templatesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : visibleDbTemplates.length > 0 ||
                visibleCuratedTemplates.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 text-left sm:grid-cols-2 lg:grid-cols-4">
                  {visibleDbTemplates.map((template: any, index: number) => (
                    <button
                      key={template.id}
                      onClick={() =>
                        setLocation(
                          `/editor?template=${template.id}&w=${template.canvasWidth}&h=${template.canvasHeight}`
                        )
                      }
                      className="group"
                    >
                      <div
                        className="relative mb-3 aspect-[3/4] overflow-hidden rounded-2xl border border-border transition-all group-hover:ring-2 group-hover:ring-primary"
                        style={{
                          background: `linear-gradient(135deg, ${templateColors[index % templateColors.length]}22, ${templateColors[index % templateColors.length]}55)`,
                        }}
                      >
                        <div className="flex h-full w-full flex-col items-center justify-center p-5 text-center">
                          <div
                            className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl"
                            style={{
                              background:
                                templateColors[index % templateColors.length],
                            }}
                          >
                            <FileText className="h-5 w-5 text-white" />
                          </div>
                          <p className="text-sm font-semibold text-card-foreground">
                            {template.name}
                          </p>
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            {template.canvasWidth}×{template.canvasHeight}
                          </p>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center bg-primary/0 opacity-0 transition-all group-hover:bg-primary/10 group-hover:opacity-100">
                          <span className="rounded-full bg-background/90 px-3 py-1 text-xs font-medium text-primary">
                            Use Template
                          </span>
                        </div>
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {template.name}
                      </p>
                    </button>
                  ))}

                  {visibleCuratedTemplates.map(template => {
                    const Icon = template.icon;
                    return (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() =>
                          setLocation(
                            `/editor?w=${template.width}&h=${template.height}&preset=custom`
                          )
                        }
                        className="group"
                      >
                        <div
                          className="relative mb-3 aspect-[3/4] overflow-hidden rounded-2xl border border-border p-5 transition-all group-hover:ring-2 group-hover:ring-primary"
                          style={{
                            background: `linear-gradient(145deg, ${template.color}18, ${template.color}55)`,
                          }}
                        >
                          <div className="flex h-full flex-col justify-between">
                            <div
                              className="flex h-12 w-12 items-center justify-center rounded-xl text-white"
                              style={{ background: template.color }}
                            >
                              <Icon className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="text-base font-semibold text-card-foreground">
                                {template.title}
                              </p>
                              <p className="mt-2 text-xs leading-6 text-muted-foreground">
                                {template.subtitle}
                              </p>
                              <p className="mt-3 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                                {template.size}
                              </p>
                            </div>
                          </div>
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          {template.title}
                        </p>
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => setShowAllTemplates(current => !current)}
                    className="group rounded-2xl border border-dashed border-border bg-card/40 p-5 text-left transition-all hover:border-primary/50 hover:bg-primary/5"
                  >
                    <div className="flex h-full min-h-[16rem] flex-col justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <LayoutTemplate className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-base font-semibold text-card-foreground">
                          {showAllTemplates
                            ? "Show Fewer Templates"
                            : "See All Templates"}
                        </p>
                        <p className="mt-2 text-xs leading-6 text-muted-foreground">
                          Browse more homepage categories and expand the current
                          template selection.
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border py-12 text-center">
                  <LayoutTemplate className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">
                    No templates in this category yet
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </section>

        <section>
          <div className="mb-4 flex flex-col items-center justify-between gap-3 text-center md:flex-row md:text-left">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">
                Recent designs
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Your latest customer workspace files stay connected here for
                quick access.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
              >
                <Clock className="mr-1 h-4 w-4" /> Recent
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
              >
                <Star className="mr-1 h-4 w-4" /> Starred
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="bg-transparent"
                onClick={() => navigateToPortal()}
              >
                Customer Portal
              </Button>
            </div>
          </div>

          {projectsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredProjects && filteredProjects.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {filteredProjects.map((project: any) => (
                <div key={project.id} className="group relative">
                  <button
                    onClick={() =>
                      setLocation(
                        `/editor?project=${project.id}&w=${project.canvasWidth}&h=${project.canvasHeight}`
                      )
                    }
                    className="w-full rounded-sm border border-transparent p-1 text-left transition-all hover:border-border"
                  >
                    <div className="mb-2 flex aspect-[4/3] items-center justify-center overflow-hidden rounded-sm border border-border bg-secondary transition-all group-hover:ring-2 group-hover:ring-[oklch(0.78_0.17_75)]/40">
                      {project.thumbnailUrl ? (
                        <img
                          src={project.thumbnailUrl}
                          alt={project.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <FileText className="h-8 w-8 text-muted-foreground/30" />
                      )}
                    </div>
                    <p className="truncate text-sm font-medium text-card-foreground">
                      {project.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {project.canvasWidth}×{project.canvasHeight} ·{" "}
                      {new Date(project.updatedAt).toLocaleDateString()}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Saved to your customer workspace
                    </p>
                  </button>
                  <button
                    onClick={() => handleDeleteProject(project.id)}
                    className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-background/80 opacity-0 transition-opacity hover:bg-destructive hover:text-destructive-foreground group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border py-16 text-center">
              <Folder className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                {q
                  ? `No designs match "${searchQuery}"`
                  : "No designs yet in your customer workspace"}
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="gap-1.5 bg-transparent"
                  onClick={() => navigateToPortal()}
                >
                  Customer Portal
                </Button>
                <Button
                  onClick={() => setLocation("/editor")}
                  className="gap-1.5"
                >
                  <Plus className="h-4 w-4" /> Create your first design
                </Button>
              </div>
            </div>
          )}
        </section>
      </main>

      <SiteFooter />

      <Dialog
        open={!!pendingPreset}
        onOpenChange={open => {
          if (!open) setPendingPreset(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Name your project</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <label className="text-sm text-muted-foreground mb-1.5 block">
              Project name
            </label>
            <Input
              value={newProjectName}
              onChange={e => setNewProjectName(e.target.value)}
              placeholder="e.g. Summer Campaign"
              className="h-10"
              autoFocus
              onKeyDown={e => {
                if (e.key === "Enter") handleCreateProject();
              }}
            />
          </div>

          {pendingPreset?.isCustomSize && (
            <div className="space-y-4 pb-1">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Common sizes (px)</p>
                <div className="grid grid-cols-2 gap-2">
                  {COMMON_CANVAS_SIZES.map(size => {
                    const isSelected =
                      customWidth === String(size.width) &&
                      customHeight === String(size.height);

                    return (
                      <button
                        key={size.key}
                        type="button"
                        onClick={() => applyCommonCanvasSize(size)}
                        className={`rounded-lg border px-3 py-2 text-left transition-colors ${
                          isSelected
                            ? "border-primary bg-primary/10"
                            : "border-border bg-secondary/40 hover:border-primary/50"
                        }`}
                      >
                        <span className="block text-xs font-medium text-foreground">
                          {size.label}
                        </span>
                        <span className="mt-0.5 block text-[11px] text-muted-foreground">
                          {size.width}x{size.height}px
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Width (px)
                  </label>
                  <Input
                    type="number"
                    min={1}
                    value={customWidth}
                    onChange={e => setCustomWidth(e.target.value)}
                    className="h-10"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Height (px)
                  </label>
                  <Input
                    type="number"
                    min={1}
                    value={customHeight}
                    onChange={e => setCustomHeight(e.target.value)}
                    className="h-10"
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPendingPreset(null)}>
              Cancel
            </Button>
            <Button onClick={handleCreateProject}>
              <Plus className="h-4 w-4 mr-1.5" /> Create Design
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LandingPage() {
  return (
    <PageLoadAnimator>
      <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 flex h-16 items-center border-b border-[var(--measurement-line)] bg-[oklch(0.11_0.005_260)]/95 px-6 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg ring-2 ring-[oklch(0.78_0.17_75)]/50 bg-black overflow-hidden">
            <img
              src="/icon-192.png"
              alt="ManuScript Studio logo"
              className="h-full w-full object-contain"
            />
          </div>
          <h1
            className="text-sm font-semibold tracking-[0.18em] uppercase text-foreground"
            style={{ fontFamily: '"Space Grotesk", ui-sans-serif' }}
          >
            ManuScript Studio
          </h1>
        </div>
        <div className="flex-1" />
        <a href={getLoginUrl()} className="action-chip">Get Started</a>
      </header>

      <main>
        <section className="relative overflow-hidden px-6 py-24 md:py-28">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <ParallaxScroll
              intensity={0.2}
              maxOffset={90}
              className="absolute -left-24 top-14"
            >
              <div className="h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
            </ParallaxScroll>
            <ParallaxScroll
              intensity={-0.14}
              maxOffset={80}
              className="absolute right-0 top-36"
            >
              <div className="h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
            </ParallaxScroll>
            <ParallaxScroll
              intensity={0.1}
              maxOffset={70}
              className="absolute left-1/3 top-0"
            >
              <div className="h-48 w-48 rounded-full bg-red-500/10 blur-3xl" />
            </ParallaxScroll>
          </div>

          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="text-left">
            <FlashInElement delay={60}>
              <div className="mb-6 inline-flex items-center gap-2 action-chip">
                <Sparkles className="h-4 w-4" /> AI-Powered Design Platform
              </div>
            </FlashInElement>
            <FlashInElement delay={140}>
              <h1
                className="mb-6 text-5xl font-semibold leading-tight text-foreground md:text-6xl"
                style={{ fontFamily: '"Space Grotesk", ui-sans-serif' }}
              >
                Design anything.
                <br />
                <span className="text-[oklch(0.78_0.17_75)]">Publish everywhere.</span>
              </h1>
            </FlashInElement>
            <FlashInElement delay={220}>
              <p className="mb-8 max-w-2xl text-lg text-muted-foreground">
                A professional design platform with drag-and-drop editing,
                AI-powered tools, royalty-free assets, product mockup support, and
                developer integrations. Create polished visuals in minutes.
              </p>
            </FlashInElement>
            <FlashInElement delay={300}>
              <div className="flex flex-wrap gap-3">
                <a href={getLoginUrl()} className="action-chip gap-2">
                  Start Designing <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </FlashInElement>
            </div>
            <div className="hidden lg:flex items-center justify-center">
              <div className="content-well w-full max-w-sm aspect-square bg-[oklch(0.14_0.006_260)] flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-sm bg-[oklch(0.78_0.17_75)]/10 border border-[oklch(0.78_0.17_75)]/30 flex items-center justify-center">
                    <Palette className="h-8 w-8 text-[oklch(0.78_0.17_75)]" />
                  </div>
                  <p className="text-xs tracking-[0.18em] uppercase text-[oklch(0.55_0.008_75)]">Studio Canvas</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-[oklch(0.14_0.006_260)] px-6 py-20">
          <div className="absolute inset-x-0 top-0 h-px bg-[var(--measurement-line)]" />
          <ParallaxScroll intensity={0.08} maxOffset={40}>
            <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-40 bg-[radial-gradient(circle_at_top,_var(--color-primary-500),_transparent_65%)] opacity-20" />
          </ParallaxScroll>
          <div className="mx-auto max-w-6xl">
            <RevealOnScroll className="mb-12">
              <h2 className="text-center text-3xl font-bold text-foreground" style={{ fontFamily: '"Space Grotesk", ui-sans-serif' }}>
                Everything you need to create
              </h2>
            </RevealOnScroll>
            <RevealOnScroll className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3" yOffset={24}>
              {[
                {
                  icon: Layers,
                  title: "Drag & Drop Editor",
                  desc: "Intuitive canvas with layers, grouping, and precise element control.",
                },
                {
                  icon: Wand2,
                  title: "AI Magic Tools",
                  desc: "Background removal, smart erase, image enhancement, and AI generation.",
                },
                {
                  icon: LayoutTemplate,
                  title: "Template Library",
                  desc: "Expanded templates for menus, invitations, flyers, product promos, and more.",
                },
                {
                  icon: ImageIcon,
                  title: "Asset Database",
                  desc: "Royalty-free photos, icons, shapes, and visual building blocks.",
                },
                {
                  icon: Palette,
                  title: "Brand Kit",
                  desc: "Store colors, fonts, and logos for consistent brand execution.",
                },
                {
                  icon: Bot,
                  title: "AI Assistant",
                  desc: "Conversational AI that helps shape prompts, layouts, and copy.",
                },
                {
                  icon: Download,
                  title: "Multi-Format Export",
                  desc: "Export as PNG, JPG, or PDF in the sizes your workflow needs.",
                },
                {
                  icon: Zap,
                  title: "Workflow Bridge",
                  desc: "Move studio assets cleanly into your connected production flow.",
                },
                {
                  icon: Code2,
                  title: "API Integrations",
                  desc: "Keep integrations on a dedicated page while the homepage stays conversion-focused.",
                },
              ].map((feature, index) => (
                <Card
                  key={index}
                  className="border-border bg-card transition-colors hover:border-primary/50"
                >
                  <CardContent className="p-6">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <feature.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="mb-1.5 text-sm font-semibold text-card-foreground">
                      {feature.title}
                    </h3>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {feature.desc}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </RevealOnScroll>
          </div>
        </section>

        <section className="px-6 py-20">
          <div className="mx-auto max-w-4xl">
            <RevealOnScroll className="mb-12">
              <h2 className="text-center text-3xl font-bold text-foreground">
                How it works
              </h2>
            </RevealOnScroll>
            <RevealOnScroll className="grid grid-cols-1 gap-8 md:grid-cols-3" yOffset={22}>
              {[
                {
                  step: "1",
                  title: "Choose a template",
                  desc: "Browse professional layouts or start from a blank canvas in any size.",
                },
                {
                  step: "2",
                  title: "Customize your design",
                  desc: "Edit text, images, branding, and layout with fast creative controls.",
                },
                {
                  step: "3",
                  title: "Export & share",
                  desc: "Deliver polished assets for social, product listings, print, or presentations.",
                },
              ].map((item, index) => (
                <div key={item.step} className="text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
                    <span className="text-lg font-bold text-primary">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="mb-2 text-sm font-semibold text-foreground">
                    {item.title}
                  </h3>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {item.desc}
                  </p>
                </div>
              ))}
            </RevealOnScroll>
          </div>
        </section>

        <section className="bg-card/50 px-6 py-20">
          <RevealOnScroll className="mx-auto max-w-2xl text-center" yOffset={18}>
            <h2 className="mb-4 text-3xl font-bold text-foreground">
              Ready to create?
            </h2>
            <p className="mb-8 text-muted-foreground">
              Join ManuScript Studio and start building polished digital assets
              with AI-assisted editing and flexible templates.
            </p>
            <Button size="lg" asChild>
              <a href={getLoginUrl()} className="gap-2">
                Get Started Free <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
          </RevealOnScroll>
        </section>
      </main>

      <SiteFooter />
      </div>
    </PageLoadAnimator>
  );
}
