import Link from "next/link";
import Logo from "./Logo";
import LogoutButton from "@users/presentation/components/LogoutButton";

interface AppHeaderProps {
  name: string;
  roleLabel: string;
  isCoordinator: boolean;
}

interface NavLink {
  href: string;
  label: string;
}

export default function AppHeader({
  name,
  roleLabel,
  isCoordinator,
}: AppHeaderProps) {
  const links: NavLink[] = [
    { href: "/worklist", label: "Mi especialidad" },
    ...(isCoordinator
      ? [
          { href: "/coordinator", label: "General" },
          { href: "/specialties", label: "Especialidades" },
          { href: "/motivos", label: "Motivos" },
          { href: "/users", label: "Cuentas" },
        ]
      : []),
  ];

  return (
    <header className="sticky top-0 z-40 bg-brand-600 text-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            aria-label="Inicio"
            className="rounded-md bg-white px-2 py-1 shadow-sm"
          >
            <Logo height={36} priority />
          </Link>
          <span className="hidden text-sm font-medium text-white/90 sm:block">
            Gestión de Guardias
          </span>
        </div>

        <div className="flex items-center gap-3">
          <nav
            aria-label="Navegación principal"
            className="hidden items-center gap-1 md:flex"
          >
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-white/85 transition-colors hover:bg-brand-700 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden h-8 w-px bg-white/20 md:block" />

          <div className="hidden text-right md:block">
            <p className="text-xs font-medium leading-tight text-white">{name}</p>
            <p className="text-xs leading-tight text-white/70">{roleLabel}</p>
          </div>

          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
