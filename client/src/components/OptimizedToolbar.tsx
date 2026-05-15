import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import {
  Undo2,
  Redo2,
  ZoomOut,
  ZoomIn,
  Maximize2,
  Copy,
  Trash2,
  ChevronsUp,
  ArrowUp,
  ArrowDown,
  ChevronsDown,
  Group,
  Ungroup,
  Lock,
  LucideIcon,
} from 'lucide-react';

interface ToolbarButtonProps {
  icon: LucideIcon;
  tooltip: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  variant?: 'ghost' | 'default';
}

/**
 * CompactToolbarButton - Icon-only button with hover tooltip (Canva-style)
 * Tooltip only shows on hover, no text labels to save space
 */
export const CompactToolbarButton: React.FC<ToolbarButtonProps> = ({
  icon: Icon,
  tooltip,
  onClick,
  disabled = false,
  className = '',
  variant = 'ghost',
}) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={variant}
          size="sm"
          onClick={onClick}
          disabled={disabled}
          className={`h-8 w-8 p-0 flex items-center justify-center ${className}`}
        >
          <Icon className="w-4 h-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={8} className="text-xs">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
};

interface ToolbarGroupProps {
  children: React.ReactNode;
  label?: string;
}

/**
 * ToolbarGroup - Visually separated group of toolbar buttons
 */
export const ToolbarGroup: React.FC<ToolbarGroupProps> = ({ children, label }) => {
  return (
    <div className="flex items-center gap-0.5">
      {children}
    </div>
  );
};

interface OptimizedEditorToolbarProps {
  onUndo: () => void;
  onRedo: () => void;
  onZoomOut: () => void;
  onZoomIn: () => void;
  onFitScreen: () => void;
  zoom: number;
  
  // Selection-dependent actions
  hasSelection: boolean;
  onDuplicate: () => void;
  onDelete: () => void;
  onBringToFront: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onSendToBack: () => void;
  onGroup?: () => void;
  onUngroup?: () => void;
  onToggleLock: () => void;
  multiSelect: boolean;
  isGrouped: boolean;
}

/**
 * OptimizedEditorToolbar - Compact, Canva-inspired toolbar
 * Features:
 * - Icon-only buttons (text hidden, shown only on hover via tooltips)
 * - Grouped controls with visual separators
 * - Context-sensitive (shows/hides based on selection)
 * - Responsive layout
 */
export const OptimizedEditorToolbar: React.FC<OptimizedEditorToolbarProps> = ({
  onUndo,
  onRedo,
  onZoomOut,
  onZoomIn,
  onFitScreen,
  zoom,
  hasSelection,
  onDuplicate,
  onDelete,
  onBringToFront,
  onBringForward,
  onSendBackward,
  onSendToBack,
  onGroup,
  onUngroup,
  onToggleLock,
  multiSelect,
  isGrouped,
}) => {
  return (
    <div className="h-10 border-b border-border bg-toolbar flex items-center px-2 gap-1 shrink-0 overflow-x-auto">
      {/* Undo/Redo Group */}
      <ToolbarGroup>
        <CompactToolbarButton
          icon={Undo2}
          tooltip="Undo (Ctrl+Z)"
          onClick={onUndo}
        />
        <CompactToolbarButton
          icon={Redo2}
          tooltip="Redo (Ctrl+Shift+Z)"
          onClick={onRedo}
        />
      </ToolbarGroup>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Zoom Group */}
      <ToolbarGroup>
        <CompactToolbarButton
          icon={ZoomOut}
          tooltip="Zoom Out"
          onClick={onZoomOut}
        />
        <div className="text-xs text-muted-foreground w-10 text-center px-1">
          {Math.round(zoom * 100)}%
        </div>
        <CompactToolbarButton
          icon={ZoomIn}
          tooltip="Zoom In"
          onClick={onZoomIn}
        />
        <CompactToolbarButton
          icon={Maximize2}
          tooltip="Fit to Screen"
          onClick={onFitScreen}
        />
      </ToolbarGroup>

      {hasSelection && (
        <>
          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Edit Group */}
          <ToolbarGroup>
            <CompactToolbarButton
              icon={Copy}
              tooltip="Duplicate (Ctrl+D)"
              onClick={onDuplicate}
            />
            <CompactToolbarButton
              icon={Trash2}
              tooltip="Delete"
              onClick={onDelete}
            />
          </ToolbarGroup>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Arrange Group */}
          <ToolbarGroup>
            <CompactToolbarButton
              icon={ChevronsUp}
              tooltip="Bring to Front"
              onClick={onBringToFront}
            />
            <CompactToolbarButton
              icon={ArrowUp}
              tooltip="Bring Forward"
              onClick={onBringForward}
            />
            <CompactToolbarButton
              icon={ArrowDown}
              tooltip="Send Backward"
              onClick={onSendBackward}
            />
            <CompactToolbarButton
              icon={ChevronsDown}
              tooltip="Send to Back"
              onClick={onSendToBack}
            />
          </ToolbarGroup>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Group/Lock Group */}
          <ToolbarGroup>
            {multiSelect && (
              <CompactToolbarButton
                icon={Group}
                tooltip="Group"
                onClick={onGroup || (() => {})}
              />
            )}
            {isGrouped && (
              <CompactToolbarButton
                icon={Ungroup}
                tooltip="Ungroup"
                onClick={onUngroup || (() => {})}
              />
            )}
            <CompactToolbarButton
              icon={Lock}
              tooltip="Toggle Lock"
              onClick={onToggleLock}
            />
          </ToolbarGroup>
        </>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Help text (optional, mobile-hidden) */}
      <div className="text-xs text-muted-foreground hidden md:block pr-2">
        Select elements to edit
      </div>
    </div>
  );
};

export default OptimizedEditorToolbar;
