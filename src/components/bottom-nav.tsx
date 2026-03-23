"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Swords, MessageCircle, ShoppingBag, User } from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", icon: BarChart3, label: "Legado" },
  { href: "/missions", icon: Swords, label: "Missoes" },
  { href: "/mentor", icon: MessageCircle, label: "Mentor" },
  { href: "/store", icon: ShoppingBag, label: "Loja" },
  { href: "/hero", icon: User, label: "Heroi" },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bg-background/95 backdrop-blur-md border-t border-border px-2 pb-[env(safe-area-inset-bottom)] pt-1">
      <div className="flex justify-around">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");

          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
                isActive
                  ? "text-primary bg-primary/8"
                  : "text-muted-foreground"
              }`}
            >
              <Icon
                className="w-5 h-5"
                style={
                  isActive
                    ? {
                        filter:
                          "drop-shadow(0 0 4px oklch(0.78 0.14 195 / 0.6)) drop-shadow(0 0 8px oklch(0.78 0.14 195 / 0.3))",
                      }
                    : undefined
                }
              />
              <span className="text-[10px] font-medium uppercase tracking-wider">
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
