// Shared content container: max-width 1080px, 24px horizontal padding,
// per the site-wide design tokens. Every page-level section should wrap
// its content in this rather than picking its own max-width. `wide`
// (1280px) is reserved for the deal details page.
export function Container({
  as: Tag = "div",
  className = "",
  wide = false,
  children,
}: {
  as?: "div" | "ol" | "ul" | "section";
  className?: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Tag className={`mx-auto ${wide ? "max-w-content-wide" : "max-w-content"} px-6 ${className}`}>
      {children}
    </Tag>
  );
}
