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
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { useMemo, useState } from "react";
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
  { key: "instagram-story", label: "Instagram Story", width: 1080, height: 1920 },
  { key: "facebook-post", label: "Facebook Post", width: 1200, height: 630 },
  { key: "facebook-story", label: "Facebook Story", width: 1080, height: 1920 },
  { key: "pinterest-pin", label: "Pinterest Pin", width: 1000, height: 1500 },
  { key: "x-post", label: "Twitter/X Post", width: 1600, height: 900 },
  { key: "youtube-thumbnail", label: "YouTube Thumbnail", width: 1280, height: 720 },
  { key: "linkedin-post", label: "LinkedIn Post", width: 1200, height: 627 },
  { key: "flyer-letter", label: "Flyer (Letter)", width: 2550, height: 3300 },
  { key: "flyer-a4", label: "Flyer (A4)", width: 2480, height: 3508 },
  { key: "menu", label: "Menu", width: 1080, height: 1920 },
  { key: "presentation", label: "Presentation", width: 1920, height: 1080 },
  { key: "business-card", label: "Business Card", width: 1050, height: 600 },
  { key: "poster", label: "Poster", width: 2400, height: 3600 },
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
  { key: "terms-of-service", title: "Terms of Service", href: "/terms-of-service" },
  { key: "refund-return-policy", title: "Refund / Return Policy", href: "/refund-policy" },
] as const;

