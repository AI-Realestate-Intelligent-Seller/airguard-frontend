"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowUpRight,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  Check,
  Copy,
  Quote,
  ShieldCheck,
  Sparkles,
  HeartPulse,
} from "lucide-react";
import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/motion/reveal";
import { ANY_TYPE, contactProducts } from "@/data/contact-products";

// Product images
import lt from "../../../public/images/site/airguard/product-lt.webp";

// Real Doctor & Clinical Testing Photos from website
import drOrringtonDemo from "../../../public/images/site/about/dr-orrington-demo.webp";
import ltTesting from "../../../public/images/site/about/lt-testing.webp";
import drJamesOrrington from "../../../public/images/site/about/dr-james-orrington.webp";
import tinaWirtz from "../../../public/images/site/about/tina-wirtz.webp";

const story = [
  {
    label: "The beginning",
    number: "01",
    kicker: "Chairside Dentistry · The Origin",
    title: "A question that changed dentistry and operatory wellness.",
    text: "AirGuard™ LT began chairside, with Dr. James Orrington II, DDS, and an extra-oral suction unit. Masks, face shields and other protective gear each did part of the job, but he believed there was a better way to protect the clinician and the patient: at the source, without changing how dentists work — safeguarding the health and wellness of dental staff and patients alike.",
    image: drOrringtonDemo,
    caption: "Dr. James Orrington II, DDS, evaluating chairside extra-oral containment in clinical dentistry.",
  },
  {
    label: "The idea",
    number: "02",
    kicker: "Design with Purpose · Clean-Air Wellness",
    title: "A barrier. A way forward for modern dentistry.",
    text: "Dr. Orrington II’s breakthrough centered around placing an engineered shield directly on the extra-oral suction arm to create both a physical barrier and an active aerodynamic capture zone right at the source. His initial vision transformed dental operatory wellness, quickly expanding to include the AirGuard™ MP and XP models for comprehensive practice protection.",
    image: ltTesting,
    caption: "Aerodynamic barrier protecting the operatory directly at the oral source.",
  },
  {
    label: "The collaboration",
    number: "03",
    kicker: "Beyond Design, Inc. · Medical Engineering",
    title: "An idea, brought to life through rigorous innovation.",
    text: "To create an exceptional medical-grade product for daily dentistry, Dr. Orrington II leveraged the industrial design and human-factors expertise of Beyond Design, Inc. Their collaborative development and ergonomic refinement brought AirGuard™ to dental clinics nationwide.",
    image: drOrringtonDemo,
    caption: "Collaborative refinement between practicing dentists and medical device engineers.",
  },
];

const quotes = [
  {
    name: "Tina Wirtz, RDH",
    role: "Registered Dental Hygienist",
    image: tinaWirtz,
    badge: "Clinical Hygiene & Air Safety",
    text: "I feel AirGuard™ LT is an excellent replacement of the cumbersome face shield as a barrier between me and the patient.",
  },
  {
    name: "Dr. James Orrington, DDS",
    role: "Doctor of Dental Surgery · Founder",
    image: drJamesOrrington,
    badge: "Dentistry Leadership & Wellness",
    text: "The AirGuard™ is a game changer when using a cavitron or a high-speed handpiece.",
  },
];

function Associates() {
  return (
    <section className="bg-[#f3f5f7] py-14">
      <Container>
        <p className="mb-8 text-center text-xs uppercase tracking-[.22em] text-slate-500">
          Proud associates in dentistry &amp; safety with
        </p>
        <div className="flex flex-wrap items-center justify-center gap-12 md:gap-24">
          {["ada", "ieee", "ces", "ads"].map((name, i) => (
            <Image
              key={name}
              src={`/images/site/logos/${name}.webp`}
              alt={
                [
                  "American Dental Association",
                  "IEEE",
                  "Consumer Technology Association",
                  "Association for Dental Safety",
                ][i]
              }
              width={120}
              height={60}
              className="h-12 w-28 object-contain"
            />
          ))}
        </div>
      </Container>
    </section>
  );
}

