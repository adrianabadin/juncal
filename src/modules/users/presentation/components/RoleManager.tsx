"use client";

import { useState } from "react";
import {
  changeUserRoleAction,
  ActiveUserDto,
} from "@users/presentation/actions/userAdminActions";
import { Role } from "@users/domain/enums/Role";
import Card from "@shared/presentation/ui/Card";

interface RoleManagerProps {
  initialUsers: ActiveUserDto[];
  currentUserId: string;
}

const roleLabel: Record<Role, string> = {
  BASE_PROFESSIONAL: "Profesional",
  COORDINATOR: "Coordinador",
};

export default function RoleManager({
  initialUsers,
  currentUserId,
}: RoleManagerProps) {
  const [users, setUsers] = useState<ActiveUserDto[]>(initialUsers);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(userId: string, role: Role) {
    setError(null);
    setSavingId(userId);
    // optimistic
    const prev = users;
    setUsers((list) =>
      list.map((u) => (u.id === userId ? { ...u, role } : u)),
    );
    const result = await changeUserRoleAction({ userId, role });
    setSavingId(null);
    if (!result.ok) {
      setUsers(prev); // rollback
      setError(result.error);
    }
  }

  if (users.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No hay usuarios activos.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {users.map((u) => {
          const isSelf = u.id === currentUserId;
          const selectId = `role-${u.id}`;
          return (
            <Card key={u.id}>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900">
                    {u.name}
                    {isSelf && (
                      <span className="ml-1 text-xs text-muted-foreground">
                        (vos)
                      </span>
                    )}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {u.email}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <label htmlFor={selectId} className="sr-only">
                    Rol de {u.name}
                  </label>
                  <select
                    id={selectId}
                    value={u.role}
                    disabled={isSelf || savingId === u.id}
                    onChange={(e) =>
                      handleChange(u.id, e.target.value as Role)
                    }
                    className="min-h-11 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-500 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                  >
                    <option value={Role.BASE_PROFESSIONAL}>
                      {roleLabel.BASE_PROFESSIONAL}
                    </option>
                    <option value={Role.COORDINATOR}>
                      {roleLabel.COORDINATOR}
                    </option>
                  </select>
                  {savingId === u.id && (
                    <span className="text-xs text-muted-foreground">
                      Guardando…
                    </span>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
