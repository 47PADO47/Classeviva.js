interface User {
    name?: string;
    surname?: string;
    id?: number | string;
};

type Headers = {
    [key: string]: string;
};

type FetchType = "students" | "parents";
type FetchMethod = "GET" | "POST";
interface FetchResponse {
    status?: number;
    data?: Json | Buffer;
}
interface LoginResponse {
    ident?: string,
    firstName?: string,
    lastName?: string,
    token?: string,
    showPwdChangeReminder?: boolean,
    release?: string,
    expire?: string,
};

type AgendaFilter = "all" | "homework" | "other";

interface TalkOptions {
    cell?: string,
    [key: string]: string | number | undefined,
};

type Json = Error | Overview | any;

interface Error {
    statusCode?: number,
    message?: string,
    error?: string,
};

interface Overview {
    virtualClassesAgenda?: unknown[],
    lessons?: Lesson[],
    agenda?: AgendaEvent[],
    grades?: AgendaGrades[],
    note?: AgendaNotes
};

type Lesson = {
    evtId?: number,
    evtDate?: string,
    evtCode?: string,
    evtHPOS?: number,
    evtDuration?: number,
    classDesc?: string,
    authorName?: string,
    subjectId?: number,
    subjectCode?: string,
    subjectDesc?: string,
    lessonType?: string,
    lessonArg?: string,
};

type AgendaEvent = {
    evtId?: number,
    evtCode?: string,
    evtDatetimeBegin?: string,
    evtDatetimeEnd?: string,
    isFullDay?: boolean,
    notes?: string,
    evtHpos?: number,
    evtValue?: number,
    isJustified?: boolean,
    justifReasonCode?: string,
    justifReasonDesc?: string,
    hoursAbsence?: unknown[],
};

type AgendaNotes = {
    NTTE: NTTE[],
    NTCL: unknown[],
    NTWN: NTWN[],
    NTST: unknown[],
};

type AgendaGrades = {
    subjectId?: number,
    subjectCode?: string,
    subjectDesc?: string,
    evtId?: number,
    evtCode?: string,
    evtDate?: string,
    decimalValue?: number,
    displayValue?: string,
    displaPos?: number,
    notesForFamily?: string,
    color?: colorType,
    canceled?: boolean,
    underlined?: boolean,
    periodPos?: number,
    periodDesc?: string,
    componentPos?: number,
    componentDesc?: string,
    weightFactor?: number,
    skillId?: number,
    gradeMasterId?: number,
    skillDesc?: string,
    skillCode?: string,
    skillMasterId?: number,
    skillValueDesc?: string,
    skillValueShortDesc?: string,
    oldskillId?: number,
    oldskillDesc?: string,
};

type colorType = "red" | "green" | "blue";

type NTTE = {
    evtId?: number,
    evtText?: string,
    evtDate?: string,
    authorName?: string,
    readStatus?: boolean,
};

type NTWN = {
    evtId?: number,
    evtText?: string,
    evtDate?: string,
    authorName?: string,
    readStatus?: boolean,
    warningType?: string,
};

export {
    User,
    Headers,
    FetchType,
    FetchMethod,
    FetchResponse,
    LoginResponse,
    AgendaFilter,
    TalkOptions,
    Overview
};