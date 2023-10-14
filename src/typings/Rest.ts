import { BodyInit, HeadersInit } from "node-fetch";
import { State, App, userType, userTypesKeys } from "../Enums";

interface ClassOptions {
    username?: string;
    password?: string;
    state?: State;
    app?: App;
    debug?: boolean;
    saveTempFile?: boolean;
    keepAlive?: boolean;
}
interface User {
    name?: string;
    surname?: string;
    id?: number | string;
    ident?: string;
    type?: userType;
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

type FetchType = "students" | "parents" | "users" | (string & {});
type FetchMethod = "GET" | "POST" | "PUT";
type FetchId = "userId" | "userIdent";
type FetchResponseType = "json" | "buffer" | "text";

interface BaseFetchOptions {
    method?: FetchMethod;
    body?: BodyInit;
    responseType?: FetchResponseType;
    customHeaders?: HeadersInit; 
}

interface FetchOptions extends BaseFetchOptions {
    url: string;
}

interface RestFetchOptions extends BaseFetchOptions {
    path?: string;
    type?: FetchType;
    id?: FetchId;
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
    agenda: AgendaAssignment[],
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

type AgendaAssignment = {
    evtId: number;
    evtCode: string;
    evtDatetimeBegin: string;
    evtDatetimeEnd: string;
    isFullDay: boolean;
    notes: string;
    authorName: string;
    classDesc: string;
    subjectId: number | null;
    subjectDesc: string | null;
    homeworkId: number | null;
};

type AgendaNotes = {
    NTTE: Note[],
    NTCL: Note[],
    NTWN: NTWN[],
    NTST: Note[],
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

interface Note {
    evtId: number,
    evtText: string,
    evtDate: string,
    authorName: string,
    readStatus: boolean,
};

type NTWN = Note & {
    warningType: string,
};

type Card = {
    ident: string,
    usrType: userTypesKeys,
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

interface resetPassword {
    status: boolean,
    data: 0,
    err: string,
    htm: string,
}

interface readNote {
    evtCode: keyof AgendaNotes,
    evtId: number,
    evtText: string,
}

interface Term {
    contents: string,
    content_type_id: string,
    has_accepted: boolean,
    set_date: string,
    version: string,
}

interface MinigameToken {
    minigameToken: string;
    for: string
}

interface Homeworks {
    items: any[]
}

type MinigameScope = 'all' | 'school' | 'class';
type MinigamePosition = {
    name: string;
    score: string;
}
type MinigamePlayer = MinigamePosition & {
    position: number;
}

interface MinigameLeaderboard {
    player: MinigamePlayer;
    positions: MinigamePosition[];
}

type SchoolDiary = {
    id_diario: number;
    nome_diario: string;
}

interface SchoolCheck {
    diaries: SchoolDiary[];
    cvv: boolean;
    show_privacy: boolean;
}

interface Book {
    bookId: number;
    isbnCode: string;
    title: string;
    subheading: string | null;
    volume: string;
    author: string;
    publisher: string;
    subjectDesc: string;
    price: number;
    toBuy: boolean;
    newAdoption: boolean;
    alreadyOwned: boolean;
    alreadyInUse: boolean;
    recommended: boolean;
    recommendedFor: string | null;
    coverUrl: string | null;
    publisherUnlockCode: string;
}

interface CourseBooks {
    courseId: number;
    courseDesc: string;
    books: Book[];
}
 
interface SchoolBooksResponse {
    schoolbooks: CourseBooks[]
}

type NoticeAttachment = {
    fileName: string;
    attachNum: number;
};
  
type Notice = {
    pubId: number;
    pubDT: string;
    readStatus: boolean;
    evtCode: string;
    cntId: number;
    cntValidFrom: string;
    cntValidTo: string;
    cntValidInRange: boolean;
    cntStatus: string;
    cntTitle: string;
    cntCategory: string;
    cntHasChanged: boolean;
    cntHasAttach: boolean;
    needJoin: boolean;
    needReply: boolean;
    needFile: boolean;
    needSign: boolean;
    evento_id: string;
    dinsert_allegato: string;
    attachments: NoticeAttachment[];
};

export {
    ClassOptions,
    User,
    Headers,
    FetchOptions,
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
    calendarDay,
    resetPassword,
    AgendaNotes,
    readNote,
    Term,
    RestFetchOptions,
    MinigameToken,
    Homeworks,
    MinigameScope,
    MinigameLeaderboard,
    SchoolCheck,
    Book,
    CourseBooks,
    SchoolBooksResponse,
    Notice,
};