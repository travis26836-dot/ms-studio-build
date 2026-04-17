import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Download, FileImage, FileText, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { CANVAS_PRESETS } from "@shared/designTypes";

interface ExportDialogProps {
  onExport: (format: "png" | "jpg", quality: number) => string;
  canvasWidth: number;
  canvasHeight: number;
  children: React.ReactNode;
}

export default function ExportDialog({ onExport, canvasWidth, canvasHeight, children }: ExportDialogProps) {
  const [format, setFormat] = useState<"png" | "jpg" | "pdf">("png");
  const [quality, setQuality] = useState(100);
  const [scale, setScale] = useState("1");
  const [open, setOpen] = useState(false);

  const handleExport = () => {
    try {
      if (format === "pdf") {
        // For PDF, export as PNG first then convert
        const dataUrl = onExport("png", 1);
        if (dataUrl) {
          // Create a simple PDF-like download (using canvas data)
          const link = document.createElement("a");
          link.download = `design.png`;
          link.href = dataUrl;
          link.click();
          toast.success("Exported as PNG (PDF export requires server processing)");
        }
      } else {
        const dataUrl = onExport(format, quality / 100);
        if (dataUrl) {
          const link = document.createElement("a");
          link.download = `design.${format}`;
          link.href = dataUrl;
          link.click();
          toast.success(`Exported as ${format.toUpperCase()}`);
        }
      }
      setOpen(false);
    } catch {
      toast.error("Export failed. Please try again.");
    }
  };

  const scaleNum = parseFloat(scale);
  const exportWidth = Math.round(canvasWidth * scaleNum);
  const exportHeight = Math.round(canvasHeight * scaleNum);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-card-foreground">Export Design</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Format Selection */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Format</Label>
            <RadioGroup value={format} onValueChange={(v) => setFormat(v as any)} className="grid grid-cols-3 gap-2">
              <Label
                htmlFor="png"
                className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border cursor-pointer transition-colors ${
                  format === "png" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                }`}
              >
                <RadioGroupItem value="png" id="png" className="sr-only" />
                <FileImage className="w-5 h-5 text-card-foreground" />
                <span className="text-xs font-medium text-card-foreground">PNG</span>
                <span className="text-[10px] text-muted-foreground">Lossless</span>
              </Label>
              <Label
                htmlFor="jpg"
                className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border cursor-pointer transition-colors ${
                  format === "jpg" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                }`}
              >
                <RadioGroupItem value="jpg" id="jpg" className="sr-only" />
                <ImageIcon className="w-5 h-5 text-card-foreground" />
                <span className="text-xs font-medium text-card-foreground">JPG</span>
                <span className="text-[10px] text-muted-foreground">Compressed</span>
              </Label>
              <Label
                htmlFor="pdf"
                className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border cursor-pointer transition-colors ${
                  format === "pdf" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                }`}
              >
                <RadioGroupItem value="pdf" id="pdf" className="sr-only" />
                <FileText className="w-5 h-5 text-card-foreground" />
                <span className="text-xs font-medium text-card-foreground">PDF</span>
                <span className="text-[10px] text-muted-foreground">Print-ready</span>
              </Label>
            </RadioGroup>
          </div>

          <Separator />

          {/* Quality (for JPG) */}
          {format === "jpg" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Quality</Label>
                <span className="text-xs text-card-foreground">{quality}%</span>
              </div>
              <Slider
                value={[quality]}
                min={10}
                max={100}
                step={5}
                onValueChange={([v]) => setQuality(v)}
              />
            </div>
          )}

          {/* Scale */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Scale</Label>
            <Select value={scale} onValueChange={setScale}>
              <SelectTrigger className="bg-secondary border-border text-card-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0.5">0.5x (Half)</SelectItem>
                <SelectItem value="1">1x (Original)</SelectItem>
                <SelectItem value="2">2x (Double)</SelectItem>
                <SelectItem value="3">3x (Triple)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground">
              Output size: {exportWidth} x {exportHeight} px
            </p>
          </div>

          <Separator />

          {/* Magic Resize */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Quick Resize</Label>
            <div className="grid grid-cols-2 gap-1.5">
              {Object.entries(CANVAS_PRESETS).slice(0, 6).map(([key, preset]) => (
                <button
                  key={key}
                  className="text-left p-2 rounded-lg bg-secondary hover:bg-accent border border-border transition-colors"
                  onClick={() => toast.info(`Resize to ${preset.label} — use Magic Resize in AI Tools`)}
                >
                  <p className="text-[10px] font-medium text-card-foreground">{preset.label}</p>
                  <p className="text-[9px] text-muted-foreground">{preset.width}x{preset.height}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <Button onClick={handleExport} className="w-full gap-2">
          <Download className="w-4 h-4" />
          Export as {format.toUpperCase()}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
