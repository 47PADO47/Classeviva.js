import { Dispatcher } from "undici";
import BaseApiClient from "../base/client";
import {
  ClassOptions,
  ClassUser,
  FetchOptions,
  LoginData,
  prodotto,
} from "../types/web";

class Web extends BaseApiClient {
  readonly #loginData: LoginData;
  #token: string;
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
  constructor(options: ClassOptions = {}) {
    super({
      debug: options.debug || false,
    });

    this.#loginData = options.credentials || { uid: "", pwd: "", };
    this.resetAuth();
  }

  async login(data: LoginData = this.#loginData): Promise<ClassUser | undefined> {
    const url = `${this.getPath("auth-p7")}AuthApi4.php?a=aLoginPwd`;
    const body = new URLSearchParams(Object.entries(data)).toString();

    const response = await this.httpClient.request({
      path: url,
      method: "POST",
      body,
    });

    const json = await response
      .body
      .json()
      .catch(() => this.error("Could not parse JSON")) as any;

    if ("error" in json && json.error?.length > 0) return this.error(json.error, response.statusCode);

    const cookie = this.getCookie(response, "set-cookie");
    if (!cookie) return this.error("Login failed (no token)", response.statusCode);

    this.setSessionId(cookie);

    if (!json?.data?.auth?.accountInfo) return this.error("Login failed (no account info)", response.statusCode);
    this.user = json.data.auth.accountInfo;

    return this.user;
  }

  logout() {
    if (!this.authorized) {
        this.error("Already logged out");
        return false;
    }
    
    this.resetAuth()
    return !this.authorized;
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

    const response = await this.fetch({
      url: `agenda_studenti.php?ope=get_events&${query.toString()}`,
      path: "fml",
      method: "GET",
      json: false,
    });
    const data = response === "null" ? [] : JSON.parse(response);

    return data;
  }

  async getPortfolio(): Promise<any> {
    const data = await this.fetch({ url: "get_pfolio.php", path: "tools" });
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

    const response = await this.fetch({
      url: `xml_export.php?${query.toString()}`,
      method: "GET",
      json: false,
    });

    return response;
  }

  async getUnreadMessages(): Promise<number | undefined> {
    const response = await this.fetch({
      url: "SocMsgApi.php?a=acGetUnreadCount",
      path: "sps",
    });
    return response?.OAS?.unread?.totCount ?? undefined;
  }

  async getUsername(): Promise<{ name?: string; username?: string }> {
    const response = await this.fetch({
      url: "get_username.php",
      path: "tools",
    });
    return response ?? {};
  }

  async getDocumentionList(
    prodotto: prodotto | "" = "",
    cerca: string = ""
  ): Promise<any> {
    const response = await this.fetch({
      url: `documentazione.xhr.php?act=get_faq_autocomplete&prodotto=${prodotto}&find=${cerca}`,
      path: "acc",
    });
    return response ?? {};
  }

  async getDocumentationUrl(prodotto: prodotto, id: number): Promise<string> {
    return `${this.getPath("acc")}documentazione.php?prodotto=${prodotto}&cerca=d:${id}`;
  }

  async getAvatar(): Promise<any> {
    const response = await this.fetch({
      url: "get_avatar.php",
      path: "tools",
    });
    return response ?? {};
  }

  async getAcGooBApiKey(): Promise<string> {
    const response = await this.fetch({
      url: "SocMsgApi.php?a=acGooBApiK",
      path: "sps",
    });
    return response?.OAS?.gooBApiK ?? "";
  }

  async getRubrica(): Promise<any> {
    const response = await this.fetch({
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

    const response = await this.fetch({
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

    const response = await this.fetch({
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

    const response = await this.fetch({
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

    const response = await this.fetch({
      url: `pubblicazioni.php?${query.toString()}`,
      path: "sol",
    });

    return response ?? {};
  }

  // need to find a way to get only json
  /*async getRecuperi(quad: number) {
        const response = await this.fetch(
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
    const response = await this.fetch({
      url: "OtpApi.php?a=recStatus",
      path: "auth",
    });

    return response ?? {};
  }

  public setSessionId(token: string): void {
    this.#token = token;
    this.authorized =  true;
  }

  public msToUnix(ms: Date | number): number {
    const num = typeof ms === "number" ? ms : ms.getTime();
    return Math.floor(num / 1000);
  }

  protected async fetch({
    url,
    path,
    method = "GET",
    body,
    headers: head = {},
    json = true,
  }: FetchOptions): Promise<any> {
    if (!this.authorized) return this.error("Not logged in ❌");

    const headers = {
      ...this.headers,
      Cookie: this.#token,
      ...head,
    };

    const options: Dispatcher.RequestOptions = {
      path: `${this.getPath(path)}${url}`,
      method,
      headers,
    };
    if (body && method !== "GET") options.body = body;

    const response = await this.httpClient.request(options);
    if (response.statusCode < 200 || response.statusCode > 299) return this.error(`Response not ok`, response.statusCode);

    const data = (json
      ? await response.body.json().catch(() => this.error("Could not parse JSON"))
      : await response.body.text().catch(() => this.error("Could not parse Text"))) as any;

    if ("error" in data && data.error.length > 0) return this.error(data.error.toString(), response.statusCode);

    return data;
  }

  protected resetAuth() {
    this.#token = "";
    this.authorized = false;

    this.user = {
      cid: "",
      cognome: "",
      nome: "",
      id: 0,
      type: "",
    };
    
    return this;
  }

  protected getPath(path: string = "fml") {
    return `${this.getHost()}${path}/app/default/`;
  }
}

export default Web;
