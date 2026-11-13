"use client";

import { useState, useEffect, useMemo, useRef, useTransition } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  FileText,
  ShieldCheck,
  Scale,
  Search,
  Printer,
  Check,
  Copy,
  ArrowUpRight,
  Calendar,
  AlertTriangle,
  HeartPulse,
  PackageCheck,
  CreditCard,
  Lock,
  ExternalLink,
  Mail,
  MapPin,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Shield,
  HelpCircle,
  Info,
} from "lucide-react";
import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/motion/reveal";

export interface TermSection {
  id: string;
  number: string;
  title: string;
  category: "Access & Use" | "Orders & Shipping" | "Health & Safety" | "Legal & Rights";
  summary: string;
  icon: typeof FileText;
  paragraphs: string[];
  bullets?: string[];
  notice?: {
    type: "warning" | "medical" | "info";
    title: string;
    text: string;
  };
}

const termsData: TermSection[] = [
  {
    id: "use-of-website",
    number: "01",
    title: "Use of Our Website",
    category: "Access & Use",
    icon: Shield,
    summary: "AirGuard Health provides health, water purity, and air quality awareness solutions for lawful, responsible use.",
    paragraphs: [
      "AirGuard Health, Inc. provides products and services intended to support health and wellness, improve water purity, and improve air quality awareness. You agree to use our website for lawful purposes only and not to engage in any activity that could damage, disrupt, or interfere with our website or services.",
    ],
  },
  {
    id: "products-and-services",
    number: "02",
    title: "Products and Services",
    category: "Access & Use",
    icon: Sparkles,
    summary: "We strive for complete accuracy across product specs, pricing, and availability, with the right to update offerings at any time.",
    paragraphs: [
      "We strive to ensure that all product descriptions, images, pricing, and other information displayed on our website are accurate. However, we do not guarantee that all information is complete, current, or error-free. We reserve the right to update product information, modify offerings, or discontinue products at any time.",
    ],
  },
  {
    id: "orders-and-payments",
    number: "03",
    title: "Orders and Payments",
    category: "Orders & Shipping",
    icon: CreditCard,
    summary: "Orders require accurate billing and shipping details. Payment is collected at checkout and full refunds apply if an order is canceled by us.",
    paragraphs: [
      "All orders placed through AirGuard Health are subject to acceptance and availability. By submitting an order, you agree to provide accurate billing, shipping, and payment information.",
      "Payment is generally collected at checkout when you complete your purchase. We reserve the right to cancel or refuse orders in cases of suspected fraud, incorrect pricing, product unavailability, or other legitimate business reasons. If payment has already been collected for a canceled order, an appropriate refund will be issued.",
    ],
  },
  {
    id: "pricing-and-taxes",
    number: "04",
    title: "Pricing and Taxes",
    category: "Orders & Shipping",
    icon: Scale,
    summary: "Prices are shown at checkout and subject to change. All applicable taxes and fees are itemized transparently before purchase.",
    paragraphs: [
      "All prices are displayed in the currency indicated at checkout unless otherwise stated. Prices may change without prior notice. Applicable taxes, shipping fees, and other charges will be displayed during checkout when applicable.",
    ],
  },
  {
    id: "shipping-and-delivery",
    number: "05",
    title: "Shipping and Delivery",
    category: "Orders & Shipping",
    icon: PackageCheck,
    summary: "We ship orders promptly within estimated windows; external carrier or customs delays are beyond our direct control.",
    paragraphs: [
      "We make reasonable efforts to process and ship orders within the estimated timeframes provided. Delivery dates are estimates and are not guaranteed. AirGuard Health is not responsible for delays caused by shipping carriers, weather, customs, or other circumstances beyond our reasonable control.",
    ],
  },
  {
    id: "returns-and-cancellations",
    number: "06",
    title: "Returns, Refunds, and Cancellations",
    category: "Orders & Shipping",
    icon: RotateCcw,
    summary: "Eligible returns and cancellations are subject to our return policy with an applicable 30% restocking fee.",
    paragraphs: [
      "Returns, refunds, and order cancellations are subject to our applicable return and refund policy which will be charge 30% restocking fee. Please review that policy before making a purchase. Nothing in these Terms limits any consumer rights that cannot legally be waived under applicable law.",
    ],
    notice: {
      type: "warning",
      title: "Restocking Fee Notice",
      text: "Please note that returns, refunds, and cancellations are subject to a 30% restocking fee in accordance with our return guidelines. Your statutory consumer rights remain fully respected.",
    },
  },
  {
    id: "health-disclaimer",
    number: "07",
    title: "Health Disclaimer",
    category: "Health & Safety",
    icon: HeartPulse,
    summary: "Our products and content provide wellness and awareness support; they are not intended to diagnose, treat, or replace professional medical advice.",
    paragraphs: [
      "AirGuard Health, Inc products and website content are provided for general informational and product-related purposes only. Unless expressly stated otherwise, our products and content are not intended to diagnose, treat, cure, or prevent any disease or medical condition.",
      "Information provided through our website is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional regarding health concerns or before making decisions about medical care. Product performance and results may vary depending on usage and individual circumstances.",
    ],
    notice: {
      type: "medical",
      title: "Medical & Clinical Advisory",
      text: "AirGuard™ systems and content are designed to promote clean air, water purity, and environmental awareness. Always consult your licensed physician or healthcare specialist for personal medical decisions.",
    },
  },
  {
    id: "privacy-and-personal-info",
    number: "08",
    title: "Privacy and Personal Information",
    category: "Health & Safety",
    icon: Lock,
    summary: "Your data is safeguarded and handled strictly to process orders, support clinical inquiries, and meet legal standards.",
    paragraphs: [
      "Your privacy is important to us. We collect and process personal information as described in our Privacy Policy, including information needed to process orders, accept payments, provide customer support, and fulfill legal obligations.",
      "We may share necessary information with third-party service providers, such as payment processors, shipping companies, and website service providers, to operate our business. By using our website, you acknowledge that your information will be handled in accordance with our Privacy Policy.",
    ],
  },
  {
    id: "intellectual-property",
    number: "09",
    title: "Intellectual Property",
    category: "Legal & Rights",
    icon: ShieldCheck,
    summary: "All AirGuard™ logos, product imagery, descriptions, and proprietary materials are protected by intellectual property laws.",
    paragraphs: [
      "All website content, including text, graphics, logos, images, product descriptions, and other materials owned or licensed by AirGuard Health, is protected by applicable intellectual property laws. You may not copy, reproduce, distribute, modify, or commercially exploit our content without prior written permission, except as permitted by law.",
    ],
  },
  {
    id: "prohibited-activities",
    number: "10",
    title: "Prohibited Activities",
    category: "Access & Use",
    icon: AlertTriangle,
    summary: "Users agree to never engage in fraud, security breaches, system disruption, or unauthorized IP replication.",
    paragraphs: [
      "You agree not to:",
    ],
    bullets: [
      "Use our website for unlawful or fraudulent purposes.",
      "Submit false, misleading, or unauthorized payment information.",
      "Attempt to gain unauthorized access to our systems or customer information.",
      "Introduce malicious software or interfere with the operation of our website.",
      "Copy or misuse our intellectual property without authorization.",
    ],
    notice: {
      type: "info",
      title: "Enforcement & Access Integrity",
      text: "We reserve the right to restrict or terminate access to our website when reasonably necessary to address violations of these terms or protect our business and customers.",
    },
  },
  {
    id: "limitation-of-liability",
    number: "11",
    title: "Limitation of Liability",
    category: "Legal & Rights",
    icon: Scale,
    summary: "Liability is limited to the fullest extent permitted by law, without compromising non-waivable statutory consumer protections.",
    paragraphs: [
      "To the fullest extent permitted by applicable law, AirGuard Health will not be liable for indirect, incidental, special, or consequential damages arising from your use of our website or products. Nothing in these terms excludes or limits liability where such exclusion or limitation is prohibited by law, including applicable consumer protection rights.",
      "Our products and services are provided subject to applicable warranties and legal requirements. We do not guarantee uninterrupted website availability or that our website will always be free from errors.",
    ],
  },
  {
    id: "indemnification",
    number: "12",
    title: "Indemnification",
    category: "Legal & Rights",
    icon: ShieldCheck,
    summary: "Users agree to hold harmless AirGuard for damages arising from unlawful site usage or material violations of these terms.",
    paragraphs: [
      "To the extent permitted by law, you agree to be responsible for losses, liabilities, and reasonable expenses arising from your unlawful use of our website or your material violation of these Terms, except to the extent caused by AirGuard Health's own conduct or otherwise prohibited by applicable law.",
    ],
  },
  {
    id: "third-party-services",
    number: "13",
    title: "Third-Party Services and Links",
    category: "Legal & Rights",
    icon: ExternalLink,
    summary: "External links and integrated third-party services operate under their own independent policies and conditions.",
    paragraphs: [
      "Our website may contain links to third-party websites or use third-party services. AirGuard Health does not control all third-party websites, their content, or their privacy practices. Your use of third-party services may be subject to separate terms and policies.",
    ],
  },
  {
    id: "changes-to-terms",
    number: "14",
    title: "Changes to These Terms",
    category: "Access & Use",
    icon: Calendar,
    summary: "Updates are published here with a revised effective date; continued use after modifications indicates agreement.",
    paragraphs: [
      "We may update these Terms of Service from time to time. Any changes will be posted on this page with an updated effective date. Your continued use of our website after changes are posted constitutes acceptance of the revised terms to the extent permitted by applicable law.",
    ],
  },
  {
    id: "governing-law",
    number: "15",
    title: "Governing Law",
    category: "Legal & Rights",
    icon: Scale,
    summary: "These terms are governed by applicable regional business laws while honoring mandatory local consumer rights.",
    paragraphs: [
      "These Terms of Service are subject to the laws applicable to AirGuard Health's business and transactions, without overriding mandatory consumer protections that apply in your jurisdiction. Any disputes will be handled by courts with appropriate jurisdiction, subject to applicable law.",
    ],
  },
  {
    id: "contact-information",
    number: "16",
    title: "Contact Information",
    category: "Access & Use",
    icon: Mail,
    summary: "Have questions about these terms? Reach our official legal and customer service team in Frankfort, Illinois.",
    paragraphs: [
      "If you have questions about these Terms of Service, please contact us using the contact information listed on the AirGuard Health website.",
    ],
  },
];

