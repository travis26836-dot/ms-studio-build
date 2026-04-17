import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Instagram, Facebook, Twitter, Youtube, Linkedin, FileText,
  Presentation, Image as ImageIcon, Plus, ArrowRight
} from "lucide-react";
import { useLocation } from "wouter";
import { CANVAS_PRESETS } from "@shared/designTypes";

interface NewProjectDialogProps {
  children: React.ReactNode;
}

export default function NewProjectDialog({ children }: NewProjectDialogProps) {
  const [, setLocation] = useLocation();
  const [customWidth, setCustomWidth] = useState("1080");
  const [customHeight, setCustomHeight] = useState("1080");
  const [open, setOpen] = useState(false);

  const presetGroups = {
    "Social Media": [
      { key: "instagram-post", icon: Instagram },
      { key: "instagram-story", icon: Instagram },
      { key: "facebook-post", icon: Facebook },
      { key: "twitter-post", icon: Twitter },
      { key: "youtube-thumbnail", icon: Youtube },
      { key: "linkedin-post", icon: Linkedin },
    ],
    "Print": [
      { key: "flyer-letter", icon: FileText },
      { key: "flyer-a4", icon: FileText },
      { key: "poster-18x24", icon: ImageIcon },
      { key: "business-card", icon: FileText },
    ],
    "Other": [
      { key: "presentation-16-9", icon: Presentation },
      { key: "document-letter", icon: FileText },
    ],
  };

  const startProject = (w: number, h: number, preset: string) => {
    setOpen(false);
    setLocation(`/editor?w=${w}&h=${h}&preset=${preset}`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-card-foreground">Create New Design</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="presets" className="w-full">
          <TabsList className="bg-secondary w-full">
            <TabsTrigger value="presets" className="flex-1">Presets</TabsTrigger>
            <TabsTrigger value="custom" className="flex-1">Custom Size</TabsTrigger>
          </TabsList>

          <TabsContent value="presets" className="mt-4">
            <ScrollArea className="h-[350px]">
              <div className="space-y-5">
                {Object.entries(presetGroups).map(([group, presets]) => (
                  <div key={group}>
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">{group}</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {presets.map(({ key, icon: Icon }) => {
                        const preset = CANVAS_PRESETS[key];
                        if (!preset) return null;
                        return (
                          <button
                            key={key}
                            onClick={() => startProject(preset.width, preset.height, key)}
                            className="flex items-center gap-3 p-3 rounded-lg bg-secondary hover:bg-accent border border-border transition-colors text-left group"
                          >
                            <div className="w-9 h-9 rounded-lg bg-background flex items-center justify-center shrink-0">
                              <Icon className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-card-foreground truncate">{preset.label}</p>
                              <p className="text-[10px] text-muted-foreground">{preset.width} x {preset.height} px</p>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="custom" className="mt-4">
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Width (px)</Label>
                  <Input
                    type="number"
                    value={customWidth}
                    onChange={(e) => setCustomWidth(e.target.value)}
                    min={1}
                    max={10000}
                    className="bg-secondary"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Height (px)</Label>
                  <Input
                    type="number"
                    value={customHeight}
                    onChange={(e) => setCustomHeight(e.target.value)}
                    min={1}
                    max={10000}
                    className="bg-secondary"
                  />
                </div>
              </div>

              <div className="bg-secondary rounded-lg p-4 text-center">
                <div
                  className="mx-auto border-2 border-dashed border-border rounded-md flex items-center justify-center"
                  style={{
                    width: Math.min(200, 200),
                    height: Math.min(200, 200 * (parseInt(customHeight) / parseInt(customWidth) || 1)),
                    maxHeight: 200,
                  }}
                >
                  <span className="text-[10px] text-muted-foreground">
                    {customWidth} x {customHeight}
                  </span>
                </div>
              </div>

              <Button
                className="w-full gap-2"
                onClick={() => startProject(parseInt(customWidth) || 1080, parseInt(customHeight) || 1080, "custom")}
              >
                <Plus className="w-4 h-4" />
                Create Design
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
