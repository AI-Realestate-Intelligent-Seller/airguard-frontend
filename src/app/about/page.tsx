import type { Metadata } from "next";
import { AboutPage } from "@/components/company/company-pages";
export const metadata: Metadata = { title: "Our Story | AirGuard Health", description: "Discover the AirGuard story, from Dr. James Orrington II’s original idea to testing and product development with Beyond Design." };
export default function Page() { return <AboutPage/>; }
