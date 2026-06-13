import { Result, ok, err } from "@shared/domain/Result";
import { DomainError } from "@shared/domain/DomainError";
import { RequestState } from "@shift-replacements/domain/enums/RequestState";

interface ShiftProps {
  id: string;
  date: Date;
  state: RequestState;
  requesterId: string;
  specialtyId: string;
  applicantId: string | null;
  resolvedById: string | null;
}

type Transition = Result<void, DomainError>;

export class ShiftReplacement {
  private constructor(private props: ShiftProps) {}

  static fromPersistence(props: ShiftProps): ShiftReplacement {
    return new ShiftReplacement(props);
  }

  get id(): string { return this.props.id; }
  get state(): RequestState { return this.props.state; }
  get applicantId(): string | null { return this.props.applicantId; }
  get resolvedById(): string | null { return this.props.resolvedById; }
  get requesterId(): string { return this.props.requesterId; }
  get specialtyId(): string { return this.props.specialtyId; }
  get date(): Date { return this.props.date; }

  postulate(applicantId: string): Transition {
    if (this.props.state !== RequestState.OPEN)
      return err(new DomainError("INVALID_TRANSITION", "Solo se postula sobre una solicitud OPEN"));
    if (applicantId === this.props.requesterId)
      return err(new DomainError("SELF_POSTULATION", "No podés postularte a tu propia solicitud"));
    this.props.applicantId = applicantId;
    this.props.state = RequestState.POSTULATED;
    return ok(undefined);
  }

  rejectPostulation(coordinatorId: string): Transition {
    if (this.props.state !== RequestState.POSTULATED)
      return err(new DomainError("INVALID_TRANSITION", "No hay postulación para rechazar"));
    this.props.applicantId = null;
    this.props.resolvedById = coordinatorId;
    this.props.state = RequestState.OPEN;
    return ok(undefined);
  }

  confirm(coordinatorId: string): Transition {
    if (this.props.state !== RequestState.POSTULATED)
      return err(new DomainError("INVALID_TRANSITION", "Solo se confirma una solicitud POSTULATED"));
    this.props.resolvedById = coordinatorId;
    this.props.state = RequestState.CONFIRMED;
    return ok(undefined);
  }

  rejectRequest(coordinatorId: string): Transition {
    if (this.props.state === RequestState.CONFIRMED || this.props.state === RequestState.REJECTED)
      return err(new DomainError("INVALID_TRANSITION", "La solicitud ya está cerrada"));
    this.props.resolvedById = coordinatorId;
    this.props.state = RequestState.REJECTED;
    return ok(undefined);
  }
}