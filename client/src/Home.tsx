import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Plus, Search, LayoutTemplate, FileText, Image as ImageIcon,
  Presentation, Star, Clock, Folder, Sparkles, Palette,
  ArrowRight, Zap, Layers, Wand2, Code2, Bot, Download,
  Trash2, MoreHorizontal, Loader2
} from "lucide-react";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { useState, useMemo } from "react";
import { CANVAS_PRESETS } from "@shared/designTypes";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  if (!isAuthenticated && !loading) {
    return <LandingPage />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return <Dashboard user={user} searchQuery={searchQuery} setSearchQuery={setSearchQuery} setLocation={setLocation} />;
}

// ─── Dashboard ───────────────────────────────────────────────
function Dashboard({ user, searchQuery, setSearchQuery, setLocation }: {
  user: any;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  setLocation: (path: string) => void;
}) {
  const { data: myProjects, isLoading: projectsLoading, refetch: refetchProjects } = trpc.projects.list.useQuery();
  const { data: dbTemplates, isLoading: templatesLoading } = trpc.templates.list.useQuery(undefined);
  const deleteMutation = trpc.projects.delete.useMutation();
  const [activeTab, setActiveTab] = useState("all");

  const filteredTemplates = useMemo(() => {
    if (!dbTemplates) return [];
    if (activeTab === "all") return dbTemplates;
    return dbTemplates.filter((t: any) => t.category === activeTab);
  }, [dbTemplates, activeTab]);

  const handleDeleteProject = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ id });
      refetchProjects();
      toast.success("Project deleted");
    } catch {
      toast.error("Failed to delete project");
    }
  };

  const templateColors = ["#6366f1", "#ec4899", "#14b8a6", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#22c55e", "#f97316", "#64748b"];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="h-14 border-b border-border bg-card flex items-center px-6 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Palette className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="text-base font-semibold text-foreground">Manus Design Studio</h1>
        </div>
        <div className="flex-1 max-w-md mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search designs, templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 bg-secondary border-border"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setLocation("/api-docs")}>
            <Code2 className="w-4 h-4 mr-1.5" /> API
          </Button>
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium text-primary">
            {user?.name?.[0] || "U"}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Create New Section */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-foreground mb-4">Create a design</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {Object.entries(CANVAS_PRESETS).filter(([k]) => k !== "custom").slice(0, 8).map(([key, preset]) => (
              <button
                key={key}
                onClick={() => setLocation(`/editor?w=${preset.width}&h=${preset.height}&preset=${key}`)}
                className="flex flex-col items-center gap-2 shrink-0 group"
              >
                <div className="w-24 h-24 rounded-xl bg-secondary border border-border flex items-center justify-center group-hover:border-primary group-hover:bg-primary/5 transition-all">
                  <Plus className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors whitespace-nowrap">
                  {preset.label}
                </span>
              </button>
            ))}
            <button
              onClick={() => setLocation("/editor?w=1080&h=1080&preset=custom")}
              className="flex flex-col items-center gap-2 shrink-0 group"
            >
              <div className="w-24 h-24 rounded-xl border-2 border-dashed border-border flex items-center justify-center group-hover:border-primary transition-all">
                <Plus className="w-6 h-6 text-muted-foreground group-hover:text-primary" />
              </div>
              <span className="text-xs text-muted-foreground group-hover:text-foreground">Custom Size</span>
            </button>
          </div>
        </section>

        {/* Template Categories */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Start from a template</h2>
            <span className="text-xs text-muted-foreground">
              {dbTemplates?.length || 0} templates available
            </span>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-secondary mb-4 flex-wrap h-auto gap-1">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="menu">Menus</TabsTrigger>
              <TabsTrigger value="invitation">Invitations</TabsTrigger>
              <TabsTrigger value="certificate">Certificates</TabsTrigger>
              <TabsTrigger value="social-media">Social Media</TabsTrigger>
              <TabsTrigger value="flyer">Flyers</TabsTrigger>
              <TabsTrigger value="document">Documents</TabsTrigger>
              <TabsTrigger value="presentation">Presentations</TabsTrigger>
              <TabsTrigger value="promotional">Promotional</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-0">
              {templatesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredTemplates.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {filteredTemplates.map((template: any, i: number) => (
                    <button
                      key={template.id}
                      onClick={() => setLocation(`/editor?template=${template.id}&w=${template.canvasWidth}&h=${template.canvasHeight}`)}
                      className="group text-left"
                    >
                      <div
                        className="aspect-[3/4] rounded-xl overflow-hidden border border-border group-hover:ring-2 group-hover:ring-primary transition-all mb-2 relative"
                        style={{
                          background: `linear-gradient(135deg, ${templateColors[i % templateColors.length]}22, ${templateColors[i % templateColors.length]}55)`,
                        }}
                      >
                        <div className="w-full h-full flex flex-col items-center justify-center p-4">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-2" style={{ background: templateColors[i % templateColors.length] }}>
                            <FileText className="w-5 h-5 text-white" />
                          </div>
                          <p className="text-xs font-medium text-card-foreground text-center leading-tight">{template.name}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">{template.canvasWidth}x{template.canvasHeight}</p>
                        </div>
                        <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <span className="text-xs font-medium text-primary bg-background/80 px-2 py-1 rounded">Use Template</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{template.name}</p>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border border-dashed border-border rounded-xl">
                  <LayoutTemplate className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">No templates in this category</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </section>

        {/* Recent Designs */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Recent designs</h2>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                <Clock className="w-4 h-4 mr-1" /> Recent
              </Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                <Star className="w-4 h-4 mr-1" /> Starred
              </Button>
            </div>
          </div>

          {projectsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : myProjects && myProjects.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {myProjects.map((project: any) => (
                <div key={project.id} className="group relative">
                  <button
                    onClick={() => setLocation(`/editor?project=${project.id}&w=${project.canvasWidth}&h=${project.canvasHeight}`)}
                    className="w-full text-left"
                  >
                    <div className="aspect-[4/3] rounded-xl overflow-hidden border border-border group-hover:ring-2 group-hover:ring-primary transition-all mb-2 bg-secondary flex items-center justify-center">
                      {project.thumbnailUrl ? (
                        <img src={project.thumbnailUrl} alt={project.name} className="w-full h-full object-cover" />
                      ) : (
                        <FileText className="w-8 h-8 text-muted-foreground/30" />
                      )}
                    </div>
                    <p className="text-xs font-medium text-card-foreground truncate">{project.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {project.canvasWidth}x{project.canvasHeight} &middot; {new Date(project.updatedAt).toLocaleDateString()}
                    </p>
                  </button>
                  <button
                    onClick={() => handleDeleteProject(project.id)}
                    className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-background/80 border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 border border-dashed border-border rounded-xl">
              <Folder className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground mb-3">No designs yet</p>
              <Button onClick={() => setLocation("/editor")} className="gap-1.5">
                <Plus className="w-4 h-4" /> Create your first design
              </Button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

// ─── Landing Page ────────────────────────────────────────────
function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="h-16 border-b border-border bg-card/80 backdrop-blur-sm flex items-center px-6 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Palette className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="text-lg font-bold text-foreground">Manus Design Studio</h1>
        </div>
        <div className="flex-1" />
        <Button asChild>
          <a href={getLoginUrl()}>Get Started</a>
        </Button>
      </header>

      <main>
        {/* Hero Section */}
        <section className="py-24 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm mb-6">
              <Sparkles className="w-4 h-4" /> AI-Powered Design Platform
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              Design anything.
              <br />
              <span className="text-primary">Publish everywhere.</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              A professional design platform with drag-and-drop editing, AI-powered tools,
              royalty-free assets, and developer integrations. Create stunning visuals in minutes.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Button size="lg" asChild>
                <a href={getLoginUrl()} className="gap-2">
                  Start Designing <ArrowRight className="w-4 h-4" />
                </a>
              </Button>
              <Button size="lg" variant="outline" className="gap-2 bg-transparent" asChild>
                <a href="/api-docs">
                  <Code2 className="w-4 h-4" /> View API Docs
                </a>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 px-6 bg-card/50">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-foreground mb-12">
              Everything you need to create
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: Layers, title: "Drag & Drop Editor", desc: "Intuitive canvas with layers, grouping, and precise element control." },
                { icon: Wand2, title: "AI Magic Tools", desc: "Background removal, smart erase, image enhancement, and AI generation." },
                { icon: LayoutTemplate, title: "Template Library", desc: "107+ templates for menus, invitations, certificates, social media, flyers, and more." },
                { icon: ImageIcon, title: "Asset Database", desc: "Royalty-free photos, icons, shapes, and design elements." },
                { icon: Palette, title: "Brand Kit", desc: "Store your colors, fonts, and logos for consistent branding." },
                { icon: Bot, title: "AI Assistant", desc: "Conversational AI that suggests layouts and generates copy." },
                { icon: Download, title: "Multi-Format Export", desc: "Export as PNG, JPG, or PDF in any size or resolution." },
                { icon: Zap, title: "VS Code Bridge", desc: "Export designs directly into your development environment." },
                { icon: Code2, title: "Manus API", desc: "Programmatic control of all editor actions via REST API." },
              ].map((feature, i) => (
                <Card key={i} className="bg-card border-border hover:border-primary/50 transition-colors">
                  <CardContent className="p-6">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <feature.icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="text-sm font-semibold text-card-foreground mb-1.5">{feature.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{feature.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-foreground mb-12">How it works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { step: "1", title: "Choose a template", desc: "Browse professional templates or start from a blank canvas in any size." },
                { step: "2", title: "Customize your design", desc: "Drag and drop elements, add text, images, and use AI tools to create." },
                { step: "3", title: "Export & share", desc: "Download in PNG, JPG, or PDF. Use the API to automate workflows." },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                    <span className="text-lg font-bold text-primary">{item.step}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-6 bg-card/50">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-foreground mb-4">Ready to create?</h2>
            <p className="text-muted-foreground mb-8">
              Join Manus Design Studio and start creating professional designs with AI-powered tools.
            </p>
            <Button size="lg" asChild>
              <a href={getLoginUrl()} className="gap-2">
                Get Started Free <ArrowRight className="w-4 h-4" />
              </a>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Manus Design Studio</p>
          <p className="text-xs text-muted-foreground">Powered by Manus AI</p>
        </div>
      </footer>
    </div>
  );
}
