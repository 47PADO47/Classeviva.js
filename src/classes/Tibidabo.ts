import fetch, { HeadersInit, RequestInit, Response } from "node-fetch";
import { userTypesKeys } from "../Enums";
import {
  ClassOptions,
  AuthObject,
  FetchOptions,
  Account,
  User,
  msgTargets,
  addressBook,
  group,
  contactInfo,
} from "../typings/Tibidabo";

class Tibidabo {
  public readonly email: string;
  readonly #password: string;
  #token: string;

  public authorized: boolean;
  public user: User;
  public account: Account;
  
  readonly #baseUrl: (path?: string) => string;
  #headers: HeadersInit;
  constructor({ email, password }: ClassOptions = {}) {
  
    this.email = email || "";
    this.#password = password || "";
    this.#token = "";
    
    this.authorized = false;
    this.user = {
      auth_string: "",
      auth_type: "",
      cognome: "",
      nome: "",
      dinsert: "",
      id: "",
      alt_cell: null,
      alt_codfis: null,
      alt_fbuid: null,
      alt_nickname: null,
      password_changed: "",
    };
    this.account = {
      account_desc: "",
      account_string: "",
      dinsert: "",
      id: "",
      nome: "",
      scuola_descrizione: "",
      scuola_intitolazione: "",
      scuola_luogo: "",
      sede_codice: "",
      target: "",
      wsc_cat: "",
    }
      
    this.#baseUrl = (path: string = "sps") => `https://web.spaggiari.eu/${path}/app/default/`;
    this.#headers = {
      "Content-Type": "application/x-www-form-urlencoded",
      "Accept": "application/json",
      "User-Agent": `OAS User Agent`,
      "X-Requested-With": "XMLHttpRequest",
    };
  }

  async login(data: ClassOptions = {
    email: this.email,
    password: this.#password,
  }): Promise<boolean> {
    if (!this.isEmail(data.email ?? '')) return this.#error("Invalid email");

    const url = `${this.#baseUrl("home")}login-sso.php`;
    const obj: AuthObject = {
      u: data.email || '',
      p: data.password || '',
    };

    const emailRes = await fetch(`${url}?a=emlLogin`, {
      method: "POST",
      body: this.#objToURLParams(obj),
      headers: this.#headers,
    });

    const json = await emailRes
      .json()
      .catch(() => this.#error("Could not parse JSON"));

    if (json?.errNo !== 0 && json?.ok && json?.errDeco?.length > 0) return this.#error(json.errDeco[json.errNo]);

    let cookie = this.#getCookie(emailRes);
    if (!cookie) return this.#error("Login failed (no token)");
    
    if (!json?.samAuth === null || json?.samAccounts?.length === 0) return this.#error("Login failed (no account)");
    this.user = json.samAuth;
    this.account = json.samAccounts[0];

    obj.c = this.account.sede_codice;
    obj.u = this.account.account_string;
    const authRes = await fetch(`${url}?a=stdLogin`, {
      method: "POST",
      body: this.#objToURLParams(obj),
      headers: {
        Cookie: cookie,
        ...this.#headers,
      },
    });

    const authJson = await authRes
      .json()
      .catch(() => this.#error("Could not parse JSON"));

    if (!authJson?.auth) return this.#error(`Login failed (${authJson?.error ?? "unknown error"})`);

    cookie = this.#getCookie(authRes);
    if (!cookie) return this.#error("Login failed (no token)");
    this.setSessionId(cookie);

    return this.authorized;
  }

  logout() {
    if (!this.authorized) {
      this.#error("Already logged out");
      return;
    }

    this.#token = "";
    this.authorized = false;
    this.user = {
      auth_string: "",
      auth_type: "",
      cognome: "",
      nome: "",
      dinsert: "",
      id: "",
      alt_cell: null,
      alt_codfis: null,
      alt_fbuid: null,
      alt_nickname: null,
      password_changed: "",
    };
    this.account = {
      account_desc: "",
      account_string: "",
      dinsert: "",
      id: "",
      nome: "",
      scuola_descrizione: "",
      scuola_intitolazione: "",
      scuola_luogo: "",
      sede_codice: "",
      target: "",
      wsc_cat: "",
    }
    return !this.authorized;
  }

  async whoami() {
    const data = await this.#fetch({
      url: `SocMsgApi.php`,
      body: {
        a: "acWhoAmI",
      },
    });

    return data?.data?.whoami || {};
  }

  async getOASSettings() {
    const data = await this.#fetch({
      url: `oas_services4.php`,
      path: 'oas',
      body: {
        a: "info",
      },
      OAS: false,
    });

    if (data?.errori) return this.#error(data.errori.toString());

    return data;
  }

  async getUserInfo(userId: number | string, accountType: userTypesKeys) {
    const data = await this.#fetch({
      url: `SocMsgApi.php`,
      body: {
        a: "acUserGetInfo",
        id: userId,
        type: accountType,
      },
    });

    return data?.userInfo || {};
  }

  async getMsgTargets(withUsers: boolean = true): Promise<msgTargets> {
    const data: {targets: msgTargets} = await this.#fetch({
      url: `SocMsgApi.php`,
      body: {
        //a: "acGetMsgTargets",
        a: "acGetGroups",
        withUsers: this.booleanToInt(withUsers),
      },
    });

    return data?.targets; 
  }

  async getAddressBook(withGroups: boolean = true): Promise<addressBook> {
    const data: {data: {net: addressBook}} = await this.#fetch({
      url: `GroupsApi.php`,
      body: {
        a: 'aNetList',
        uid: this.account.id,
        wg: this.booleanToInt(withGroups),
        ityp: '*'
      },
      OAS: false,
    });

    return data?.data?.net;
  }

  async getGroups(withLongDescription: boolean = true, withPhoto: boolean = true, withXmlInfo: boolean = true): Promise<group[]> {
    const data: {data:{groups: group[]}} = await this.#fetch({
      url: `GroupsApi.php`,
      body: {
        a: 'aGrpListOf',
        uid: this.account.account_string.slice(0, -1),
        wl: this.booleanToInt(withLongDescription),
        wx: this.booleanToInt(withXmlInfo),
        wf: this.booleanToInt(withPhoto),
        wmc: 1,
        ityp: '*'
      },
      OAS: false,
    });

    return data?.data?.groups;
  }
  
  async getContactInfo(accountStringIdent: string): Promise<contactInfo> {
    const data: contactInfo = await this.#fetch({
      url: `SocMsgApi.php`,
      body: {
        a: 'acGetPUInfo',
        uid: accountStringIdent,
      },
    });

    return data;
  }

  async getMessages(page: number | '' = '', search: string = '', maxMsgs: number = 20) {
    const body = {
      a: 'acGetMsgPag',
      p: page,
      mpp: maxMsgs,
      search,
    /*   mid: 0,
      mmid: 0,
      hmid: 0,
      nosp: 0,
      ignpf: 0, */
    };
    
    const data = await this.#fetch({
      url: `SocMsgApi.php`,
      body,
    });

    return data;
  }

  async setMessageAsRead(messageId: number | string) {
    const data = await this.#fetch({
      url: `SocMsgApi.php`,
      body: {
        a: 'acSetDRead',
        ['mids[]']: messageId,
      },
    });

    return data;
  }

  async postComment(messageId: number | string, comment: string) {
    const data = await this.#fetch({
      url: `messaggi.php`,
      path: 'sps-api',
      body: {
        a: 'acPostComment',
        id: messageId,
        message: comment,
      },
    });

    return data;
  }

  async likeMessage(messageId: number | string) {
    const data = await this.#fetch({
      url: `SocMsgApi.php`,
      body: {
        a: 'acSwitchLikePost',
        id: messageId,
      },
    });

    return data;
  }

  async getUnreadMessagesCount(): Promise<number> {
    const data = await this.#fetch({
      url: `SocMsgApi.php`,
      body: {
        a: 'acGetUnreadCount',
      },
    });

    return data?.unread?.totCount || 0;
  }

  //sends message, but apparently they dont show up
  async sendMessage(message: string, subject: string, targetID: number | string) {
    const data = await this.#fetch({
      url: `messaggi.php`,
      path: 'sps-api',
      body: {
        a: 'acPostMsg',
        uid: targetID,
        subject,
        message,
      },
    });

    return data;
  }

  // Throws "010/Permission denied"
  /*async addMoreTargets(messageId: string, targetID: number | string) {
    const data = await this.#fetch({
      url: `messaggi.php`,
      path: 'sps-api',
      body: `a=acAddMoreTargets&mids[]=${messageId}&uids[]=${targetID}`,
    });

    return data;
  }*/

  async removeMeFromThread(threadMsgId: string | number) {
    const data = await this.#fetch({
      url: `messaggi.php`,
      path: 'sps-api',
      body: {
        a: 'acRemoveMeFromThread',
        id: threadMsgId,
      },
    });

    return data;
  }

  async reportMessage(messageId: string | number) {
    const data = await this.#fetch({
      url: `messaggi.php`,
      path: 'sps-api',
      body: {
        a: 'acBanMsgReq',
        id: messageId,
      },
    });

    return data;
  }

  /*async addMessageAttachment(messageId: string | number, attachment: Buffer) {
    const data = await this.#fetch({
      url: `messaggi.php`,
      path: 'sps-api',
      //form data
      body: {
        a: 'acAtchAdd',
        msgid: messageId,
        //attach[0]
      },
    });

    return data;
  }*/

  #objToURLParams(obj: any) {
    return new URLSearchParams(Object.entries(obj)).toString();
  }

  public isEmail(email: string): boolean {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email.toLowerCase());
  }

  #getCookie(response: Response): string {
    const cookies = response.headers.get("Set-Cookie");
    const cookie = cookies?.split(", ").pop();
    return cookie ?? "";
  }
  
  booleanToInt(bool: boolean): number {
    return bool ? 1 : 0;
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
    method = "POST",
    body,
    headers: head = {},
    OAS = true,
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
    if (body && method !== "GET") options.body = this.#objToURLParams(body);

    const response: Response = await fetch(`${this.#baseUrl(path)}${url}`, options);
    if (!response.ok) return this.#error(`Response not ok (${response.status} - ${response.statusText})`);

    const data = await response.json().catch(() => this.#error("Could not parse JSON"));

    if (data?.error && data?.error?.length > 0) return this.#error(data?.error?.toString() || "Unknown error");

    if (OAS) return data?.OAS || {};
    return data;
  }
}

export default Tibidabo;