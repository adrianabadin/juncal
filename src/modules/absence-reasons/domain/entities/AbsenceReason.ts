interface AbsenceReasonProps {
  id: string;
  name: string;
  isDefault: boolean;
  isActive: boolean;
}

export class AbsenceReason {
  private constructor(private props: AbsenceReasonProps) {}
  static fromPersistence(props: AbsenceReasonProps): AbsenceReason {
    return new AbsenceReason(props);
  }

  get id(): string { return this.props.id; }
  get name(): string { return this.props.name; }
  get isDefault(): boolean { return this.props.isDefault; }
  get isActive(): boolean { return this.props.isActive; }

  rename(name: string): void { this.props.name = name; }
  deactivate(): void { this.props.isActive = false; }

  // Default reasons are protected: they may be renamed or deactivated but never
  // hard-deleted (enforced by DeleteAbsenceReason).
  canDelete(): boolean { return !this.props.isDefault; }
}
