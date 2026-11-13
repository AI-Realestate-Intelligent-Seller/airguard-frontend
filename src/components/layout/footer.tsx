import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/motion/reveal";
import { AnimatedLogo } from "@/components/motion/animated-logo";
import { footerConnect, footerLearnMore } from "@/data/nav";

// lucide-react dropped trademarked brand marks, so these three are inlined.
const socialIcons = {
  Facebook: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-5">
      <path d="M13.5 21v-7.5h2.5l.5-3h-3V8.5c0-.9.25-1.5 1.5-1.5H16.5V4.3c-.27-.04-1.2-.12-2.27-.12-2.25 0-3.73 1.37-3.73 3.9V10.5H8v3h2.5V21h3Z" />
    </svg>
  ),
  Instagram: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="size-5">
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
      <circle cx="12" cy="12" r="3.8" />
      <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  ),
  LinkedIn: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-5">
      <path d="M6.94 8.5H4.56V19h2.38V8.5ZM5.75 4.1a1.38 1.38 0 1 0 0 2.76 1.38 1.38 0 0 0 0-2.76ZM19.44 19h-2.38v-5.4c0-1.29-.46-2.17-1.6-2.17-.87 0-1.39.59-1.62 1.15-.08.2-.1.49-.1.78V19h-2.38s.03-9.47 0-10.5h2.38v1.49c.32-.49 .88-1.19 2.14-1.19 1.56 0 2.73 1.02 2.73 3.22V19Z" />
    </svg>
  ),
  YouTube: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-5">
      <path d="M21.6 7.2a2.7 2.7 0 0 0-1.9-1.9C18 4.8 12 4.8 12 4.8s-6 0-7.7.5a2.7 2.7 0 0 0-1.9 1.9A28 28 0 0 0 1.9 12a28 28 0 0 0 .5 4.8 2.7 2.7 0 0 0 1.9 1.9c1.7.5 7.7.5 7.7.5s6 0 7.7-.5a2.7 2.7 0 0 0 1.9-1.9A28 28 0 0 0 22.1 12a28 28 0 0 0-.5-4.8ZM9.8 15.3V8.7l5.6 3.3-5.6 3.3Z" />
    </svg>
  ),
};

const socialLinks: Record<keyof typeof socialIcons, string> = {
  Facebook: "https://www.facebook.com/AirGuard-Health-101255981989735",
  Instagram: "https://www.instagram.com/airguardhealth/",
  LinkedIn: "https://www.linkedin.com/company/airguard-health/",
  YouTube: "https://www.youtube.com/channel/UCW9aBhFHUpDB6D5a0GZnnsg",
};

export function Footer() {
  return (
    <footer className="bg-navy text-white">
      {/* Phones: address and Learn More side by side, Connect across the row below. md+: three columns. */}
      <Container className="grid grid-cols-[1.3fr_1fr] gap-x-5 gap-y-10 py-16 md:grid-cols-3 md:gap-10 md:py-20">
        <Reveal from="left" className="min-w-0">
          <Link href="/" className="inline-flex">
            <AnimatedLogo size={64} rings={2} particleCount={10} glow alt="AirGuard" />
          </Link>
          <address className="mt-4 text-sm not-italic text-white/70 leading-relaxed">
            AirGuard Health
            <br />
            21200 S. LaGrange Rd, Suite 142
            <br />
            Frankfort, IL 60423
            <br />
            <Link href="mailto:info@airguardhealth.com" className="hover:text-white">
              info@<wbr />airguardhealth.com
            </Link>
            <br />
            <Link href="tel:+18774123405" className="hover:text-white">
              (877) 412-3405
            </Link>
          </address>
        </Reveal>

        <Reveal delay={0.08} className="min-w-0">
          <h4 className="text-sm font-medium text-white/90">Learn More</h4>
          <ul className="mt-4 space-y-2">
            {footerLearnMore.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-sm text-white/70 hover:text-white">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal from="right" delay={0.16} className="col-span-2 md:col-span-1">
          <h4 className="text-sm font-medium text-white/90">Connect</h4>
          <ul className="mt-4 space-y-2">
            {footerConnect.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-sm text-white/70 hover:text-white">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex gap-3">
            {Object.entries(socialIcons).map(([name, icon]) => (
              <Link
                key={name}
                href={socialLinks[name as keyof typeof socialIcons]}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={name}
                className="text-white/70 hover:text-white"
              >
                {icon}
              </Link>
            ))}
          </div>
        </Reveal>
      </Container>

      <div className="border-t border-white/10 py-6">
        <Container>
          <p className="text-xs text-white/50">
            &copy; 2026 AirGuard Health. All rights reserved.
          </p>
        </Container>
      </div>
    </footer>
  );
}
