import { Switch } from "@/components/ui/switch";
import type { BrandRuleOptions } from "./types";

type BrandRuleTogglesProps = {
  value: BrandRuleOptions;
  hasBrandProfile: boolean;
  onChange: (value: BrandRuleOptions) => void;
};

export function BrandRuleToggles({
  value,
  hasBrandProfile,
  onChange,
}: BrandRuleTogglesProps) {
  const update = (key: keyof BrandRuleOptions, checked: boolean) => {
    onChange({ ...value, [key]: checked });
  };

  return (
    <div className="space-y-2">
      <ToggleRow
        label="Brand colors"
        checked={value.preserveColors}
        disabled={!hasBrandProfile}
        onCheckedChange={checked => update("preserveColors", checked)}
      />
      <ToggleRow
        label="Brand fonts"
        checked={value.preserveFonts}
        disabled={!hasBrandProfile}
        onCheckedChange={checked => update("preserveFonts", checked)}
      />
      <ToggleRow
        label="Text hierarchy"
        checked={value.preserveTextHierarchy}
        onCheckedChange={checked => update("preserveTextHierarchy", checked)}
      />
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  disabled,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-secondary px-2 py-2">
      <span className="text-xs text-card-foreground">{label}</span>
      <Switch
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
      />
    </div>
  );
}
