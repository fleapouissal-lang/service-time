"use client";

import { Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import { Input, type InputProps } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type PasswordInputProps = Omit<InputProps, "type"> & {
  showPasswordLabel: string;
  hidePasswordLabel: string;
  /** Direction de saisie — les mots de passe sont en général LTR */
  inputDir?: "ltr" | "rtl";
  /** Change pour réinitialiser l'état afficher/masquer (ex. après reset du formulaire) */
  resetToken?: number | string;
};

/**
 * Champ mot de passe avec bascule afficher/masquer.
 * Le conteneur reprend `inputDir` pour que l'icône reste du côté logique
 * de fin de saisie, indépendamment du RTL/LTR de la page (langue du site).
 */
export function PasswordInput({
  className,
  inputDir = "ltr",
  showPasswordLabel,
  hidePasswordLabel,
  resetToken,
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(false);
  }, [resetToken]);

  return (
    <div className="relative" dir={inputDir}>
      <Input
        type={visible ? "text" : "password"}
        dir={inputDir}
        className={cn(
          "pe-10",
          inputDir === "ltr" && "text-start",
          className,
        )}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((value) => !value)}
        className="absolute top-1/2 end-2 -translate-y-1/2 rounded p-1 text-muted hover:text-foreground"
        aria-label={visible ? hidePasswordLabel : showPasswordLabel}
      >
        {visible ? (
          <EyeOff className="size-4" aria-hidden />
        ) : (
          <Eye className="size-4" aria-hidden />
        )}
      </button>
    </div>
  );
}
