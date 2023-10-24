import { userTypesKeys } from "../base/enums";
import { Dispatcher } from "undici";
import { WithLoggingOptions } from "../interfaces/logging";

type LoginOptions = {
    email: string;
    password: string;
}
interface ClassOptions extends Partial<LoginOptions>, Partial<WithLoggingOptions> {}

type User = {
    alt_cell: string | null;
    alt_codfis: string | null;
    alt_fbuid: string | null;
    alt_nickname: string | null;
    auth_string: string;
    auth_type: string;
    cognome: string;
    dinsert: string;
    id: string;
    nome: string;
    password_changed: string | null;
}

type Account = {
    account_desc: string;
    account_string: string;
    account_type?: userTypesKeys;
    dinsert: string;
    id: string;
    nome: string;
    scuola_descrizione: string;
    scuola_intitolazione: string;
    scuola_luogo: string;
    sede_codice: string;
    target: string;
    wsc_cat: string;
}

type FetchBody = {
    a: string;
} & Record<string, string | number>;

interface FetchOptions extends Partial<Omit<Dispatcher.RequestOptions, 'body'>> {
  url: string;
  body?: FetchBody;
  OAS?: boolean;
}

type AuthObject = {
    u: string;
    p: string;
    c?: string;
};

type msgTargets = {
    classi: unknown[];
    gruppi: unknown[];
    persone: unknown[];
};

type addressBook = {
    [key: string]: contact;
};

type contact = {
    sede_codice: string;
    cognome: string | null;
    nome: string | null;
    data_nascita: string | null;
    ident: string;
    gruppi?: number[];
}

type group = {
    id: string;
    source_type: "cvv_classe" | string;
    source_ident: string;
    anno_scol: string;
    sede_codice: string;
    plesso_mecc: string;
    tipo_progetto: string | null;
    gruppo_nome: string;
    gruppo_sdesc: string | null;
    gruppo_ldesc?: string | null;
    gruppo_infoxml?: string | null;
    gruppo_stato: string;
    tipo_adesione: string;
    tipo_alimentazione: string;
    dinsert: string;
    gruppo_foto?: string | null
}

type contactInfo = {
    avatar: "/img/persona_x200.png" | string;
    name: string;
    utype: userTypesKeys;
}

export {
    LoginOptions,
    ClassOptions,
    User,
    Account,
    FetchOptions,
    AuthObject,

    msgTargets,
    addressBook,
    group,
    contactInfo,
}