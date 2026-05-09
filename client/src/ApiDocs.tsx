import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  ChevronLeft,
  Code2,
  Copy,
  Check,
  Zap,
  Palette,
  FileText,
  Image as ImageIcon,
  Layers,
  Terminal,
  Sparkles,
  Plug,
  Server,
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function ApiDocs() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <header className="h-14 border-b border-border bg-card flex items-center px-6 sticky top-0 z-50">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground gap-1.5 mr-4"
          onClick={() => setLocation("/")}
        >
          <ChevronLeft className="w-4 h-4" /> Back to Studio
        </Button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <Code2 className="w-4 h-4 text-primary-foreground" />
          </div>
          <h1 className="text-sm font-semibold text-foreground">
            ManuScript Studio API
          </h1>
        </div>
        <div className="flex-1" />
        <span className="text-xs text-muted-foreground px-2 py-0.5 rounded bg-secondary">
          v1.0
        </span>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-3">
            Developer Documentation
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            ManuScript Studio exposes a tRPC-based API that enables programmatic
            control of all design operations. Every action available in the
            visual editor can be performed via the API, making it suitable for
            automation, batch processing, and integration with external tools.
          </p>
        </div>

        <Tabs defaultValue="rest" className="w-full">
          <TabsList className="bg-secondary mb-6">
            <TabsTrigger value="rest" className="gap-1.5">
              <Server className="w-3.5 h-3.5" /> tRPC API
            </TabsTrigger>
            <TabsTrigger value="vscode" className="gap-1.5">
              <Terminal className="w-3.5 h-3.5" /> VS Code Bridge
            </TabsTrigger>
            <TabsTrigger value="automation" className="gap-1.5">
              <Zap className="w-3.5 h-3.5" /> Automation
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rest">
            <div className="grid gap-6">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-sm text-card-foreground flex items-center gap-2">
                    <Plug className="w-4 h-4 text-primary" /> Connection
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    All API calls go through the tRPC endpoint. Authentication
                    uses session cookies from ManuScript OAuth.
                  </p>
                  <CodeBlock
                    code={`// Base URL\nconst BASE = "https://your-app.manuscript.digital/api/trpc";\n\n// tRPC client setup (recommended)\nimport { createTRPCClient, httpBatchLink } from '@trpc/client';\nimport type { AppRouter } from './server/routers';\n\nconst client = createTRPCClient<AppRouter>({\n  links: [\n    httpBatchLink({ url: BASE }),\n  ],\n});`}
                  />
                </CardContent>
              </Card>

              <ApiSection
                icon={FileText}
                title="Projects"
                description="Create, read, update, and delete design projects."
                endpoints={[
                  {
                    method: "QUERY",
                    path: "projects.list",
                    description: "List all projects for the authenticated user",
                    code: `const projects = await client.projects.list.query();\n// Returns: Array<{ id, name, canvasWidth, canvasHeight, canvasData, updatedAt }>`,
                  },
                  {
                    method: "QUERY",
                    path: "projects.get",
                    description: "Get a single project by ID",
                    code: `const project = await client.projects.get.query({ id: 42 });`,
                  },
                  {
                    method: "MUTATION",
                    path: "projects.create",
                    description: "Create a new project",
                    code: `const { id } = await client.projects.create.mutate({\n  name: "My Flyer",\n  canvasWidth: 2550,\n  canvasHeight: 3300,\n  category: "flyer",\n  canvasData: { /* Fabric.js JSON */ },\n});`,
                  },
                  {
                    method: "MUTATION",
                    path: "projects.save",
                    description: "Save canvas data to an existing project",
                    code: `await client.projects.save.mutate({\n  id: 42,\n  canvasData: canvasJSON,\n  thumbnailUrl: "https://cdn.example.com/thumb.png",\n});`,
                  },
                  {
                    method: "MUTATION",
                    path: "projects.delete",
                    description: "Delete a project",
                    code: `await client.projects.delete.mutate({ id: 42 });`,
                  },
                ]}
              />

              <ApiSection
                icon={Layers}
                title="Templates"
                description="Browse and create design templates."
                endpoints={[
                  {
                    method: "QUERY",
                    path: "templates.list",
                    description:
                      "List templates, optionally filtered by category",
                    code: `// All templates\nconst all = await client.templates.list.query();\n\n// Filtered by category\nconst flyers = await client.templates.list.query({\n  category: "flyer"\n});\n// Categories: social-media, flyer, document, presentation, promotional, poster`,
                  },
                  {
                    method: "QUERY",
                    path: "templates.get",
                    description: "Get a single template by ID",
                    code: `const template = await client.templates.get.query({ id: 5 });`,
                  },
                  {
                    method: "MUTATION",
                    path: "templates.create",
                    description: "Create a custom template",
                    code: `const { id } = await client.templates.create.mutate({\n  name: "My Custom Template",\n  category: "social-media",\n  canvasWidth: 1080,\n  canvasHeight: 1080,\n  canvasData: fabricJSON,\n  tags: ["modern", "minimal"],\n});`,
                  },
                ]}
              />

              <ApiSection
                icon={ImageIcon}
                title="Assets & Photos"
                description="Search the royalty-free asset library and manage uploads."
                endpoints={[
                  {
                    method: "QUERY",
                    path: "assets.search",
                    description:
                      "Search the asset library by type, category, or keyword",
                    code: `const icons = await client.assets.search.query({\n  type: "icon",\n  query: "arrow",\n});\n// Types: photo, icon, shape, element, background, pattern`,
                  },
                  {
                    method: "QUERY",
                    path: "assets.searchPhotos",
                    description: "Search curated royalty-free stock photos",
                    code: `const photos = await client.assets.searchPhotos.query({\n  query: "nature"\n});\n// Returns: Array<{ url, thumb, alt, tags }>`,
                  },
                  {
                    method: "MUTATION",
                    path: "uploads.create",
                    description: "Register a user-uploaded file",
                    code: `const { id } = await client.uploads.create.mutate({\n  name: "logo.png",\n  url: "https://cdn.example.com/logo.png",\n  fileKey: "user-123/logo.png",\n  mimeType: "image/png",\n  size: 45000,\n  width: 512,\n  height: 512,\n});`,
                  },
                ]}
              />

              <ApiSection
                icon={Palette}
                title="Brand Kits"
                description="Manage brand colors, fonts, and logos."
                endpoints={[
                  {
                    method: "QUERY",
                    path: "brandKits.list",
                    description:
                      "List all brand kits for the authenticated user",
                    code: `const kits = await client.brandKits.list.query();`,
                  },
                  {
                    method: "MUTATION",
                    path: "brandKits.create",
                    description: "Create a new brand kit",
                    code: `const { id } = await client.brandKits.create.mutate({\n  name: "Acme Corp",\n  colors: [\n    { name: "Primary", hex: "#6366f1" },\n    { name: "Secondary", hex: "#ec4899" },\n  ],\n  fonts: [\n    { name: "Heading", family: "Montserrat" },\n    { name: "Body", family: "Inter" },\n  ],\n  logos: [\n    { name: "Main Logo", url: "https://cdn.example.com/logo.svg" },\n  ],\n});`,
                  },
                  {
                    method: "MUTATION",
                    path: "brandKits.update",
                    description: "Update an existing brand kit",
                    code: `await client.brandKits.update.mutate({\n  id: 1,\n  colors: [\n    { name: "Primary", hex: "#3b82f6" },\n  ],\n});`,
                  },
                ]}
              />

              <ApiSection
                icon={Sparkles}
                title="AI Features"
                description="Generate images, backgrounds, layouts, and chat with the AI assistant."
                endpoints={[
                  {
                    method: "MUTATION",
                    path: "ai.generateImage",
                    description: "Generate a design element from a text prompt",
                    code: `const { url, id } = await client.ai.generateImage.mutate({\n  prompt: "A modern geometric logo in purple and blue",\n});\n// Returns: { url: "https://cdn.../generated.png", id: 42 }`,
                  },
                  {
                    method: "MUTATION",
                    path: "ai.generateBackground",
                    description:
                      "Generate a canvas background from a text prompt",
                    code: `const { url } = await client.ai.generateBackground.mutate({\n  prompt: "Soft gradient with abstract shapes",\n  width: 1920,\n  height: 1080,\n});`,
                  },
                  {
                    method: "MUTATION",
                    path: "ai.suggestLayout",
                    description:
                      "Get AI-generated layout suggestions for a design purpose",
                    code: `const layout = await client.ai.suggestLayout.mutate({\n  purpose: "Business flyer with headline and CTA",\n  canvasWidth: 2550,\n  canvasHeight: 3300,\n});\n// Returns: { elements: [...], description: "..." }`,
                  },
                  {
                    method: "MUTATION",
                    path: "ai.chat",
                    description: "Chat with the AI design assistant",
                    code: `const { response } = await client.ai.chat.mutate({\n  message: "Suggest a color palette for a tech startup",\n  history: [\n    { role: "user", content: "I need help with branding" },\n    { role: "assistant", content: "I'd be happy to help..." },\n  ],\n});`,
                  },
                ]}
              />
            </div>
          </TabsContent>

          <TabsContent value="vscode">
            <div className="grid gap-6">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-sm text-card-foreground flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-primary" /> VS Code
                    Integration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    The ManuScript Studio VS Code extension enables a seamless
                    workflow between design and development. Export designs as
                    optimized assets directly into your project workspace,
                    generate responsive CSS/HTML from your canvas layouts, and
                    use the design system tokens in your code.
                  </p>
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-card-foreground">
                      Installation
                    </h4>
                    <CodeBlock
                      code={`# Install from VS Code Marketplace\ncode --install-extension manuscript.design-studio-bridge\n\n# Or search "ManuScript Studio" in VS Code Extensions`}
                    />
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-card-foreground">
                      Configuration
                    </h4>
                    <CodeBlock
                      code={`// .vscode/settings.json\n{\n  "manuscript.designStudio.apiUrl": "https://your-app.manuscript.digital",\n  "manuscript.designStudio.outputDir": "./src/assets/designs",\n  "manuscript.designStudio.format": "png",\n  "manuscript.designStudio.quality": 0.9,\n  "manuscript.designStudio.generateCSS": true\n}`}
                    />
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-card-foreground">
                      Commands
                    </h4>
                    <CodeBlock
                      code={`// Command Palette (Ctrl+Shift+P)\n> ManuScript: Pull Design Assets     // Download project assets\n> ManuScript: Export Current Design   // Export active design\n> ManuScript: Generate CSS Module     // Create CSS from design tokens\n> ManuScript: Sync Brand Kit          // Pull brand colors/fonts`}
                    />
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-card-foreground">
                      CLI Tool
                    </h4>
                    <CodeBlock
                      code={`# Install the CLI globally\nnpm install -g @manuscript/design-cli\n\n# Export a project\nmanuscript-cli export --project 42 --format png --output ./assets\n\n# Generate CSS variables from a brand kit\nmanuscript-cli brand-kit --id 1 --output ./src/styles/brand.css\n\n# Batch export all projects\nmanuscript-cli export-all --format png --output ./assets/designs`}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="automation">
            <div className="grid gap-6">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-sm text-card-foreground flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" /> System Automation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    The ManuScript Studio API is designed for full automation.
                    Combined with the ManuScript AI platform, every editor
                    action can be performed programmatically, enabling batch
                    processing, workflow automation, and AI-driven design
                    generation at scale.
                  </p>
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-card-foreground">
                      Batch Design Generation
                    </h4>
                    <CodeBlock
                      code={`import { createTRPCClient, httpBatchLink } from '@trpc/client';\n\nconst client = createTRPCClient({\n  links: [httpBatchLink({ url: 'https://your-app.manuscript.digital/api/trpc' })],\n});\n\n// Generate social media variants from a single design\nasync function batchResize(projectId, presets) {\n  const project = await client.projects.get.query({ id: projectId });\n  const canvasData = project.canvasData;\n\n  for (const preset of presets) {\n    const newProject = await client.projects.create.mutate({\n      name: \`\${project.name} - \${preset.label}\`,\n      canvasWidth: preset.width,\n      canvasHeight: preset.height,\n      canvasData: scaleCanvasData(canvasData, preset.width, preset.height),\n    });\n    console.log(\`Created: \${newProject.id} (\${preset.label})\`);\n  }\n}\n\nbatchResize(42, [\n  { label: "Instagram Post", width: 1080, height: 1080 },\n  { label: "Facebook Cover", width: 1200, height: 630 },\n  { label: "Twitter Header", width: 1500, height: 500 },\n]);`}
                    />
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-card-foreground">
                      AI-Driven Workflow
                    </h4>
                    <CodeBlock
                      code={`// Use AI to generate a complete design from a brief\nasync function generateDesignFromBrief(brief) {\n  // Step 1: Get AI layout suggestion\n  const layout = await client.ai.suggestLayout.mutate({\n    purpose: brief,\n    canvasWidth: 1080,\n    canvasHeight: 1080,\n  });\n\n  // Step 2: Create a project with the layout\n  const project = await client.projects.create.mutate({\n    name: brief.substring(0, 50),\n    canvasWidth: 1080,\n    canvasHeight: 1080,\n  });\n\n  // Step 3: Generate AI background\n  const bg = await client.ai.generateBackground.mutate({\n    prompt: \`Background for: \${brief}\`,\n  });\n\n  // Step 4: Generate AI elements\n  const element = await client.ai.generateImage.mutate({\n    prompt: \`Design element for: \${brief}\`,\n  });\n\n  console.log("Design created:", project.id);\n  return project;\n}\n\ngenerateDesignFromBrief("Modern tech startup launch announcement");`}
                    />
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-card-foreground">
                      ManuScript AI Integration
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      The ManuScript platform can control the entire design
                      workflow. Every action available in the UI is also
                      available via the API:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        {
                          title: "Canvas Operations",
                          items: [
                            "Create/load/save projects",
                            "Add/remove/modify elements",
                            "Apply templates",
                          ],
                        },
                        {
                          title: "AI Operations",
                          items: [
                            "Generate images from prompts",
                            "Generate backgrounds",
                            "Get layout suggestions",
                            "Chat with AI assistant",
                          ],
                        },
                        {
                          title: "Asset Management",
                          items: [
                            "Search stock photos",
                            "Upload custom assets",
                            "Manage brand kits",
                          ],
                        },
                        {
                          title: "Export & Deploy",
                          items: [
                            "Export as PNG/JPG/PDF",
                            "Batch export multiple sizes",
                            "VS Code integration",
                            "CI/CD pipeline support",
                          ],
                        },
                      ].map(group => (
                        <div
                          key={group.title}
                          className="bg-background border border-border rounded-lg p-3"
                        >
                          <h5 className="text-xs font-semibold text-card-foreground mb-2">
                            {group.title}
                          </h5>
                          <ul className="space-y-1">
                            {group.items.map(item => (
                              <li
                                key={item}
                                className="text-[11px] text-muted-foreground flex items-center gap-1.5"
                              >
                                <span className="w-1 h-1 rounded-full bg-primary shrink-0" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────

function ApiSection({
  icon: Icon,
  title,
  description,
  endpoints,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  endpoints: Array<{
    method: string;
    path: string;
    description: string;
    code: string;
  }>;
}) {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-sm text-card-foreground flex items-center gap-2">
          <Icon className="w-4 h-4 text-primary" /> {title}
        </CardTitle>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {endpoints.map((ep, i) => (
          <div key={i} className="space-y-2">
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${ep.method === "QUERY" ? "bg-green-500/20 text-green-400" : "bg-blue-500/20 text-blue-400"}`}
              >
                {ep.method}
              </span>
              <code className="text-xs text-card-foreground font-mono">
                {ep.path}
              </code>
            </div>
            <p className="text-xs text-muted-foreground">{ep.description}</p>
            <CodeBlock code={ep.code} />
            {i < endpoints.length - 1 && <Separator className="mt-3" />}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="relative group">
      <pre className="bg-background border border-border rounded-lg p-3 text-xs text-card-foreground overflow-x-auto font-mono leading-relaxed">
        <code>{code}</code>
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 w-7 h-7 rounded-md bg-secondary border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {copied ? (
          <Check className="w-3 h-3 text-green-400" />
        ) : (
          <Copy className="w-3 h-3 text-muted-foreground" />
        )}
      </button>
    </div>
  );
}
