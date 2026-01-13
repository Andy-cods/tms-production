"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/leader/inbox", label: "Inbox" },
  { href: "/leader/team", label: "Team" },
  { href: "/leader/requests", label: "All Requests" },
];

export default function LeaderTabs() {
  const pathname = usePathname();
  return (
    <div className="border-b">
      <nav className="flex gap-4 text-sm">
        {tabs.map((t) => {
          const active = pathname === t.href || pathname.startsWith(t.href + "/");
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`px-3 py-2 -mb-px border-b-2 ${active ? "border-gray-900 text-gray-900" : "border-transparent hover:border-gray-300 text-gray-600"}`}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}


