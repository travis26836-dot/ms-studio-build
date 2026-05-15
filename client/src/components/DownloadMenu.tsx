import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Download,
  Facebook,
  Instagram,
  Youtube,
  Twitter,
  Linkedin,
  Share2,
  Lock,
  Image as ImageIcon,
  FileImage,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

interface DownloadMenuProps {
  onExport: (format: "png" | "jpg", quality: number) => string;
  canvasWidth: number;
  canvasHeight: number;
  isSubscribed?: boolean; // tier-one plan subscription status
  projectName?: string;
}

/**
 * PlanGatedFeature - Visual indicator for locked premium features
 */
const PlanGatedBadge: React.FC<{ isLocked: boolean }> = ({ isLocked }) => {
  if (!isLocked) return null;
  return (
    <div className="flex items-center gap-1 ml-auto pl-2">
      <Lock className="w-3 h-3 text-amber-600" />
      <span className="text-xs text-amber-600 font-medium">Pro</span>
    </div>
  );
};

/**
 * DownloadMenu - Canva-inspired multi-level menu without Radix dependencies.
 */
export const DownloadMenu: React.FC<DownloadMenuProps> = ({
  onExport,
  canvasWidth,
  canvasHeight,
  isSubscribed = false,
  projectName = "design",
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [quality] = useState(100);
  const [showResizeModal, setShowResizeModal] = useState(false);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!menuRef.current) {
        return;
      }

      if (!menuRef.current.contains(event.target as Node)) {
        setOpen(false);
        setShareOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        setShareOpen(false);
      }
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const handleDownload = (selectedFormat: "png" | "jpg" | "pdf") => {
    try {
      if (selectedFormat === "pdf") {
        // These would require server-side processing
        toast.info(`${selectedFormat.toUpperCase()} export coming soon!`);
        return;
      }

      const dataUrl = onExport(selectedFormat, quality / 100);
      if (dataUrl) {
        const link = document.createElement("a");
        link.download = `${projectName}.${selectedFormat}`;
        link.href = dataUrl;
        link.click();
        toast.success(`Downloaded as ${selectedFormat.toUpperCase()}`);
        setOpen(false);
        setShareOpen(false);
      }
    } catch {
      toast.error("Download failed. Please try again.");
    }
  };

  const handleShare = (platform: string) => {
    if (!isSubscribed && platform !== "link") {
      toast.error(`${platform} sharing is available for Tier-One subscribers`);
      return;
    }

    if (platform === "link") {
      const url = window.location.href;
      navigator.clipboard
        .writeText(url)
        .then(() => toast.success("Editor link copied"))
        .catch(() => toast.error("Unable to copy link"));
      setOpen(false);
      setShareOpen(false);
      return;
    }

    toast.info(`${platform} sharing integration coming soon!`);
  };

  return (
    <>
      <div className="relative" ref={menuRef}>
        <Button
          variant="default"
          size="sm"
          className="gap-1.5"
          onClick={() => {
            setOpen(current => !current);
            if (open) {
              setShareOpen(false);
            }
          }}
        >
          <Download className="w-4 h-4" />
          <span className="text-xs font-medium hidden sm:inline">Download</span>
        </Button>

        {open ? (
          <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-md border bg-popover p-1 text-popover-foreground shadow-lg">
            <p className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Download Format
            </p>

            <MenuButton onClick={() => handleDownload("png")}>
              <FileImage className="w-4 h-4" />
              <span>PNG (Lossless)</span>
            </MenuButton>

            <MenuButton onClick={() => handleDownload("jpg")}>
              <ImageIcon className="w-4 h-4" />
              <span>JPG (Compressed)</span>
            </MenuButton>

            <MenuButton onClick={() => handleDownload("pdf")}> 
              <span>PDF</span>
              <span className="ml-auto text-xs text-muted-foreground">Coming soon</span>
            </MenuButton>

            <div className="my-1 h-px bg-border" />

            <p className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Tools
            </p>

            <MenuButton
              onClick={() => {
                if (!isSubscribed) {
                  toast.error("Resize is a Tier-One feature");
                  return;
                }
                setShowResizeModal(true);
                setOpen(false);
              }}
            >
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                <span>Image Resize</span>
              </div>
              <PlanGatedBadge isLocked={!isSubscribed} />
            </MenuButton>

            <div className="my-1 h-px bg-border" />

            <p className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Share
            </p>

            <MenuButton
              onClick={() => {
                setShareOpen(current => !current);
              }}
            >
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4" />
                <span>Social Media</span>
              </div>
              <PlanGatedBadge isLocked={!isSubscribed} />
            </MenuButton>

            {shareOpen ? (
              <div className="ml-2 mt-1 space-y-1 rounded-md border border-border/70 bg-background/60 p-1">
                <MenuButton onClick={() => handleShare("facebook")}>
                  <Facebook className="w-4 h-4 text-blue-600" />
                  <span>Facebook</span>
                </MenuButton>
                <MenuButton onClick={() => handleShare("instagram")}>
                  <Instagram className="w-4 h-4 text-pink-600" />
                  <span>Instagram</span>
                </MenuButton>
                <MenuButton onClick={() => handleShare("youtube")}>
                  <Youtube className="w-4 h-4 text-red-600" />
                  <span>YouTube</span>
                </MenuButton>
                <MenuButton onClick={() => handleShare("twitter")}>
                  <Twitter className="w-4 h-4 text-sky-600" />
                  <span>X (Twitter)</span>
                </MenuButton>
                <MenuButton onClick={() => handleShare("linkedin")}>
                  <Linkedin className="w-4 h-4 text-blue-700" />
                  <span>LinkedIn</span>
                </MenuButton>
                <div className="my-1 h-px bg-border" />
                <MenuButton onClick={() => handleShare("link")}>
                  <Share2 className="w-4 h-4" />
                  <span>Copy Link</span>
                </MenuButton>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Image Resize Modal */}
      {showResizeModal && (
        <ImageResizeDialog
          currentWidth={canvasWidth}
          currentHeight={canvasHeight}
          open={showResizeModal}
          onOpenChange={setShowResizeModal}
        />
      )}

    </>
  );
};

/**
 * ImageResizeDialog - Allows resizing before export (tier-one only)
 */
const ImageResizeDialog: React.FC<{
  currentWidth: number;
  currentHeight: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}> = ({ currentWidth, currentHeight, open, onOpenChange }) => {
  const [newWidth, setNewWidth] = useState(currentWidth);
  const [newHeight, setNewHeight] = useState(currentHeight);
  const [lockAspectRatio, setLockAspectRatio] = useState(true);

  const handleWidthChange = (value: number) => {
    setNewWidth(value);
    if (lockAspectRatio) {
      const ratio = currentHeight / currentWidth;
      setNewHeight(Math.round(value * ratio));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resize Image</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Change the dimensions of your exported image
          </p>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Feature coming soon! This will allow you to resize your design before exporting.
          </p>
          <p className="text-xs text-muted-foreground">
            Current size: {currentWidth}×{currentHeight}px
          </p>
          <p className="text-xs text-muted-foreground">
            Requested size: {newWidth}×{newHeight}px
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="text-xs text-primary"
              onClick={() => handleWidthChange(newWidth + 100)}
            >
              Increase Width +100
            </button>
            <button
              type="button"
              className="text-xs text-muted-foreground"
              onClick={() => setLockAspectRatio(current => !current)}
            >
              {lockAspectRatio ? "Unlock Aspect Ratio" : "Lock Aspect Ratio"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DownloadMenu;

function MenuButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
    >
      {children}
    </button>
  );
}
