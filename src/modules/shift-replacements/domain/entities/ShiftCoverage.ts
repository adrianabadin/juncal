import { CoverageOrigin } from "@shift-replacements/domain/enums/CoverageOrigin";

interface CoverageProps {
  id: string;
  shiftReplacementId: string;
  applicantId: string;
  start: Date;
  end: Date;
  origin: CoverageOrigin;
}

export class ShiftCoverage {
  private constructor(private props: CoverageProps) {}

  static fromPersistence(props: CoverageProps): ShiftCoverage {
    return new ShiftCoverage({ ...props });
  }

  get id(): string { return this.props.id; }
  get shiftReplacementId(): string { return this.props.shiftReplacementId; }
  get applicantId(): string { return this.props.applicantId; }
  get start(): Date { return this.props.start; }
  get end(): Date { return this.props.end; }
  get origin(): CoverageOrigin { return this.props.origin; }

  get durationMinutes(): number {
    return Math.max(0, (this.props.end.getTime() - this.props.start.getTime()) / 60000);
  }
}
