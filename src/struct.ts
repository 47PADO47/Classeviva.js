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
    data?: any;
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

export {
    User,
    Headers,
    FetchType,
    FetchMethod,
    FetchResponse,
    LoginResponse,
    AgendaFilter,
    TalkOptions,
};