function PageHero() {
  return (
    <section className="company-hero relative overflow-hidden bg-[#0a1829] text-white">
      <div aria-hidden="true" className="company-orbits" />
      <Container className="relative grid items-center gap-10 py-20 lg:grid-cols-[1.1fr_1fr] lg:py-32">
        <Reveal>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 backdrop-blur-md">
            <HeartPulse size={14} className="text-[#b4e4db]" />
            <span className="text-[11px] font-medium uppercase tracking-[.22em] text-[#a8d8db]">
              Our Story · Advancing Dentistry & Operatory Wellness
            </span>
          </div>

          <h1 className="max-w-3xl text-4xl leading-[1.08] tracking-tight sm:text-5xl md:text-7xl">
            Born from dentistry.
            <br />
            <span className="font-serif italic text-[#b4e4db]">
              Built for whole-practice wellness.
            </span>
          </h1>

          <p className="mt-7 max-w-xl text-base leading-8 text-white/75">
            The AirGuard™ story begins chairside with a dentist, an unprecedented clinical challenge, and the unyielding belief that dentistry and healthcare wellness deserve better protection.
          </p>

          <a href="#story" className="company-button mt-8">
            Explore our clinical journey
            <ArrowRight size={17} />
          </a>
        </Reveal>

        <Reveal from="right" delay={0.15}>
          <div className="relative flex min-h-[340px] items-center justify-center md:min-h-[420px]">
              <div className="relative w-full max-w-[540px]">
                {/* Doctor Chairside Photo - Clean, direct presentation with no dark borders or letterboxes */}
                <div className="overflow-hidden rounded-2xl shadow-2xl">
                  <Image
                    src={drOrringtonDemo}
                    alt="Dr. James Orrington II, DDS chairside in dentistry practice with AirGuard LT demo"
                    priority
                    className="w-full h-auto block rounded-2xl object-cover"
                  />
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="inline-block rounded-full bg-[#b4e4db] px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#0a1829]">
                        Chairside Dentistry
                      </span>
                      <span className="text-xs font-semibold text-white">
                        Dr. James Orrington II, DDS · Founder
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-white/70">
                      Pioneering chairside protection and whole-practice wellness.
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-[#b4e4db]">
                    <ShieldCheck size={14} />
                    <span>Clinically Validated</span>
                  </div>
                </div>
              </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

export function AboutPage() {
  const [active, setActive] = useState(0);

  return (
    <>
      <PageHero />

      {/* The AirGuard Story Interactive Section with Real Clinical Photo */}
      <section id="story" className="scroll-mt-28 bg-[#f7f8fa] py-20 md:py-28">
        <Container>
          <Reveal>
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-[#52757d]" />
              <p className="company-kicker !mb-0">From a practice to a purpose</p>
            </div>
            <h2 className="company-title mt-3">
              The AirGuard™ Story in Modern Dentistry &amp; Wellness
            </h2>
          </Reveal>

          <div className="mt-14 grid gap-12 lg:grid-cols-[0.55fr_1fr]">
            {/* Story Navigation Tabs */}
            <div className="flex flex-col gap-3" role="tablist" aria-label="Our story">
              {story.map((s, i) => (
                <button
                  key={s.number}
                  id={`story-tab-${i}`}
                  role="tab"
                  aria-selected={active === i}
                  aria-controls="story-panel"
                  onClick={() => setActive(i)}
                  onKeyDown={(e) => {
                    if (
                      [
                        "ArrowDown",
                        "ArrowRight",
                        "ArrowUp",
                        "ArrowLeft",
                        "Home",
                        "End",
                      ].includes(e.key)
                    ) {
                      e.preventDefault();
                      const next =
                        e.key === "Home"
                          ? 0
                          : e.key === "End"
                          ? 2
                          : (active +
                              (e.key === "ArrowDown" || e.key === "ArrowRight"
                                ? 1
                                : 2)) %
                            3;
                      setActive(next);
                      document.getElementById(`story-tab-${next}`)?.focus();
                    }
                  }}
                  tabIndex={active === i ? 0 : -1}
                  className={`flex items-center gap-5 rounded-2xl border p-6 text-left transition-all duration-300 ${
                    active === i
                      ? "border-[#adc4cc] bg-white shadow-md ring-1 ring-[#adc4cc]/30"
                      : "border-transparent text-slate-500 hover:bg-white/60"
                  }`}
                >
                  <span className="font-serif text-3xl italic text-[#6c969d]">
                    {s.number}
                  </span>
                  <div>
                    <span className="block font-medium text-slate-800">{s.label}</span>
                    <span className="text-[11px] text-slate-400">{s.kicker}</span>
                  </div>
                  <ArrowUpRight className="ml-auto" size={18} />
                </button>
              ))}
            </div>

            {/* Active Story Panel with Clinical Photo */}
            <div
              role="tabpanel"
              id="story-panel"
              aria-labelledby={`story-tab-${active}`}
              className="rounded-3xl border border-slate-200/80 bg-white p-8 shadow-sm md:p-12"
            >
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[#edf4f6] px-3 py-0.5 text-xs font-semibold text-[#24465f]">
                  {story[active].kicker}
                </span>
              </div>

              <h3 className="mt-4 text-2xl font-medium leading-tight text-[#152e43] md:text-3xl">
                {story[active].title}
              </h3>

              <p className="mt-5 text-base leading-8 text-slate-600">
                {story[active].text}
              </p>

              {/* Real Doctor / Clinical Testing Photo — Clean, direct presentation */}
              <div className="mt-8">
                <div className="overflow-hidden rounded-2xl shadow-md">
                  <Image
                    src={story[active].image}
                    alt={story[active].caption}
                    className="w-full h-auto block rounded-2xl object-cover"
                  />
                </div>
                <p className="mt-3 text-xs text-slate-600">
                  <strong className="font-semibold text-slate-900">Clinical Archive: </strong>
                  {story[active].caption}
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Rigorous Testing Section with Operatory Testing Photo & LT Shield */}
      <section className="bg-white py-20 md:py-28">
        <Container className="grid items-center gap-14 lg:grid-cols-2">
          {/* Dual Visual Card: LT Product + Real Operatory Testing with proper height */}
          <Reveal className="space-y-6">
            <div className="relative overflow-hidden rounded-[32px] border border-slate-200/80 bg-[#eaf0f2] p-8 shadow-sm md:p-10">
              <span className="company-kicker">Refined around real dentistry</span>
              <div className="w-full flex items-center justify-center min-h-[260px] py-2">
                <Image
                  src={lt}
                  alt="AirGuard LT shield for dentistry"
                  className="w-full h-auto max-h-[260px] object-contain"
                />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {["Lightweight", "Unobtrusive", "Shapeable", "Dentistry Standard"].map(
                  (t) => (
                    <span
                      key={t}
                      className="rounded-full border border-slate-300 bg-white/70 px-4 py-1.5 text-xs font-medium text-slate-700"
                    >
                      {t}
                    </span>
                  )
                )}
              </div>
            </div>

            {/* Real Operatory Testing Photo — Clean, direct presentation */}
            <div>
              <div className="overflow-hidden rounded-2xl shadow-md">
                <Image
                  src={ltTesting}
                  alt="AirGuard LT clinical operatory testing in dentistry"
                  className="w-full h-auto block rounded-2xl object-cover"
                />
              </div>
              <div className="mt-3">
                <p className="text-sm font-semibold text-slate-800">
                  Clinical Operatory Testing · Dentistry &amp; Wellness
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Validating chairside protection under active dental operatory conditions.
                </p>
              </div>
            </div>
          </Reveal>

          {/* Testing Content */}
          <Reveal>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#edf4f6] px-3.5 py-1 text-xs font-semibold text-[#24465f]">
              <ShieldCheck size={14} className="text-[#315974]" />
              <span>Evidence-Based Innovation</span>
            </div>

            <p className="company-kicker mt-4">Every detail matters</p>
            <h2 className="company-title">
              Rigorous testing.
              <br />
              Thoughtful refinement for dentistry wellness.
            </h2>

            <p className="mt-7 leading-8 text-slate-600">
              With an initial concept for AirGuard™ LT, Dr. Orrington II and Beyond Design,
              Inc., worked together to establish rigorous standard requirements for modern
              dentistry. The material had to be exceptionally lightweight, shapeable, and
              cost-effective.
            </p>

            <p className="mt-4 leading-8 text-slate-600">
              Crucially, the size and optical contour had to be unobtrusive — preserving the
              dentist&apos;s natural hand speed, ergonomic posture, and visual line of sight
              without making patients feel closed in.
            </p>

            <p className="mt-4 leading-8 text-slate-600">
              After iterative prototype evaluations and real-world trials across active
              operatories, the design was validated by practicing dentists and dental
              hygienists, establishing a new gold standard for operatory air hygiene and wellness
              in dentistry.
            </p>
          </Reveal>
        </Container>
      </section>

      {/* Voices from the Practice — Featuring Full Generous Portraits of Doctors & Hygienists */}
      <section className="bg-[#102639] py-20 text-white md:py-28">
        <Container>
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="company-kicker !text-[#a8d8db]">
                Voices from the dental practice
              </p>
              <h2 className="company-title !text-white">
                Care in dentistry and wellness, in their own words.
              </h2>
            </div>
            <span className="rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium text-[#b4e4db]">
              Real Clinicians · Verified Experience
            </span>
          </div>

          <div className="mt-14 grid gap-8 lg:grid-cols-2">
            {quotes.map((q) => (
              <Reveal
                key={q.name}
                className="group relative flex flex-col sm:flex-row gap-6 items-start rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-7 shadow-2xl backdrop-blur-sm transition-all duration-300 hover:border-[#b4e4db]/30"
              >
                {/* Clean Doctor / Hygienist Portrait — No dark borders or letterboxes */}
                <div className="w-full sm:w-[220px] md:w-[240px] shrink-0">
                  <div className="overflow-hidden rounded-2xl shadow-xl">
                    <Image
                      src={q.image}
                      alt={q.name}
                      className="w-full h-auto block rounded-2xl object-cover"
                    />
                  </div>
                  <div className="mt-3">
                    <span className="text-[10px] uppercase tracking-wider text-[#b4e4db] font-semibold block">
                      {q.badge}
                    </span>
                    <p className="text-sm font-semibold text-white mt-0.5">{q.name}</p>
                    <p className="text-xs text-white/60">{q.role}</p>
                  </div>
                </div>

                {/* Testimonial Quote & Clinician Credentials */}
                <div className="flex-1 flex flex-col justify-between self-stretch">
                  <div>
                    <Quote className="text-[#a8d8db] mb-3" size={32} />
                    <blockquote className="text-base sm:text-lg leading-relaxed text-white/90 font-light">
                      &ldquo;{q.text}&rdquo;
                    </blockquote>
                  </div>

                  <div className="mt-6 border-t border-white/10 pt-4">
                    <h4 className="text-sm font-semibold text-white">{q.name}</h4>
                    <p className="text-xs text-[#b4e4db] font-medium">{q.role}</p>
                    <p className="text-[11px] text-white/50 mt-0.5">
                      Advocate for Modern Dentistry, Clinical Ergonomics &amp; Whole-Practice Wellness
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* Bring Better Protection to Your Practice */}
      <section className="bg-[#e8f0ee] py-20">
        <Container className="grid items-center gap-8 md:grid-cols-[1fr_auto]">
          <div>
            <h2 className="company-title">
              Elevate dentistry and wellness
              <br />
              across your practice.
            </h2>
            <p className="mt-5 max-w-2xl leading-8 text-slate-600">
              The AirGuard™ family of products is bridging the gap in chairside protection in the
              dental industry. To purchase an AirGuard™ system for your operatory, reach out
              today and a member of our clinical sales team will be with you promptly.
            </p>
          </div>
          <Link href="/contact" className="company-button">
            <span>Contact us</span>
            <ArrowUpRight size={18} />
          </Link>
        </Container>
      </section>

      <Associates />
    </>
  );
}

export function ContactPage() {
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState("");
  const [topic, setTopic] = useState("Dentistry & Product questions");
  const [productId, setProductId] = useState("");
  const product = contactProducts.find((p) => p.id === productId);

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText("info@airguardhealth.com");
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setStatus("Email: info@airguardhealth.com");
    }
  }

  function prepareEmail(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const productLine = product ? `${product.label}${data.get("productType") ? ` — ${data.get("productType")}` : ""}` : "Not provided";
    const body = `Name: ${data.get("name")}\nEmail: ${data.get("email")}\nPractice: ${
      data.get("practice") || "Not provided"
    }\nProduct: ${productLine}\n\n${data.get("message")}`;
    window.location.href = `mailto:info@airguardhealth.com?subject=${encodeURIComponent(
      `AirGuard inquiry — ${topic}${product && product.id !== "general" ? ` · ${product.label}` : ""}`
    )}&body=${encodeURIComponent(body)}`;
    setStatus(
      "Your email draft is ready in your email app. Review it and send it there. If no app opened, email info@airguardhealth.com directly."
    );
  }

  return (
    <>
      {/* No hero: the page opens on the contact details (left) and the form (right), under the site bar */}
      <section id="inquiry" className="scroll-mt-24 bg-[#f7f8fa] pb-20 pt-[calc(72px+3rem)] md:pb-28 md:pt-[calc(108px+4rem)]">
        <Container className="grid items-start gap-14 lg:grid-cols-[.8fr_1.2fr]">
          <Reveal>
            <p className="company-kicker">Contact us</p>
            <h1 className="company-title">
              Here to help
              <br />
              your practice move forward.
            </h1>
            <div className="mt-10 space-y-7">
              <div className="company-contact-row">
                <Mail />
                <div>
                  <p>Email our team</p>
                  <a href="mailto:info@airguardhealth.com">info@airguardhealth.com</a>
                </div>
                <button
                  onClick={copyEmail}
                  aria-label="Copy email address"
                  className="ml-auto rounded-lg p-2 hover:bg-slate-200"
                >
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </div>
              <div className="company-contact-row">
                <Phone />
                <div>
                  <p>Give us a call</p>
                  <a href="tel:+18774123405">(877) 412-3405</a>
                </div>
                <a
                  href="tel:+18774123405"
                  aria-label="Let’s talk: call (877) 412-3405"
                  className="ml-auto inline-flex shrink-0 items-center gap-2 self-center rounded-full bg-[#152e43] px-4 py-2 text-sm font-medium !text-white !no-underline transition-colors hover:bg-[#24465f]"
                >
                  Let’s talk
                  <ArrowRight size={15} aria-hidden="true" />
                </a>
              </div>
              <div className="company-contact-row">
                <MapPin />
                <div>
                  <p>Our address</p>
                  <address className="not-italic leading-7">
                    21200 South LaGrange Rd.
                    <br />
                    Suite 142
                    <br />
                    Frankfort, IL 60423
                  </address>
                  <a
                    className="mt-3 inline-flex items-center gap-2 text-sm"
                    href="https://www.google.com/maps/search/?api=1&query=21200+South+LaGrange+Rd+Suite+142+Frankfort+IL+60423"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Get directions
                    <ArrowUpRight size={15} />
                  </a>
                </div>
              </div>
            </div>
            <p role="status" className="mt-4 text-sm text-slate-500">
              {copied ? "Email address copied." : ""}
            </p>
          </Reveal>

          <Reveal className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_20px_70px_#10263908] md:p-10">
            <form id="contact-form" onSubmit={prepareEmail} className="company-form scroll-mt-28">
              <h3 className="text-2xl text-[#152e43]">Let’s start with you.</h3>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Tell us what you have in mind. We’ll prepare an email for you to review and send.
              </p>
              <fieldset className="my-7">
                <legend className="mb-3 text-sm">I’m interested in</legend>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Dentistry & Product questions",
                    "Purchase inquiry for clinic",
                    "General practice questions",
                  ].map((t) => (
                    <label
                      key={t}
                      className={`cursor-pointer rounded-full border px-4 py-2 text-xs transition-colors ${
                        topic === t
                          ? "border-[#315974] bg-[#edf4f6] text-[#24465f]"
                          : "border-slate-200 text-slate-500"
                      }`}
                    >
                      <input
                        className="sr-only"
                        type="radio"
                        name="topic"
                        value={t}
                        checked={topic === t}
                        onChange={() => setTopic(t)}
                      />
                      {t}
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="grid gap-5 sm:grid-cols-2">
                <label>
                  Your name
                  <input name="name" autoComplete="name" required maxLength={100} />
                </label>
                <label>
                  Email address
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    required
                    maxLength={254}
                  />
                </label>
              </div>
              <label className="mt-5 block">
                Dental Practice / Company{" "}
                <span className="text-slate-400">(optional)</span>
                <input
                  name="practice"
                  autoComplete="organization"
                  maxLength={150}
                />
              </label>
              {/* Which product, then which model / blend / title (the type list follows the product) */}
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <label>
                  Product
                  <select
                    name="product"
                    required
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
                  >
                    <option value="" disabled>
                      Select a product
                    </option>
                    {contactProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Type
                  <select
                    // Remount per product so the choice resets when the product changes
                    key={productId}
                    name="productType"
                    required={!!product?.types.length}
                    disabled={!product?.types.length}
                    defaultValue=""
                  >
                    <option value="" disabled>
                      {!product ? "Select a product first" : product.types.length ? "Select a type" : "No type needed"}
                    </option>
                    {product && product.types.length > 0 && <option value={ANY_TYPE}>{ANY_TYPE}</option>}
                    {product?.types.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="mt-5 block">
                How can we help?
                <textarea name="message" rows={5} required maxLength={3000} />
              </label>
              <button className="company-button mt-6" type="submit">
                Send Inquiry
                <ArrowUpRight size={17} />
              </button>
              <p role="status" className="mt-4 text-sm leading-6 text-slate-500">
                {status}
              </p>
            </form>
          </Reveal>
        </Container>
      </section>
      <Associates />
    </>
  );
}
