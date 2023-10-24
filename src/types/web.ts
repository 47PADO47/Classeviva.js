import { Dispatcher } from "undici";
import { WithLoggingOptions } from "../interfaces/logging";

type LoginData = {
  cid?: string;
  uid: string;
  pwd: string;
  pin?: string;
  target?: string;
}

interface ClassOptions extends Partial<WithLoggingOptions> {
  credentials?: LoginData;
}

interface ClassUser {
  cid: string;
  cognome: string;
  nome: string;
  id: number;
  type: string;
}

interface FetchOptions extends Partial<Dispatcher.RequestOptions> {
  url: string;
  json?: boolean;
}

type prodotto =
  | "set"
  | "cvv"
  | "oas"
  | "ldt"
  | "sdg"
  | "acd"
  | "vrd"
  | "e2c"
  | "cvp";

export { LoginData, ClassOptions, ClassUser, FetchOptions, prodotto };
