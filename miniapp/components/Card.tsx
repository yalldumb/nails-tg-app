import React from "react";

type Props<E extends React.ElementType> = {
  as?: E;
  className?: string;
} & Omit<React.ComponentPropsWithoutRef<E>, "as" | "className">;

export default function Card<E extends React.ElementType = "div">({
  as,
  className = "",
  ...rest
}: Props<E>) {
  const Comp = (as || "div") as React.ElementType;
  return (
    <Comp
      className={`rounded-3xl border border-white/10 bg-white/[0.04] shadow-[0_10px_40px_rgba(0,0,0,0.55)] ${className}`}
      {...rest}
    />
  );
}
