interface SpecialtyProps {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
}

export class Specialty {
  private constructor(private props: SpecialtyProps) {}
  static fromPersistence(props: SpecialtyProps): Specialty { return new Specialty(props); }

  get id(): string { return this.props.id; }
  get name(): string { return this.props.name; }
  get description(): string | null { return this.props.description; }
  get isActive(): boolean { return this.props.isActive; }

  rename(name: string): void { this.props.name = name; }
  updateDescription(description: string | null): void { this.props.description = description; }
  deactivate(): void { this.props.isActive = false; }
}
