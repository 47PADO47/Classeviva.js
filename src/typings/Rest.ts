interface ClassOptions {
    username?: string;
    password?: string;
    state?: string;
    app?: string;
}
interface User {
    name?: string;
    surname?: string;
    id?: number | string;
    ident?: string;
    type?: string;
    school?: UserSchool;
}

type UserSchool = {
    name?: string;
    dedication?: string;
    city?: string;
    province?: string;
    code?: string | number;
};

type Headers = {
    [key: string]: string;
};

type FetchType = "students" | "parents" | "users";
type FetchMethod = "GET" | "POST";
type FetchId = "userId" | "userIdent";

interface FetchResponse {
    status: number;
    data: Json | Buffer;
}
interface LoginResponse {
    ident: string,
    firstName: string,
    lastName: string,
    token: string,
    showPwdChangeReminder: boolean,
    release: string,
    expire: string,
}

type AgendaFilter = "all" | "homework" | "other";

interface TalkOptions {
    cell?: string,
    [key: string]: string | number | undefined,
}

type Json = ResponseError | Overview | any;

interface ResponseError {
    statusCode: number,
    message: string,
    error: string,
}

interface Overview {
    virtualClassesAgenda: unknown[],
    lessons: Lesson[],
    agenda: AgendaEvent[],
    grades: Grade[],
    note: AgendaNotes
}

type Lesson = {
    evtId: number,
    evtDate: string,
    evtCode: string,
    evtHPOS: number,
    evtDuration: number,
    classDesc: string,
    authorName: string,
    subjectId: number,
    subjectCode: string,
    subjectDesc: string,
    lessonType: string,
    lessonArg: string,
};

type AgendaEvent = {
    evtId: number,
    evtCode: string,
    evtDatetimeBegin: string,
    evtDatetimeEnd: string,
    isFullDay: boolean,
    notes: string,
    evtHpos: number,
    evtValue: number,
    isJustified: boolean,
    justifReasonCode: string,
    justifReasonDesc: string,
    hoursAbsence: unknown[],
};

type AgendaNotes = {
    NTTE: NTTE[],
    NTCL: unknown[],
    NTWN: NTWN[],
    NTST: unknown[],
};

type Grade = {
    subjectId: number,
    subjectCode: string,
    subjectDesc: string,
    evtId: number,
    evtCode: string,
    evtDate: string,
    decimalValue: number,
    displayValue: string,
    displaPos: number,
    notesForFamily: string,
    color: colorType,
    canceled: boolean,
    underlined: boolean,
    periodPos: number,
    periodDesc: string,
    componentPos: number,
    componentDesc: string,
    weightFactor: number,
    skillId: number,
    gradeMasterId: number,
    skillDesc: string,
    skillCode: string,
    skillMasterId: number,
    skillValueDesc: string,
    skillValueShortDesc: string,
    oldskillId: number,
    oldskillDesc: string,
};

type colorType = "red" | "green" | "blue";

type NTTE = {
    evtId: number,
    evtText: string,
    evtDate: string,
    authorName: string,
    readStatus: boolean,
};

type NTWN = {
    evtId: number,
    evtText: string,
    evtDate: string,
    authorName: string,
    readStatus: boolean,
    warningType: string,
};

type Card = {
    ident: string,
    usrType: string,
    usrId: number | string,
    miurSchoolCode: string,
    miurDivisionCode: string,
    firstName: string,
    lastName: string,
    birthDate: string,
    fiscalCode: string,
    schCode: string,
    schName: string,
    schDedication: string,
    schCity: string,
    schProv: string,
};

type ContentElement = {
    id_contenuto: number,
    posizione: string,
    ordine: number,
    tags: unknown,
    inizio: string,
    fine: string,
    scadenza: unknown,
    pubblicato: number,
    visibile_prima_inizio: number,
    tipo: string,
    nome: string,
    link: string,
    opens_externally: boolean,
    contenuto_html: string,
    immagine_generata: string,
    accessibility_label: string,
    banner: string,
    banner_pos: string,
};

interface TermsAgreementResponse {
    schoolpass: number,
    bitmask: number,
    data_accettazione: string,
}

interface setTermsAgreementResponse {
    msg: string,
}

interface readOptions {
    sign?: boolean,
    join?: boolean,
    text?: string,
}

interface TokenStatus {
    status: {
        expire: string,
        release: string,
        ident: string,
        remains: number,
    }
}

interface TicketResponse {
    ticket: string,
    len: number,
    ulen: number,
    md5: string,
}

interface checkDocument {
    document: {
        avaible: boolean,
    }
}

interface absences {
    evtId: number,
    evtCode: string,
    evtDate: string,
    evtHPos: number | null,
    evtValue: number | null,
    isJustified: boolean,
    justifReasonCode: string,
    justifReasonDesc: string,
}

interface readNotice {
    item: {
        text: string,
        title: string
    },
    reply: {
        replFile: unknown | null,
        replText: string | null,
        replJoin: boolean | null,
        replSign: boolean | null,
    }
}

interface calendarDay {
    dayDate: string,
    dayOfWeek: number,
    status: "HD" | "NW" | "SD"
}

export {
    ClassOptions,
    User,
    Headers,
    FetchType,
    FetchMethod,
    FetchId,
    FetchResponse,
    LoginResponse,
    AgendaFilter,
    TalkOptions,
    Overview,
    Card,
    ContentElement,
    TermsAgreementResponse,
    setTermsAgreementResponse,
    readOptions,
    TokenStatus,
    TicketResponse,
    checkDocument,
    absences,
    readNotice,
    Grade,
    calendarDay
};