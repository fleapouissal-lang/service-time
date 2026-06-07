"use client";

import { useState } from "react";
import type { ProfileRole } from "@service-time/types";
import { createPlatformUserAction } from "@/app/admin/actions";
import { ProfileAvatarPicker } from "@/components/auth/profile-avatar-picker";
import { Button } from "@/components/ui/button";
import { IconSelect } from "@/components/ui/icon-select";
import { Input } from "@/components/ui/input";
import { useLocale } from "@/lib/i18n/locale-context";
import { Label } from "@/components/ui/label";
import {
  buildRoleSelectOptions,
  buildTechnicianTypeSelectOptions,
} from "@/lib/select-option-builders";

export function CreatePlatformUserForm() {
  const { messages: t } = useLocale();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<ProfileRole>("technician");
  const [technicianTypeKey, setTechnicianTypeKey] = useState(0);
  const roleOptions = buildRoleSelectOptions(t);
  const technicianTypeOptions = buildTechnicianTypeSelectOptions(t);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      await createPlatformUserAction(formData);
      setSuccess(t.dashboard.admin.users.createSuccess);
      form.reset();
      setRole("technician");
      setTechnicianTypeKey((key) => key + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errors.admin.createFailed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
      {error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}

      <ProfileAvatarPicker
        label={t.register.avatarLabel}
        hint={t.register.avatarHint}
        className="[&_p]:text-foreground [&_button]:border-primary/40 [&_button]:text-primary"
      />

      <div>
        <Label htmlFor="full_name">{t.dashboard.admin.users.fullName}</Label>
        <Input
          id="full_name"
          name="full_name"
          required
          className="mt-2"
          placeholder={t.common.placeholderName}
        />
      </div>

      <div>
        <Label htmlFor="email">{t.common.email} *</Label>
        <Input
          id="email"
          name="email"
          type="email"
          dir="ltr"
          required
          className="mt-2"
          placeholder="name@example.com"
        />
      </div>

      <div>
        <Label htmlFor="phone">{t.common.phone}</Label>
        <Input
          id="phone"
          name="phone"
          dir="ltr"
          className="mt-2"
          placeholder={t.common.placeholderPhoneLocal}
        />
      </div>

      <div>
        <Label htmlFor="password">{t.common.password} *</Label>
        <Input
          id="password"
          name="password"
          type="password"
          dir="ltr"
          required
          minLength={8}
          className="mt-2"
        />
      </div>

      <div>
        <Label htmlFor="role">{t.dashboard.admin.users.accountType}</Label>
        <div className="mt-2">
          <IconSelect
            id="role"
            name="role"
            options={roleOptions}
            value={role}
            onValueChange={(value) => setRole(value as ProfileRole)}
            required
          />
        </div>
      </div>

      {role === "technician" ? (
        <div>
          <Label htmlFor="technician_type">
            {t.dashboard.admin.users.technicianType}
          </Label>
          <div className="mt-2">
            <IconSelect
              key={technicianTypeKey}
              id="technician_type"
              name="technician_type"
              options={technicianTypeOptions}
              defaultValue="mobile"
              required
            />
          </div>
        </div>
      ) : (
        <input type="hidden" name="technician_type" value="" />
      )}

      <Button type="submit" disabled={loading}>
        {loading ? t.common.creating : t.dashboard.admin.users.createAccount}
      </Button>
    </form>
  );
}
