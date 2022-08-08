import fetch, { HeadersInit, RequestInit, Response } from "node-fetch";
import {
  ClassOptions,
  ClassUser,
  FetchOptions,
  prodotto,
} from "../typings/Web";

class Web {
  readonly #data: ClassOptions;
  #token: string;
  authorized: boolean;
  readonly #baseUrl: (path?: string) => string;
  #headers: { [key: string]: string };
  public user: ClassUser;
  /**
   * Web api class constructor
   * @param {ClassOptions} [loginData] Login data
   * @param {string} [loginData.cid] Customer ID (???)
   * @param {string} [loginData.uid] User ID (username)
   * @param {string} [loginData.pwd] User Password
   * @param {string} [loginData.pin] PIN (???)
   * @param {string} [loginData.target] Target (???)
   */
  constructor(
    loginData: ClassOptions = {
      cid: "",
      uid: "",
      pwd: "",
      pin: "",
      target: "",
    }
  ) {
    this.#data = loginData;
    this.#token = "";
    this.authorized = false;

    this.#baseUrl = (path: string = "fml") =>
      `https://web.spaggiari.eu/${path}/app/default/`;
    this.#headers = {
      "X-Requested-With": "XMLHttpRequest",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.5005.63 Safari/537.36 Edg/102.0.1245.33",
    };

