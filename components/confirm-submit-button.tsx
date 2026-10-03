"use client";

import { Button } from "@/components/ui/button";

export function ConfirmSubmitButton({
  confirmMessage,
  children,
  variant = "outline",
  size = "sm",
}: {
  confirmMessage: string;
  children: React.ReactNode;
  variant?: "default" | "outline" | "destructive" | "secondary";
  size?: "sm" | "default" | "lg";
}) {
  return (
    <Button
      type="submit"
      variant={variant}
      size={size}
      onClick={(e) => {
        if (!window.confirm(confirmMessage)) e.preventDefault();
      }}
    >
      {children}
    </Button>
  );
}
