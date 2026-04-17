import React from "react";

export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function composeEventHandlers<E>(
  theirHandler: ((event: E) => void) | undefined,
  ourHandler: (event: E) => void,
) {
  return (event: E) => {
    theirHandler?.(event);
    ourHandler(event);
  };
}

export function renderWithOptionalSlot(
  children: React.ReactNode,
  props: Record<string, unknown>,
) {
  if (React.isValidElement(children)) {
    const child = children as React.ReactElement<any>;
    return React.cloneElement(child, {
      ...props,
      ...child.props,
      className: cn(props.className as string, child.props.className),
      onClick:
        props.onClick && child.props.onClick
          ? composeEventHandlers(child.props.onClick, props.onClick as (event: unknown) => void)
          : (props.onClick ?? child.props.onClick),
    });
  }

  return null;
}
