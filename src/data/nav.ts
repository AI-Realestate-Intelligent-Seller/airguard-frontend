// Header stays minimal by design — everything else lives in the footer.
export const headerNav = [
  { label: "Products", href: "/products" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
] as const;

export const footerLearnMore = [
  { label: "About", href: "/about" },
  { label: "Technology", href: "/scientific-research/xp#technology" },
  { label: "FAQs", href: "/products#faqs" },
  { label: "XP Models", href: "/products/xp" },
  { label: "Research", href: "/research" },
  { label: "Book Store", href: "/#book-store" },
] as const;

export const footerConnect = [
  { label: "Contact Us", href: "/contact" },
  { label: "Customer Support", href: "/contact" },
  { label: "Terms of Service", href: "/terms-of-service" },
] as const;
