import { Result, ok, err } from "@shared/domain/Result";
import { DomainError } from "@shared/domain/DomainError";
import { RequestState } from "@shift-replacements/domain/enums/RequestState";

interface ShiftProps {
  id: string;
  date: Date;
  state: RequestState;
  requesterId: string;
  specialtyId: string;
  moduleHours: number;
  requesterStart: Date;
  requesterEnd: Date;
  resolvedById: string | null;
  absenceReasonId: string | null;
  observation: string | null;
  bajoFactura: boolean;
}

type Transition = Result<void, DomainError>;

// Aggregate raíz: la SOLICITUD de reemplazo (la guardia a cubrir).
// La cobertura concreta vive en ShiftCoverage (una guardia puede tener varias).
// El coordinador confirma o rechaza la solicitud completa; puede confirmar aun
// cuando queden huecos sin cubrir.
export class ShiftReplacement {
  private constructor(private props: ShiftProps) {}

  static fromPersistence(props: ShiftProps): ShiftReplacement {
    return new ShiftReplacement({ ...props });
  }

  get id(): string { return this.props.id; }
  get state(): RequestState { return this.props.state; }
  get resolvedById(): string | null { return this.props.resolvedById; }
  get requesterId(): string { return this.props.requesterId; }
  get specialtyId(): string { return this.props.specialtyId; }
  get date(): Date { return this.props.date; }
  get moduleHours(): number { return this.props.moduleHours; }
  get requesterStart(): Date { return this.props.requesterStart; }
  get requesterEnd(): Date { return this.props.requesterEnd; }
  get absenceReasonId(): string | null { return this.props.absenceReasonId; }
  get observation(): string | null { return this.props.observation; }
  get bajoFactura(): boolean { return this.props.bajoFactura; }

  get isOpen(): boolean { return this.props.state === RequestState.OPEN; }

  confirm(coordinatorId: string): Transition {
    if (this.props.state !== RequestState.OPEN)
      return err(new DomainError("INVALID_TRANSITION", "Solo se confirma una solicitud abierta"));
    this.props.resolvedById = coordinatorId;
    this.props.state = RequestState.CONFIRMED;
    return ok(undefined);
  }

  rejectRequest(coordinatorId: string): Transition {
    if (this.props.state !== RequestState.OPEN)
      return err(new DomainError("INVALID_TRANSITION", "La solicitud ya está cerrada"));
    this.props.resolvedById = coordinatorId;
    this.props.state = RequestState.REJECTED;
    return ok(undefined);
  }
}
