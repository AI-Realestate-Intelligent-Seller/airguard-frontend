import type { Metadata } from "next";
import { ContactPage } from "@/components/company/company-pages";
export const metadata: Metadata = { title: "Contact Us | AirGuard Health", description: "Contact AirGuard Health for product questions and purchase inquiries. Call (877) 412-3405 or email info@airguardhealth.com." };
export default function Page() { return <ContactPage/>; }
