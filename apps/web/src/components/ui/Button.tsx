import Link from "next/link";

export type ButtonVariant = "primary" | "secondary" | "secondary-light" | "dark";

const BASE_CLASSES =
  "inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors disabled:cursor-not-allowed disabled:opacity-40";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-brand-green text-white hover:bg-brand-green-dark",
  secondary: "border border-navy-950 bg-transparent text-navy-950 hover:bg-navy-950/5",
  "secondary-light": "border border-white/40 bg-transparent text-white hover:bg-white hover:text-navy-950",
  dark: "bg-navy-950 text-white hover:bg-navy-900",
};

type CommonProps = {
  variant?: ButtonVariant;
  className?: string;
  children: React.ReactNode;
  arrow?: boolean;
};

type ButtonAsButton = CommonProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & { href?: undefined };

type ButtonAsLink = CommonProps & { href: string };

export function Button(props: ButtonAsButton | ButtonAsLink) {
  const { variant = "primary", className = "", children, arrow = false } = props;
  const classes = `${BASE_CLASSES} ${VARIANT_CLASSES[variant]} ${className}`;
  const content = (
    <>
      {children}
      {arrow && <span aria-hidden="true">&rarr;</span>}
    </>
  );

  if ("href" in props && props.href) {
    return (
      <Link href={props.href} className={classes}>
        {content}
      </Link>
    );
  }

  const {
    href: _href,
    variant: _variant,
    className: _className,
    children: _children,
    arrow: _arrow,
    ...rest
  } = props as ButtonAsButton;
  return (
    <button type="button" {...rest} className={classes}>
      {content}
    </button>
  );
}