function matchesTemplateCategory(template: any, activeTab: string) {
  if (activeTab === "all") return true;

  const haystack = `${template?.category || ""} ${template?.name || ""}`.toLowerCase();
  const matchers: Record<string, string[]> = {
    "social-media": ["social", "instagram", "facebook", "pinterest", "linkedin", "youtube", "post"],
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

  return (matchers[activeTab] || []).some((term) => haystack.includes(term));
}

function SiteFooter() {
  const [, setLocation] = useLocation();

  return (
    <footer className="mt-16 border-t border-border bg-card/50 px-6 py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-foreground" style={{ fontFamily: '"Cinzel Decorative", serif' }}>
            ManuScript Studio
          </p>
          <p className="mt-2 max-w-xl text-xs leading-6 text-muted-foreground">
            Custom image editing, templates, branding systems, listing mockups, and digital marketing assets in one studio workspace.
          </p>
        </div>
        <nav className="flex flex-wrap items-center gap-2 md:justify-end">
          {FOOTER_LINKS.map((link) => (
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
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <Dashboard user={user} searchQuery={searchQuery} setSearchQuery={setSearchQuery} setLocation={setLocation} />;
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
  const { data: myProjects, isLoading: projectsLoading, refetch: refetchProjects } = trpc.projects.list.useQuery();
  const { data: dbTemplates, isLoading: templatesLoading } = trpc.templates.list.useQuery(undefined);
  const deleteMutation = trpc.projects.delete.useMutation();
  const [activeTab, setActiveTab] = useState("all");
  const [aiSearchEnabled, setAiSearchEnabled] = useState(false);
  const [showAllPresets, setShowAllPresets] = useState(false);
  const [showAllTemplates, setShowAllTemplates] = useState(false);

  const filteredTemplates = useMemo(() => {
    const templates = dbTemplates || [];
    return templates.filter((template: any) => matchesTemplateCategory(template, activeTab));
  }, [dbTemplates, activeTab]);

  const visiblePresets = useMemo(
    () => (showAllPresets ? DESIGN_PRESETS : DESIGN_PRESETS.slice(0, 10)),
    [showAllPresets],
  );

  const visibleCuratedTemplates = useMemo(() => {
    const matches = CURATED_TEMPLATE_IDEAS.filter(
      (template) => activeTab === "all" || template.categories.includes(activeTab),
    );
    return showAllTemplates ? matches : matches.slice(0, 2);
  }, [activeTab, showAllTemplates]);

  const visibleDbTemplates = useMemo(
    () => (showAllTemplates ? filteredTemplates.slice(0, 10) : filteredTemplates.slice(0, 6)),
    [filteredTemplates, showAllTemplates],
  );

  const handleDeleteProject = async (id: string) => {
    try {
      await deleteMutation.mutateAsync({ id });
      refetchProjects();
      toast.success("Project deleted");
    } catch {
      toast.error("Failed to delete project");
    }
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
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 px-6 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-7xl items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-md ring-2 ring-red-700/60 bg-black overflow-hidden">
  <img
    src="/MANUSCRIPT-STUDIO-NEWLOGO.png"
    alt="ManuScript Studio logo"
    className="h-full w-full object-cover"
  />
</div>
            <h1
              className="hidden uppercase tracking-[0.12em] text-foreground sm:inline-flex"
              style={{ fontSize: "18px", fontWeight: 700, fontFamily: '"Cinzel Decorative", serif' }}
            >
              ManuScript Studio
            </h1>
          </div>

          <div className="mx-auto flex w-full max-w-2xl items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={aiSearchEnabled ? "What are you trying to make with AI?" : "What are you trying to make?"}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 border-border bg-secondary pl-9"
              />
            </div>
            <Button
              type="button"
              variant={aiSearchEnabled ? "default" : "outline"}
              className="h-10 gap-2 bg-transparent"
              onClick={() => setAiSearchEnabled((current) => !current)}
            >
              <Sparkles className="h-4 w-4" /> {aiSearchEnabled ? "AI On" : "AI"}
            </Button>
          </div>

          <Button
            type="button"
            variant="ghost"
            className="h-10 gap-2 rounded-full border border-transparent px-2 hover:border-border"
            onClick={() => setLocation("/")}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-sm font-medium text-primary">
              {user?.name?.[0] || "U"}
            </div>
            <span className="hidden text-xs font-medium text-foreground lg:inline">Customer Dashboard</span>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <section className="mb-12 text-center">
          <div className="mx-auto mb-6 max-w-3xl">
            <h2 className="text-2xl font-semibold text-foreground">Create a design</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Start faster with the most-requested social, print, product, and marketing canvas sizes.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
            {visiblePresets.map((preset) => (
              <button
                key={preset.key}
                onClick={() => setLocation(`/editor?w=${preset.width}&h=${preset.height}&preset=custom`)}
                className="group flex flex-col items-center gap-3 rounded-2xl border border-border bg-card/60 p-4 text-center transition-all hover:border-primary/50 hover:bg-primary/5"
              >
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-border bg-secondary transition-all group-hover:border-primary/50">
                  <Plus className="h-6 w-6 text-muted-foreground transition-colors group-hover:text-primary" />
                </div>
                <div>
                  <span className="block text-xs font-medium text-foreground">{preset.label}</span>
                  <span className="mt-1 block text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                    {preset.width}×{preset.height}
                  </span>
                </div>
              </button>
            ))}

            <button
              onClick={() => setLocation("/editor?w=1080&h=1080&preset=custom")}
              className="group flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-border bg-card/40 p-4 text-center transition-all hover:border-primary/50 hover:bg-primary/5"
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-dashed border-border transition-all group-hover:border-primary/50">
                <Plus className="h-6 w-6 text-muted-foreground group-hover:text-primary" />
              </div>
              <div>
                <span className="block text-xs font-medium text-foreground">Custom Size</span>
                <span className="mt-1 block text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Open editor</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setShowAllPresets((current) => !current)}
              className="group flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card/60 p-4 text-center transition-all hover:border-primary/50 hover:bg-primary/5"
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <LayoutTemplate className="h-6 w-6" />
              </div>
              <div>
                <span className="block text-xs font-medium text-foreground">{showAllPresets ? "Show Fewer" : "View More"}</span>
                <span className="mt-1 block text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                  More preset sizes
                </span>
              </div>
            </button>
          </div>
        </section>

        <section className="mb-12 text-center">
          <div className="mx-auto mb-6 max-w-3xl">
            <h2 className="text-2xl font-semibold text-foreground">Start from a template</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Explore broader categories inspired by modern template libraries, then jump into a ready-made layout.
            </p>
            <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">
              {(dbTemplates?.length || 0) + CURATED_TEMPLATE_IDEAS.length} homepage-ready options
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex justify-center">
              <ScrollArea className="w-full max-w-6xl whitespace-nowrap">
                <TabsList className="mb-6 inline-flex h-auto flex-nowrap gap-1 bg-secondary p-1">
                  {TEMPLATE_CATEGORIES.map((category) => (
                    <TabsTrigger key={category.value} value={category.value} className="px-4">
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
              ) : visibleDbTemplates.length > 0 || visibleCuratedTemplates.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 text-left sm:grid-cols-2 lg:grid-cols-4">
                  {visibleDbTemplates.map((template: any, index: number) => (
                    <button
                      key={template.id}
                      onClick={() =>
                        setLocation(`/editor?template=${template.id}&w=${template.canvasWidth}&h=${template.canvasHeight}`)
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
                            style={{ background: templateColors[index % templateColors.length] }}
                          >
                            <FileText className="h-5 w-5 text-white" />
                          </div>
                          <p className="text-sm font-semibold text-card-foreground">{template.name}</p>
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
                      <p className="truncate text-xs text-muted-foreground">{template.name}</p>
                    </button>
                  ))}

                  {visibleCuratedTemplates.map((template) => {
                    const Icon = template.icon;
                    return (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => setLocation(`/editor?w=${template.width}&h=${template.height}&preset=custom`)}
                        className="group"
                      >
                        <div
                          className="relative mb-3 aspect-[3/4] overflow-hidden rounded-2xl border border-border p-5 transition-all group-hover:ring-2 group-hover:ring-primary"
                          style={{ background: `linear-gradient(145deg, ${template.color}18, ${template.color}55)` }}
                        >
                          <div className="flex h-full flex-col justify-between">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl text-white" style={{ background: template.color }}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="text-base font-semibold text-card-foreground">{template.title}</p>
                              <p className="mt-2 text-xs leading-6 text-muted-foreground">{template.subtitle}</p>
                              <p className="mt-3 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{template.size}</p>
                            </div>
                          </div>
                        </div>
                        <p className="truncate text-xs text-muted-foreground">{template.title}</p>
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => setShowAllTemplates((current) => !current)}
                    className="group rounded-2xl border border-dashed border-border bg-card/40 p-5 text-left transition-all hover:border-primary/50 hover:bg-primary/5"
                  >
                    <div className="flex h-full min-h-[16rem] flex-col justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <LayoutTemplate className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-base font-semibold text-card-foreground">
                          {showAllTemplates ? "Show Fewer Templates" : "See All Templates"}
                        </p>
                        <p className="mt-2 text-xs leading-6 text-muted-foreground">
                          Browse more homepage categories and expand the current template selection.
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border py-12 text-center">
                  <LayoutTemplate className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">No templates in this category yet</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </section>

        <section>
          <div className="mb-4 flex flex-col items-center justify-between gap-3 text-center md:flex-row md:text-left">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">Recent designs</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Your latest customer workspace files stay connected here for quick access.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                <Clock className="mr-1 h-4 w-4" /> Recent
              </Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                <Star className="mr-1 h-4 w-4" /> Starred
              </Button>
              <Button type="button" variant="outline" size="sm" className="bg-transparent" onClick={() => setLocation("/")}>
                Customer Dashboard
              </Button>
            </div>
          </div>

          {projectsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : myProjects && myProjects.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {myProjects.map((project: any) => (
                <div key={project.id} className="group relative">
                  <button
                    onClick={() => setLocation(`/editor?project=${project.id}&w=${project.canvasWidth}&h=${project.canvasHeight}`)}
                    className="w-full rounded-2xl border border-transparent p-1 text-left transition-all hover:border-border"
                  >
                    <div className="mb-2 flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl border border-border bg-secondary transition-all group-hover:ring-2 group-hover:ring-primary">
                      {project.thumbnailUrl ? (
                        <img src={project.thumbnailUrl} alt={project.name} className="h-full w-full object-cover" />
                      ) : (
                        <FileText className="h-8 w-8 text-muted-foreground/30" />
                      )}
                    </div>
                    <p className="truncate text-sm font-medium text-card-foreground">{project.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {project.canvasWidth}×{project.canvasHeight} · {new Date(project.updatedAt).toLocaleDateString()}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">Saved to your customer workspace</p>
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
              <p className="text-sm text-muted-foreground">No designs yet in your customer workspace</p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <Button type="button" variant="outline" className="gap-1.5 bg-transparent" onClick={() => setLocation("/")}>
                  Customer Dashboard
                </Button>
                <Button onClick={() => setLocation("/editor")} className="gap-1.5">
                  <Plus className="h-4 w-4" /> Create your first design
                </Button>
              </div>
            </div>
          )}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 flex h-16 items-center border-b border-border bg-card/80 px-6 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg ring-2 ring-red-700/60 bg-black overflow-hidden">
  <img
    src="/MANUSCRIPT-STUDIO-NEWLOGO.png"
    alt="ManuScript Studio logo"
    className="h-full w-full object-cover"
  />
</div>
          <h1 className="text-lg font-bold uppercase tracking-[0.08em] text-foreground" style={{ fontFamily: '"Cinzel Decorative", serif' }}>
            ManuScript Studio
          </h1>
        </div>
        <div className="flex-1" />
        <Button asChild>
          <a href={getLoginUrl()}>Get Started</a>
        </Button>
      </header>

      <main>
        <section className="px-6 py-24">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
              <Sparkles className="h-4 w-4" /> AI-Powered Design Platform
            </div>
            <h1 className="mb-6 text-5xl font-bold leading-tight text-foreground md:text-6xl">
              Design anything.
              <br />
              <span className="text-primary">Publish everywhere.</span>
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
              A professional design platform with drag-and-drop editing, AI-powered tools, royalty-free assets,
              product mockup support, and developer integrations. Create polished visuals in minutes.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button size="lg" asChild>
                <a href={getLoginUrl()} className="gap-2">
                  Start Designing <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
              <Button size="lg" variant="outline" className="gap-2 bg-transparent" asChild>
                <a href="/api-docs">
                  <Code2 className="h-4 w-4" /> View API Docs
                </a>
              </Button>
            </div>
          </div>
        </section>

        <section className="bg-card/50 px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-12 text-center text-3xl font-bold text-foreground">Everything you need to create</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[
                { icon: Layers, title: "Drag & Drop Editor", desc: "Intuitive canvas with layers, grouping, and precise element control." },
                { icon: Wand2, title: "AI Magic Tools", desc: "Background removal, smart erase, image enhancement, and AI generation." },
                { icon: LayoutTemplate, title: "Template Library", desc: "Expanded templates for menus, invitations, flyers, product promos, and more." },
                { icon: ImageIcon, title: "Asset Database", desc: "Royalty-free photos, icons, shapes, and visual building blocks." },
                { icon: Palette, title: "Brand Kit", desc: "Store colors, fonts, and logos for consistent brand execution." },
                { icon: Bot, title: "AI Assistant", desc: "Conversational AI that helps shape prompts, layouts, and copy." },
                { icon: Download, title: "Multi-Format Export", desc: "Export as PNG, JPG, or PDF in the sizes your workflow needs." },
                { icon: Zap, title: "Workflow Bridge", desc: "Move studio assets cleanly into your connected production flow." },
                { icon: Code2, title: "API Integrations", desc: "Keep integrations on a dedicated page while the homepage stays conversion-focused." },
              ].map((feature, index) => (
                <Card key={index} className="border-border bg-card transition-colors hover:border-primary/50">
                  <CardContent className="p-6">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <feature.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="mb-1.5 text-sm font-semibold text-card-foreground">{feature.title}</h3>
                    <p className="text-xs leading-relaxed text-muted-foreground">{feature.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-20">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-12 text-center text-3xl font-bold text-foreground">How it works</h2>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {[
                { step: "1", title: "Choose a template", desc: "Browse professional layouts or start from a blank canvas in any size." },
                { step: "2", title: "Customize your design", desc: "Edit text, images, branding, and layout with fast creative controls." },
                { step: "3", title: "Export & share", desc: "Deliver polished assets for social, product listings, print, or presentations." },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
                    <span className="text-lg font-bold text-primary">{item.step}</span>
                  </div>
                  <h3 className="mb-2 text-sm font-semibold text-foreground">{item.title}</h3>
                  <p className="text-xs leading-relaxed text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-card/50 px-6 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground">Ready to create?</h2>
            <p className="mb-8 text-muted-foreground">
              Join ManuScript Studio and start building polished digital assets with AI-assisted editing and flexible templates.
            </p>
            <Button size="lg" asChild>
              <a href={getLoginUrl()} className="gap-2">
                Get Started Free <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