const categories = ["All", "Access & Use", "Orders & Shipping", "Health & Safety", "Legal & Rights"] as const;
type Category = (typeof categories)[number];

export function TermsOfServicePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category>("All");
  const [activeSectionId, setActiveSectionId] = useState<string>("use-of-website");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Filter sections by search query and category
  const filteredSections = useMemo(() => {
    return termsData.filter((sec) => {
      const matchesCategory =
        selectedCategory === "All" || sec.category === selectedCategory;
      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const inTitle = sec.title.toLowerCase().includes(q);
      const inSummary = sec.summary.toLowerCase().includes(q);
      const inNumber = sec.number.includes(q);
      const inParagraphs = sec.paragraphs.some((p) => p.toLowerCase().includes(q));
      const inBullets = sec.bullets?.some((b) => b.toLowerCase().includes(q));
      return inTitle || inSummary || inNumber || inParagraphs || inBullets;
    });
  }, [searchQuery, selectedCategory]);

  const isManualScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Smooth scroll directly to section with header compensation
  const scrollToSection = (id: string) => {
    // If the section is currently filtered out, reset search and category
    if (searchQuery || selectedCategory !== "All") {
      const isFilteredOut = !filteredSections.some((s) => s.id === id);
      if (isFilteredOut) {
        setSearchQuery("");
        setSelectedCategory("All");
      }
    }

    isManualScrollingRef.current = true;
    setActiveSectionId(id);

    // Give DOM a tick to render if search was reset
    setTimeout(() => {
      const target = document.getElementById(id);
      if (target) {
        const headerOffset = 110;
        const targetTop = target.getBoundingClientRect().top + window.scrollY - headerOffset;

        window.scrollTo({
          top: Math.max(0, targetTop),
          behavior: "smooth",
        });

        if (window.history.pushState) {
          window.history.pushState(null, "", `#${id}`);
        }
      }

      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
        isManualScrollingRef.current = false;
      }, 850);
    }, 20);
  };

  // Scroll spy to highlight active section in TOC
  useEffect(() => {
    const handleScroll = () => {
      if (isManualScrollingRef.current) return;

      // Bottom of the page detection
      const isAtBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 70;
      if (isAtBottom) {
        setActiveSectionId(termsData[termsData.length - 1].id);
        return;
      }

      // Check which section is currently at the reading line (160px from top)
      let currentActiveId = termsData[0].id;
      for (let i = 0; i < termsData.length; i++) {
        const el = document.getElementById(termsData[i].id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top <= 160) {
          currentActiveId = termsData[i].id;
        } else {
          break;
        }
      }
      setActiveSectionId(currentActiveId);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  // Jump to hash if present on mount
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash) {
      const hashId = window.location.hash.replace("#", "");
      if (termsData.some((s) => s.id === hashId)) {
        setTimeout(() => {
          scrollToSection(hashId);
        }, 150);
      }
    }
  }, []);

  const copySectionLink = async (id: string, title: string) => {
    const url = `${window.location.origin}/terms-of-service#${id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setToastMessage(`Copied link to "${title}"`);
      setTimeout(() => {
        setCopiedId(null);
        setToastMessage(null);
      }, 2600);
    } catch {
      setToastMessage(`Link: ${url}`);
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText("info@airguardhealth.com");
      setToastMessage("Email copied to clipboard (info@airguardhealth.com)");
      setTimeout(() => setToastMessage(null), 2500);
    } catch {
      setToastMessage("Email: info@airguardhealth.com");
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="relative min-h-screen bg-[#f7f9fa] text-slate-800 selection:bg-[#b4e4db] selection:text-[#102639]">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-[#304b80]/20 bg-[#0a1829] px-5 py-3.5 text-sm font-medium text-white shadow-2xl backdrop-blur-md"
          >
            <div className="flex size-6 items-center justify-center rounded-full bg-[#b4e4db] text-[#0a1829]">
              <Check size={14} strokeWidth={2.5} />
            </div>
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Atmospheric Hero Section */}
      <section className="company-hero relative overflow-hidden bg-[#0a1829] text-white">
        {/* Ambient lighting & celestial orbit rings */}
        <div aria-hidden="true" className="company-orbits" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-32 top-1/4 size-96 rounded-full bg-[#4067b1]/15 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-10 bottom-0 size-80 rounded-full bg-[#b4e4db]/10 blur-3xl"
        />

        <Container className="relative py-20 lg:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-[1.2fr_0.8fr]">
            <Reveal>
              <div className="inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 backdrop-blur-md">
                <ShieldCheck size={14} className="text-[#b4e4db]" />
                <span className="text-[11px] font-medium tracking-[0.22em] uppercase text-[#a8d8db]">
                  Legal &amp; Transparency · AirGuard Health
                </span>
              </div>

              <h1 className="mt-6 max-w-3xl text-4xl leading-[1.08] tracking-tight sm:text-5xl md:text-7xl">
                Terms of <br />
                <span className="font-serif italic text-[#b4e4db]">Service.</span>
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/75 md:text-lg">
                Welcome to AirGuard Health, Inc. These Terms of Service govern your access to
                and use of our website, products, and services. By accessing our website or
                purchasing from AirGuard Health, you agree to these terms.
              </p>

              {/* Document Meta Badges */}
              <div className="mt-8 flex flex-wrap items-center gap-3 text-xs text-white/70">
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 backdrop-blur-sm">
                  <Calendar size={14} className="text-[#b4e4db]" />
                  <span>
                    Effective Date: <strong className="font-semibold text-white">October 23, 2026</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 backdrop-blur-sm">
                  <FileText size={14} className="text-[#b4e4db]" />
                  <span>16 Documented Sections</span>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 backdrop-blur-sm">
                  <Shield size={14} className="text-[#b4e4db]" />
                  <span>Verified Legal Agreement</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <a
                  href="#legal-content"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection("use-of-website");
                  }}
                  className="company-button group shadow-lg shadow-[#b4e4db]/10"
                >
                  <span>Explore Terms</span>
                  <ChevronRight
                    size={17}
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  />
                </a>

                <button
                  onClick={handlePrint}
                  type="button"
                  aria-label="Print or save Terms as PDF"
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-3.5 text-sm font-medium text-white transition-all hover:border-white/40 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-[#b4e4db]"
                >
                  <Printer size={16} />
                  <span>Print / PDF View</span>
                </button>
              </div>
            </Reveal>

            {/* Hero Quick Insights Card */}
            <Reveal from="right" delay={0.15}>
              <div className="relative rounded-[32px] border border-white/15 bg-white/[0.04] p-8 shadow-2xl backdrop-blur-md md:p-10">
                <div className="flex items-center justify-between border-b border-white/10 pb-5">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-2xl bg-[#b4e4db]/15 text-[#b4e4db]">
                      <Scale size={20} />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-widest text-[#a8d8db]">At a Glance</p>
                      <h3 className="text-base font-semibold text-white">Key Protections &amp; Policies</h3>
                    </div>
                  </div>
                  <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] uppercase tracking-wider text-[#b4e4db]">
                    Current
                  </span>
                </div>

                <div className="mt-6 space-y-4 text-xs leading-relaxed text-white/70">
                  <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-3.5">
                    <PackageCheck size={18} className="mt-0.5 shrink-0 text-[#b4e4db]" />
                    <div>
                      <span className="font-semibold text-white">Returns &amp; Restocking Fee:</span>
                      <p className="mt-0.5 text-white/65">
                        Returns and cancellations carry an applicable 30% restocking fee. Consumer statutory rights remain protected.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-3.5">
                    <HeartPulse size={18} className="mt-0.5 shrink-0 text-[#b4e4db]" />
                    <div>
                      <span className="font-semibold text-white">Health &amp; Wellness Notice:</span>
                      <p className="mt-0.5 text-white/65">
                        Products and web materials are for general informational purposes and are not medical substitutes.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-3.5">
                    <ShieldCheck size={18} className="mt-0.5 shrink-0 text-[#b4e4db]" />
                    <div>
                      <span className="font-semibold text-white">Intellectual Property:</span>
                      <p className="mt-0.5 text-white/65">
                        All AirGuard™ engineering, trademarks, models, and texts are proprietary and protected by IP law.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between rounded-xl bg-white/5 px-4 py-3 text-xs text-white/60">
                  <span>Questions about these terms?</span>
                  <button
                    onClick={() => scrollToSection("contact-information")}
                    className="inline-flex items-center gap-1 font-medium text-[#b4e4db] hover:underline"
                  >
                    <span>Section 16</span>
                    <ArrowUpRight size={13} />
                  </button>
                </div>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* Main Interactive Reader Section */}
      <section id="legal-content" className="relative scroll-mt-20 py-14 lg:py-20">
        <Container>
          {/* Search & Category Filter Toolbar */}
          <div className="no-print mb-12 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm md:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              {/* Live Search Input */}
              <div className="relative flex-1 max-w-xl">
                <Search
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    startTransition(() => {
                      setSearchQuery(e.target.value);
                    });
                  }}
                  placeholder="Search terms, policies, fees (e.g. 'restocking', 'warranty', 'health')..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 py-3.5 pr-10 pl-11 text-sm text-slate-800 placeholder-slate-400 transition-all focus:border-[#4067b1] focus:bg-white focus:ring-4 focus:ring-[#4067b1]/10 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    aria-label="Clear search"
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                  >
                    <span className="text-xs font-semibold">✕</span>
                  </button>
                )}
              </div>

              {/* Category Pills */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="mr-1 text-xs font-medium tracking-wide uppercase text-slate-400">
                  Filter:
                </span>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`rounded-full px-4 py-2 text-xs font-medium transition-all ${
                      selectedCategory === cat
                        ? "bg-[#102639] text-white shadow-sm"
                        : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Results Counter if Filtered */}
            {(searchQuery || selectedCategory !== "All") && (
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                <span>
                  Showing {filteredSections.length} of {termsData.length} sections
                  {searchQuery && ` matching "${searchQuery}"`}
                </span>
                {(searchQuery || selectedCategory !== "All") && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("All");
                    }}
                    className="font-medium text-[#4067b1] hover:underline"
                  >
                    Reset filters
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Two-Column Layout: Sticky Sidebar TOC + Scrollable Content */}
          <div className="grid gap-10 lg:grid-cols-[320px_1fr] xl:gap-14">
            {/* Desktop Sticky Table of Contents */}
            <aside className="hidden lg:block">
              <div className="sticky top-28 space-y-6">
                <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-[#4067b1]" />
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-[#152e43]">
                        Table of Contents
                      </h4>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                      16 items
                    </span>
                  </div>

                  <nav
                    aria-label="Table of contents"
                    className="mt-4 max-h-[calc(100vh-280px)] space-y-1 overflow-y-auto pr-1"
                  >
                    {termsData.map((sec) => {
                      const isActive = activeSectionId === sec.id;
                      return (
                        <a
                          key={sec.id}
                          href={`#${sec.id}`}
                          onClick={(e) => {
                            e.preventDefault();
                            scrollToSection(sec.id);
                          }}
                          className={`group flex items-center justify-between rounded-xl px-3 py-2 text-xs transition-all ${
                            isActive
                              ? "bg-[#102639] font-medium text-white shadow-sm"
                              : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <span
                              className={`font-mono text-[11px] ${
                                isActive ? "text-[#b4e4db]" : "text-slate-400 group-hover:text-slate-600"
                              }`}
                            >
                              {sec.number}
                            </span>
                            <span className="truncate">{sec.title}</span>
                          </div>
                          {isActive && (
                            <ChevronRight size={14} className="shrink-0 text-[#b4e4db]" />
                          )}
                        </a>
                      );
                    })}
                  </nav>
                </div>

                {/* Need Help Card in Sidebar */}
                <div className="rounded-3xl border border-[#adc4cc]/50 bg-gradient-to-br from-[#edf4f6] to-[#e4eef1] p-6 text-slate-800 shadow-sm">
                  <div className="flex size-10 items-center justify-center rounded-2xl bg-white text-[#152e43] shadow-sm">
                    <HelpCircle size={20} />
                  </div>
                  <h4 className="mt-4 text-sm font-semibold text-[#152e43]">Need clarification?</h4>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                    Our compliance and customer team is happy to assist with any questions regarding our terms.
                  </p>
                  <Link
                    href="/contact"
                    className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#152e43] hover:text-[#4067b1]"
                  >
                    <span>Contact Support</span>
                    <ArrowUpRight size={14} />
                  </Link>
                </div>
              </div>
            </aside>

            {/* Main Content Area */}
            <main className="space-y-8">
              {filteredSections.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
                  <AlertTriangle className="mx-auto size-10 text-slate-400" />
                  <h3 className="mt-4 text-lg font-semibold text-slate-800">No matching sections</h3>
                  <p className="mt-2 text-sm text-slate-500">
                    We could not find any terms matching &quot;{searchQuery}&quot;. Try adjusting your keywords or category filter.
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("All");
                    }}
                    className="mt-6 rounded-full bg-[#102639] px-5 py-2.5 text-xs font-medium text-white transition hover:bg-[#1f304f]"
                  >
                    Clear Search
                  </button>
                </div>
              ) : (
                filteredSections.map((sec, index) => {
                  const Icon = sec.icon;
                  const isCopied = copiedId === sec.id;

                  return (
                    <Reveal key={sec.id} delay={Math.min(index * 0.04, 0.25)}>
                      <article
                        id={sec.id}
                        className="group relative scroll-mt-28 rounded-3xl border border-slate-200/90 bg-white p-7 shadow-sm transition-all duration-300 hover:border-[#adc4cc] hover:shadow-md md:p-10"
                      >
                        {/* Section Header */}
                        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-6">
                          <div className="flex items-start gap-4">
                            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#edf4f6] text-[#24465f] transition-colors group-hover:bg-[#102639] group-hover:text-[#b4e4db]">
                              <Icon size={22} />
                            </div>
                            <div>
                              <div className="flex items-center gap-3">
                                <span className="font-serif text-2xl italic text-[#52757d]">
                                  {sec.number}
                                </span>
                                <span className="rounded-full bg-slate-100 px-3 py-0.5 text-[10px] font-semibold tracking-wider uppercase text-slate-600">
                                  {sec.category}
                                </span>
                              </div>
                              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[#152e43] md:text-3xl">
                                {sec.title}
                              </h2>
                            </div>
                          </div>

                          {/* Copy Link Button */}
                          <button
                            onClick={() => copySectionLink(sec.id, sec.title)}
                            aria-label={`Copy direct link to Section ${sec.number}: ${sec.title}`}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 transition-all hover:border-slate-300 hover:bg-white hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-[#4067b1]"
                          >
                            {isCopied ? (
                              <>
                                <Check size={14} className="text-emerald-600" />
                                <span className="text-emerald-700">Link copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy size={14} />
                                <span>Copy link</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Plain English Key Takeaway Pill */}
                        <div className="mt-6 flex items-start gap-3 rounded-2xl bg-slate-50/90 p-4 text-xs text-slate-700">
                          <Info size={16} className="mt-0.5 shrink-0 text-[#4067b1]" />
                          <div>
                            <span className="font-semibold text-slate-900">Summary: </span>
                            <span>{sec.summary}</span>
                          </div>
                        </div>

                        {/* Legal Body Paragraphs */}
                        <div className="mt-6 space-y-4 text-sm leading-8 text-slate-600">
                          {sec.paragraphs.map((p, pIdx) => (
                            <p key={pIdx}>{p}</p>
                          ))}
                        </div>

                        {/* Bulleted points if present */}
                        {sec.bullets && sec.bullets.length > 0 && (
                          <ul className="mt-4 space-y-2.5">
                            {sec.bullets.map((b, bIdx) => (
                              <li
                                key={bIdx}
                                className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 text-xs leading-relaxed text-slate-700"
                              >
                                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#102639] text-[10px] font-bold text-white">
                                  {bIdx + 1}
                                </span>
                                <span>{b}</span>
                              </li>
                            ))}
                          </ul>
                        )}

                        {/* Special Callout Notices */}
                        {sec.notice && (
                          <div
                            className={`mt-6 rounded-2xl border p-5 ${
                              sec.notice.type === "warning"
                                ? "border-amber-200 bg-amber-50/70 text-amber-950"
                                : sec.notice.type === "medical"
                                ? "border-teal-200 bg-teal-50/70 text-teal-950"
                                : "border-blue-200 bg-blue-50/70 text-blue-950"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              {sec.notice.type === "warning" && (
                                <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600" />
                              )}
                              {sec.notice.type === "medical" && (
                                <HeartPulse className="mt-0.5 size-5 shrink-0 text-teal-600" />
                              )}
                              {sec.notice.type === "info" && (
                                <ShieldCheck className="mt-0.5 size-5 shrink-0 text-blue-600" />
                              )}
                              <div>
                                <h4 className="text-xs font-bold tracking-wide uppercase">
                                  {sec.notice.title}
                                </h4>
                                <p className="mt-1 text-xs leading-relaxed opacity-90">
                                  {sec.notice.text}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Special Interactive Section 16 Contact Card */}
                        {sec.id === "contact-information" && (
                          <div className="mt-8 rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-[#edf4f6] p-6 shadow-sm">
                            <h4 className="text-sm font-semibold text-[#152e43]">
                              Official AirGuard Health Legal Registry
                            </h4>
                            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                              <div className="rounded-xl border border-slate-200/80 bg-white p-4">
                                <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                                  Entity Name
                                </span>
                                <p className="mt-1 text-sm font-medium text-slate-800">
                                  AirGuard Health, Inc.
                                </p>
                              </div>

                              <div className="rounded-xl border border-slate-200/80 bg-white p-4">
                                <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                                  Official Domain
                                </span>
                                <p className="mt-1">
                                  <a
                                    href="https://www.airguardhealth.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-sm font-medium text-[#4067b1] hover:underline"
                                  >
                                    <span>www.airguardhealth.com</span>
                                    <ArrowUpRight size={13} />
                                  </a>
                                </p>
                              </div>

                              <div className="rounded-xl border border-slate-200/80 bg-white p-4">
                                <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                                  Official Email
                                </span>
                                <div className="mt-1 flex items-center justify-between">
                                  <a
                                    href="mailto:info@airguardhealth.com"
                                    className="text-sm font-medium text-[#4067b1] hover:underline"
                                  >
                                    info@airguardhealth.com
                                  </a>
                                  <button
                                    onClick={copyEmail}
                                    title="Copy Email"
                                    aria-label="Copy legal email"
                                    className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                                  >
                                    <Copy size={14} />
                                  </button>
                                </div>
                              </div>

                              <div className="rounded-xl border border-slate-200/80 bg-white p-4">
                                <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                                  Telephone Support
                                </span>
                                <p className="mt-1">
                                  <a
                                    href="tel:+18774123405"
                                    className="text-sm font-medium text-slate-800 hover:text-[#4067b1]"
                                  >
                                    (877) 412-3405
                                  </a>
                                </p>
                              </div>
                            </div>

                            <div className="mt-4 flex items-start gap-3 rounded-xl border border-slate-200/80 bg-white p-4">
                              <MapPin size={18} className="mt-0.5 shrink-0 text-[#60818b]" />
                              <div>
                                <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                                  Headquarters &amp; Business Address
                                </span>
                                <address className="mt-1 text-sm not-italic leading-relaxed text-slate-800">
                                  21200 S. LaGrange Rd, Suite 142
                                  <br />
                                  Frankfort, IL 60423
                                </address>
                                <a
                                  href="https://www.google.com/maps/search/?api=1&query=21200+South+LaGrange+Rd+Suite+142+Frankfort+IL+60423"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-[#4067b1] hover:underline"
                                >
                                  <span>View on Google Maps</span>
                                  <ArrowUpRight size={13} />
                                </a>
                              </div>
                            </div>
                          </div>
                        )}
                      </article>
                    </Reveal>
                  );
                })
              )}

              {/* Bottom Quick Action Banner */}
              <Reveal>
                <div className="rounded-3xl bg-[#102639] p-8 text-white md:p-12">
                  <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a8d8db]">
                        Still have questions?
                      </span>
                      <h3 className="mt-2 text-2xl font-medium tracking-tight text-white md:text-3xl">
                        We are here to assist your practice.
                      </h3>
                      <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/70">
                        Whether you are evaluating the AirGuard™ LT shield, MP, or XP line, our team will provide clear, thorough answers.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <Link
                        href="/contact"
                        className="company-button"
                      >
                        <span>Contact our Team</span>
                        <ArrowUpRight size={16} />
                      </Link>
                      <button
                        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                        className="rounded-full border border-white/20 bg-white/5 px-5 py-3.5 text-sm font-medium text-white transition hover:bg-white/10"
                      >
                        Back to Top ↑
                      </button>
                    </div>
                  </div>
                </div>
              </Reveal>
            </main>
          </div>
        </Container>
      </section>
    </div>
  );
}
