import type { CSSProperties, ReactNode } from "react";

export type StackProps = {
  alignItems?: CSSProperties["alignItems"];
  children: ReactNode;
  direction?: "column" | "row";
  spacing?: number;
};

export function Stack({
  alignItems = "center",
  children,
  direction = "row",
  spacing = 2
}: StackProps) {
  return (
    <div
      className="mockStack"
      style={{
        alignItems,
        flexDirection: direction,
        gap: `${spacing * 8}px`
      }}
    >
      {children}
    </div>
  );
}
