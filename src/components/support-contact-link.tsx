"use client";

import { useEffect, useState, type ReactNode } from "react";
import { DEFAULT_SUPPORT_EMAIL } from "@/lib/support-contact";

export function SupportContactLink({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  const [email, setEmail] = useState(DEFAULT_SUPPORT_EMAIL);

  useEffect(() => {
    let active = true;
    fetch("/api/support-contact", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Support contact is temporarily unavailable.");
        }
        const payload: unknown = await response.json();
        if (
          !payload ||
          typeof payload !== "object" ||
          !("supportEmail" in payload) ||
          typeof payload.supportEmail !== "string"
        ) {
          throw new Error("The support contact response was invalid.");
        }
        if (active) setEmail(payload.supportEmail);
      })
      .catch((error: unknown) => {
        console.error("Unable to refresh the public support email", error);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <a
      href={`mailto:${email}`}
      aria-label={`Email JobHunter support at ${email}`}
      className={className}
    >
      {children ?? email}
    </a>
  );
}