    this.user = {
      cid: "",
      cognome: "",
      nome: "",
      id: 0,
      type: "",
    };
  }

  async login(data: ClassOptions = this.#data): Promise<boolean> {
    const url = `${this.#baseUrl("auth-p7")}AuthApi4.php?a=aLoginPwd`;
    const body = new URLSearchParams(Object.entries(data)).toString();

    const response = await fetch(url, {
      method: "POST",
      body,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "X-Requested-With": "XMLHttpRequest",
        Referer: "https://web.spaggiari.eu/home/app/default/login.php",
        Origin: "https://web.spaggiari.eu",
      },
    });

    const json = await response
      .json()
      .catch(() => this.#error("Could not parse JSON"));

    if (json.error && json.error.length > 0) return this.#error(json.error);

    const cookies = response.headers.get("Set-Cookie");
    const cookie = cookies?.split(", ").pop();
    /*
    const values = cookie?.split(';') ?? [''];
    const session = values[0];
    const token = session.split('PHPSESSID=').pop();
    */

    if (!cookie) return this.#error("Login failed (no token)");
    this.setSessionId(cookie);

    if (!json?.data?.auth?.accountInfo) return this.#error("Login failed (no account info)");
    this.user = json.data.auth.accountInfo;

    return this.authorized;
  }

  async getAgenda(
    start: Date = new Date(),
    end: Date = new Date(),
    nascondiAuleVirtuale: boolean = false
  ): Promise<any> {
    const query = new URLSearchParams({
      classe_id: "",
      gruppo_id: "",
      nascondi_av: nascondiAuleVirtuale ? "1" : "0",
      start: this.msToUnix(start).toString(),
      end: this.msToUnix(end).toString(),
    });

    const response = await this.#fetch({
      url: `agenda_studenti.php?ope=get_events&${query.toString()}`,
      path: "fml",
      method: "GET",
      json: false,
    });
    const data = response === "null" ? [] : JSON.parse(response);

    return data;
  }

  async getPortfolio(): Promise<any> {
    const data = await this.#fetch({ url: "get_pfolio.php", path: "tools" });
    return data ?? {};
  }

  async exportXmlAgenda(
    start: Date = new Date(),
    end: Date = new Date(),
    formato: "xml" | "xls" = "xml"
  ): Promise<any> {
    
    const date = new Date();
    const query = new URLSearchParams({
      stampa: ":stampa:",
      report_name: "",
      tipo: "agenda",
      data: `${date.getDay()}+${date.getMonth() + 1}+${date
        .getFullYear()
        .toString()
        .substring(2)}`,
      autore_id: this.user.id.toString(),
      tipo_export: "EVENTI_AGENDA_STUDENTI",
      quad: ":quad:",
      materia_id: "",
      classe_id: ":classe_id:",
      gruppo_id: ":gruppo_id:",
      ope: "RPT",
      dal: `${start.getFullYear()}-${start.getMonth() + 1}-${start.getDate()}`,
      al: `${end.getFullYear()}-${end.getMonth() + 1}-${end.getDate()}`,
      formato,
    });

    const response = await this.#fetch({
      url: `xml_export.php?${query.toString()}`,
      method: "GET",
      json: false,
    });

    return response;
  }

  async getUnreadMessages(): Promise<number | undefined> {
    const response = await this.#fetch({
      url: "SocMsgApi.php?a=acGetUnreadCount",
      path: "sps",
    });
    return response?.OAS?.unread?.totCount ?? undefined;
  }

  async getUsername(): Promise<{ name?: string; username?: string }> {
    const response = await this.#fetch({
      url: "get_username.php",
      path: "tools",
    });
    return response ?? {};
  }

  async getDocumentionList(
    prodotto: prodotto | "" = "",
    cerca: string = ""
  ): Promise<any> {
    const response = await this.#fetch({
      url: `documentazione.xhr.php?act=get_faq_autocomplete&prodotto=${prodotto}&find=${cerca}`,
      path: "acc",
    });
    return response ?? {};
  }

  async getDocumentationUrl(prodotto: prodotto, id: number): Promise<string> {
    return `${this.#baseUrl("acc")}documentazione.php?prodotto=${prodotto}&cerca=d:${id}`;
  }

  async getAvatar(): Promise<any> {
    const response = await this.#fetch({
      url: "get_avatar.php",
      path: "tools",
    });
    return response ?? {};
  }

  async getAcGooBApiKey(): Promise<string> {
    const response = await this.#fetch({
      url: "SocMsgApi.php?a=acGooBApiK",
      path: "sps",
    });
    return response?.OAS?.gooBApiK ?? "";
  }

  async getRubrica(): Promise<any> {
    const response = await this.#fetch({
      url: "SocMsgApi.php?a=acGetRubrica",
      path: "sps",
    });
    return response?.OAS?.targets ?? {};
  }

  async getMessages(): Promise<any> {
    const query = new URLSearchParams({
      anyt: "0",
      ctx: "",
      hmid: "0",
      ignpf: "0",
      mid: "0",
      mmid: "0",
      mpp: "20",
      nosp: "0",
      nwth: "0",
      p: "1",
      search: "",
      unreadOnly: "0",
      _stkx: "",
    });

    const response = await this.#fetch({
      url: "SocMsgApi.php?a=acGetMsgPag",
      path: "sps",
      method: "POST",
      body: query.toString(),
    });
    return response?.OAS?.rows ?? [];
  }

  async getBacheca(nascondiNonAttive: boolean = false): Promise<any> {
    const quesry = new URLSearchParams({
      action: "get_comunicazioni",
      cerca: "",
      ncna: nascondiNonAttive ? "1" : "0",
      tipo_com: "",
    });

    const response = await this.#fetch({
      url: `bacheca_personale.php?${quesry.toString()}`,
      path: "sif",
    });

    return response ?? {};
  }

  async readComunications(ids: string[]): Promise<boolean> {
    const query = new URLSearchParams({
      action: "read_all",
      id_relazioni: ids,
    });

    const response = await this.#fetch({
      url: `bacheca_personale.php?${query}`,
      path: "sif",
      method: "GET",
      json: false,
    });
    return response === "OK";
  }

  async getDocumentUrl(params: string, doctype: number = 1) {
    const query = new URLSearchParams({
      a: "RA-RICAVA",
      doctype: doctype.toString(),
      sessione: "S3",
      params,
    });

    const response = await this.#fetch({
      url: `pubblicazioni.php?${query.toString()}`,
      path: "sol",
    });

    return response ?? {};
  }

  // need to find a way to get only json
  /*async getRecuperi(quad: number) {
        const response = await this.#fetch(
            `scrutinio_singolo_recuperi.php?quad=${quad}`,
            'sol',
            'GET',
            undefined,
            {
                'Accept': 'application/json'
            },
            false
        );

        return response ?? {}
    };*/

  async getAccountInfo() {
    const response = await this.#fetch({
      url: "OtpApi.php?a=recStatus",
      path: "auth",
    });

    return response ?? {};
  }

  getMethods(): string[] {
    return Object.getOwnPropertyNames(Object.getPrototypeOf(this)).filter(prop => prop !== "constructor");
  }

  public setSessionId(token: string): void {
    this.#token = token;
    this.#setAuthorized(true);
  }

  public msToUnix(ms: Date | number): number {
    const num = typeof ms === "number" ? ms : ms.getTime();
    return Math.floor(num / 1000);
  }

  #setAuthorized(authorized: boolean): void {
    this.authorized = authorized;
  }

  #error(message: string): Promise<never> {
    return Promise.reject(message);
  }

  async #fetch({
    url,
    path,
    method = "GET",
    body,
    headers: head = {},
    json = true,
  }: FetchOptions): Promise<any> {
    if (!this.authorized) return this.#error("Not logged in ❌");

    const headers: HeadersInit = Object.assign(this.#headers, {
      Cookie: this.#token,
      ...head,
    });
    const options: RequestInit = {
      method: method.toUpperCase(),
      headers,
    };
    if (body && method !== "GET") options.body = body;

    const response: Response = await fetch(`${this.#baseUrl(path)}${url}`, options);
    if (!response.ok) return this.#error(`Response not ok (${response.status} - ${response.statusText})`);

    const data = json
      ? await response.json().catch(() => this.#error("Could not parse JSON"))
      : await response.text().catch(() => this.#error("Could not parse Text"));

    if (data?.error && data?.error?.length > 0) return this.#error(data?.error || "Unknown error");

    return data;
  }
}

export default Web;
