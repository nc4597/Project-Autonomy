// Shared content container: max-width 1080px, 24px horizontal padding,
// per the site-wide design tokens. Every page-level section should wrap
// its content in this rather than picking its own max-width.
export function Container({
  as: Tag = "div",
  className = "",
  children,
}: {
  as?: "div" | "ol" | "ul" | "section";
  className?: string;
  children: React.ReactNode;
}) {
  return <Tag className={`mx-auto max-w-content px-6 ${className}`}>{children}</Tag>;
}
