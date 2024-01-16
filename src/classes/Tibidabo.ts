import { Dispatcher } from "undici";
import BaseApiClient from "../base/client";
import { userTypesKeys } from "../base/enums";
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
  LoginOptions,
} from "../types/tibidabo";

class Tibidabo extends BaseApiClient {
  public readonly email: string;
  readonly #password: string;
  #token: string;

  public user: User;
  public account: Account;
  constructor(options: ClassOptions = {}) {
    super({
      debug: options.debug || false,
    });

    this.email = options.email || "";
    this.#password = options.password || "";

    this.resetAuth();

    this.setHeaders({
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": `OAS User Agent`,
    });
  }

  async login(data: LoginOptions = {
    email: this.email,
    password: this.#password,
  }): Promise<User | undefined> {
    if (!this.isEmail(data.email ?? '')) return this.error("Invalid email");

    const url = `${this.getPath("home")}login-sso.php`;
    const obj: AuthObject = {
      u: data.email || '',
      p: data.password || '',
    };

    const emailRes = await this.httpClient.request({
      path: `${url}?a=emlLogin`,
      method: "POST",
      body: this.#objToURLParams(obj),
      headers: this.headers,
    });

    const json = await emailRes
      .body
      .json()
      .catch(() => this.error("Could not parse JSON")) as any;

    if (json?.errNo !== 0 && json?.ok && json?.errDeco?.length > 0) return this.error(json.errDeco[json.errNo], emailRes.statusCode);

    let cookie = this.getCookie(emailRes, "set-cookie");
    if (!cookie) return this.error("Login failed (no token)", emailRes.statusCode);
    
    if (!json || json.samAuth === null || json.samAccounts?.length === 0) return this.error("Login failed (no account)", emailRes.statusCode);
    this.user = json.samAuth;
    this.account = json.samAccounts[0];

    obj.c = this.account.sede_codice;
    obj.u = this.account.account_string;
    const authRes = await this.httpClient.request({
      path: `${url}?a=stdLogin`,
      method: "POST",
      body: this.#objToURLParams(obj),
      headers: {
        Cookie: cookie,
        ...this.headers,
      },
    });

    const authJson = await authRes
      .body
      .json()
      .catch(() => this.error("Could not parse JSON")) as any;

    if (!authJson?.auth) return this.error(`Login failed (${authJson?.error ?? "unknown error"})`, authRes.statusCode);

    cookie = this.getCookie(authRes, "set-cookie");
    if (!cookie) return this.error("Login failed (no token)", authRes.statusCode);
    this.setSessionId(cookie);

    return this.user;
  }

  logout() {
    if (!this.authorized) return true;
    this.resetAuth();
    return !this.authorized;
  }

  async whoami() {
    const data = await this.fetch({
      url: `SocMsgApi.php`,
      body: {
        a: "acWhoAmI",
      },
    });

    return data?.data?.whoami || {};
  }

  async getOASSettings() {
    const data = await this.fetch({
      url: `oas_services4.php`,
      path: 'oas',
      body: {
        a: "info",
      },
      OAS: false,
    });

    if (data?.errori) return this.error(data.errori.toString());

    return data;
  }

