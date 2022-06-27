import { HeadersInit } from "node-fetch";

interface ClassOptions {
  cid?: string;
  uid?: string;
  pwd?: string;
  pin?: string;
  target?: string;
}

interface ClassUser {
  cid: string;
  cognome: string;
  nome: string;
  id: number;
  type: string;
}

interface FetchOptions {
  url: string;
  path?: string;
  method?: string;
  body?: string;
  headers?: HeadersInit;
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

export { ClassOptions, ClassUser, FetchOptions, prodotto };
