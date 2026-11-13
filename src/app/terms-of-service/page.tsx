import type { Metadata } from "next";
import { TermsOfServicePage } from "@/components/legal/terms-page";

export const metadata: Metadata = {
  title: "Terms of Service | AirGuard Health",
  description:
    "Review the AirGuard Health, Inc. Terms of Service. Learn about order terms, warranty, shipping, health disclaimers, and user policies.",
  openGraph: {
    title: "Terms of Service | AirGuard Health",
    description:
      "Review the AirGuard Health, Inc. Terms of Service, policies, health disclaimers, and ordering guidelines.",
    type: "website",
  },
};

export default function Page() {
  return <TermsOfServicePage />;
}