  async getUserInfo(userId: number | string, accountType: userTypesKeys) {
    const data = await this.fetch({
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
    const data: {targets: msgTargets} = await this.fetch({
      url: `SocMsgApi.php`,
      body: {
        a: "acGetGroups",
        withUsers: this.booleanToInt(withUsers),
      },
    });

    return data?.targets; 
  }

  async getAddressBook(withGroups: boolean = true): Promise<addressBook> {
    const data: {data: {net: addressBook}} = await this.fetch({
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
    const data: {data:{groups: group[]}} = await this.fetch({
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
    const data: contactInfo = await this.fetch({
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
    
    const data = await this.fetch({
      url: `SocMsgApi.php`,
      body,
    });

    return data;
  }

  async setMessageAsRead(messageId: number | string) {
    const data = await this.fetch({
      url: `SocMsgApi.php`,
      body: {
        a: 'acSetDRead',
        ['mids[]']: messageId,
      },
    });

    return data;
  }

  async postComment(messageId: number | string, comment: string) {
    const data = await this.fetch({
      url: `messaggi.php`,
      path: 'sps-api',
      body: {
        a: 'acPostComment',
        id: messageId,
        message: comment,
        flags: '' //8 - interno
      },
    });

    return data;
  }

  async likeMessage(messageId: number | string) {
    const data = await this.fetch({
      url: `SocMsgApi.php`,
      body: {
        a: 'acSwitchLikePost',
        id: messageId,
      },
    });

    return data;
  }

  async getUnreadMessagesCount(): Promise<number> {
    const data = await this.fetch({
      url: `SocMsgApi.php`,
      body: {
        a: 'acGetUnreadCount',
      },
    });

    return data?.unread?.totCount || 0;
  }

  //sends message, but apparently they dont show up
  /*async sendMessage(message: string, subject: string, targetID: number | string, targetType: string) {
    const data = await this.fetch({
      url: `messaggi.php`,
      path: 'sps-api',
      body: {
        a: 'acPostMsg',
        'targets[]': 'persona.type+persona.id-persona.xhash',
        //'groups[]': "",
        subject,
        message,
        ctx: '',
      },
    });

    return data;
  }*/

  // Throws "010/Permission denied"
  /*async addMoreTargets(messageId: string, targetID: number | string) {

    const data = await this.fetch({
      url: `messaggi.php`,
      path: 'sps-api',
      body: `a=acAddMoreTargets&msgid[]=${messageId}&uids[]=${targetID}`,
    });

    const data = await this.fetch({
      url: `messaggi.php`,
      path: 'sps-api',
      body: `a=acAddMoreTargets&msgid=${messageId}&targets=[{ 'type': targetType, 'id': targetID }]`,
    });

    return data;
  }*/

  async removeMeFromThread(threadMsgId: string | number) {
    const data = await this.fetch({
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
    const data = await this.fetch({
      url: `messaggi.php`,
      path: 'sps-api',
      body: {
        a: 'acBanMsgReq',
        id: messageId,
      },
    });

    return data;
  }

  async getPrivacyOptions() {
    const data = await this.fetch({
      url: `messaggi.php`,
      path: 'sps-api',
      body: {
        a: 'acGetDlgOpts',
      },
    });

    return data;
  }

  async deleteMessage(messageId: string | number) {
    const data = await this.fetch({
      url: `messaggi.php`,
      path: 'sps-api',
      body: {
        a: 'acDelMsg',
        id: messageId,
      },
    });

    return data;
  }

  async getAttach(messageId: string | number) {
    const data = await this.fetch({
      url: `messaggi.php`,
      path: 'sps-api',
      body: {
        a: 'acGetAttach',
        xpm: messageId,
      },
    });

    return data;
  }

  async getMessage(messageId: string | number) {
    const data = await this.fetch({
      url: `SocMsgApi.php`,
      body: {
        a: 'acGetMsgPag',
        mid: messageId,
        'mode': 'show'
      },
    });

    return data;
  }

  /*
  function recordPrivacyFlagChange(newval,mode){
    $.ajax({
      type: 'POST',
      url: spsVars.msgScript+'?a=acSavePrvFlg',
      data: {
        'flags': newval,
        'mode': mode
      },
      dataType: 'JSON',
      async:false
    });
  }
  */

  /*async addMessageAttachment(messageId: string | number, attachment: Buffer) {
    const data = await this.fetch({
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

  async createGroup(name: string, desc: string) {
    const data = await this.fetch({
      url: `GroupsApi.php`,
      path: 'sps',
      body: {
        a: 'aGrpNew',
        name: name,
        sdes: desc,
        jmod: ''
      },
    });

    return data;
  }
  
  async addUserToGroup(userId: string, groupId: string | number) {
    const data = await this.fetch({
      url: `GroupsApi.php`,
      path: 'sps',
      body: {
        a: 'aGrpUserAdd',
        owner: '',
        peer: userId,
        grp: groupId,
      },
    });

    return data;
  }
  
  async removeUserFromGroup(userId: string, groupId: string | number) {
    const data = await this.fetch({
      url: `GroupsApi.php`,
      path: 'sps',
      body: {
        a: 'aGrpUserDel',
        owner: '',
        peer: userId,
        grp: groupId,
      },
    });

    return data;
  }

  #objToURLParams(obj: any) {
    return new URLSearchParams(Object.entries(obj)).toString();
  }

  public isEmail(email: string): boolean {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email.toLowerCase());
  }
  
  booleanToInt(bool: boolean): number {
    return bool ? 1 : 0;
  }

  public setSessionId(token: string): void {
    this.#token = token;
    this.authorized =  true;
  }

  public msToUnix(ms: Date | number): number {
    const num = typeof ms === "number" ? ms : ms.getTime();
    return Math.floor(num / 1000);
  }

  protected async fetch<T = any>({
    url,
    path,
    method = "POST",
    body,
    headers: head = {},
    OAS = true,
  }: FetchOptions): Promise<T> {
    if (!this.authorized) return this.error("Not logged in");

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
    if (body && method !== "GET") options.body = this.#objToURLParams(body);

    const response = await this.httpClient.request(options);
    if (response.statusCode < 200 || response.statusCode > 299) return this.error(`Response not ok`, response.statusCode);

    const data = await response.body.json().catch(() => this.error("Could not parse JSON")) as any;

    if ("error" in data && data.error.length > 0) return this.error(data.error.toString(), response.statusCode);
    if (OAS && "OAS" in data) return data?.OAS || {};

    return data;
  }

  protected resetAuth() {
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

    return this;
  }

  protected getPath(path: string = "sps") {
    return `${this.getHost()}${path}/app/default/`;
  }
}

export default Tibidabo;