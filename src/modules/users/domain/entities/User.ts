import { Role } from "@users/domain/enums/Role";

interface UserProps {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  isActive: boolean;
  role: Role;
}

export class User {
  private constructor(private props: UserProps) {}

  static fromPersistence(props: UserProps): User {
    return new User({ ...props });
  }

  get id(): string { return this.props.id; }
  get email(): string { return this.props.email; }
  get role(): Role { return this.props.role; }
  get isActive(): boolean { return this.props.isActive; }
  get passwordHash(): string { return this.props.passwordHash; }

  activate(): void { this.props.isActive = true; }
  isCoordinator(): boolean { return this.props.role === Role.COORDINATOR; }
  canParticipate(): boolean { return this.props.isActive; }
}
