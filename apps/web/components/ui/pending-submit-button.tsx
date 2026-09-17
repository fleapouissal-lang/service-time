"use client";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "@/components/ui/button";

type PendingSubmitButtonProps = ButtonProps & {
  pending?: boolean;
  pendingLabel: string;
};

/** Submit button that shows a spinner while its parent form action is running. */
export function PendingSubmitButton({
  pending: pendingProp = false,
  pendingLabel,
  children,
  disabled,
  className,
  ...props
}: PendingSubmitButtonProps) {
  const { pending: formPending } = useFormStatus();
  const pending = pendingProp || formPending;

  return (
    <Button
      {...props}
      type="submit"
      disabled={disabled || pending}
      aria-busy={pending}
      className={className}
    >
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
