import { NavLink as RouterNavLink } from "react-router-dom";
import type { NavLinkProps } from "react-router-dom";
import { forwardRef } from "react";
import { cn } from "../lib/utils";

interface NavLinkCompatProps extends Omit<NavLinkProps, "className"> {
  className?: string;
  activeClassName?: string;
  pendingClassName?: string;
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  ({ className, activeClassName, pendingClassName, to, ...props }, ref) => {
    return (
      <RouterNavLink
        ref={ref}
        to={to}
        className={({ isActive, isPending }) =>
          cn(
            // Base styles
            "relative inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold transition-all duration-200 rounded-lg",
            // Default state
            "text-slate-400 hover:text-slate-200 hover:bg-white/5",
            // Active state with gradient underline
            isActive && "text-cyan-400",
            // Custom classes
            className,
            isActive && activeClassName,
            isPending && pendingClassName
          )
        }
        style={{
          textDecoration: "none"
        }}
        {...props}
      />
    );
  },
);

NavLink.displayName = "NavLink";

export { NavLink };