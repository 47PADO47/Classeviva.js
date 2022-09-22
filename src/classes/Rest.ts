import fetch, { HeadersInit, RequestInit, Response } from 'node-fetch';
import { parse, join } from 'path';
import { readFileSync, writeFileSync } from 'fs';
import { ClassOptions, User, Headers, FetchResponse, LoginResponse, AgendaFilter, TalkOptions, Overview, Card, ContentElement, TermsAgreementResponse, setTermsAgreementResponse, readOptions, TokenStatus, TicketResponse, checkDocument, absences, readNotice, Grade, calendarDay, FetchOptions, resetPassword } from '../typings/Rest';
import * as Enums from '../Enums';

class Rest {
    public readonly username: string;
    readonly #password: string;
    #token: string;

    readonly #state: string;
    readonly #baseUrl: string;
    readonly #directory: string;

    public login_timeout: NodeJS.Timeout;
    public expiration: string;
    public debug: boolean;
    public saveTempFile: boolean;
    
    public authorized: boolean;
    public user: User;

    readonly #app : string;
    #headers: Headers;
    constructor({ state = Enums.States.Italy, app = Enums.Apps.Students, ...data }: ClassOptions = {}) {
        this.username = data.username || "";
        this.#password = data.password || "";
        this.#token = "";

        this.#state = state;
        this.#baseUrl = `https://${Enums.Urls[this.#state]}/rest/v1`;
        this.#directory = join(parse(__dirname).dir, '..');

        this.login_timeout;
        this.expiration = "";
        this.debug = data.debug || false;
        this.saveTempFile = data.saveTempFile ?? true;

        this.authorized = false;
        this.user = {
            name: undefined,
            surname: undefined,
            id: undefined,
            ident: undefined,
            type: undefined,
            school: {}
        };

        this.#app = app;
        this.#headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": `${this.#app} iOS/15.4`,
            "Z-Dev-Apikey": "Tg1NWEwNGIgIC0K",
            "Z-If-None-Match": "",
        };
    }

    /**
     * Logins to Classeviva
     * @param {string} [username] Classeviva credentials username
     * @param {string} [password] Classeviva credentials password
     * @returns {object} user object
     */
    async login(username = this.username, password = this.#password): Promise<void | User> {
        if (this.authorized) return this.#error("Already logged in ❌");

        if (!username || !password) return this.#error("Username or password not set ❌");

        if (!await this.#checkTemp() || !this.saveTempFile) {
            const userData = {
                uid: username,
                pass: password,
            };
    
            const response: Response = await fetch(`${this.#baseUrl}/auth/login/`, {
                method: "POST",
                headers: this.#headers,
                body: JSON.stringify(userData),
            });
    
            const json: any = await response.json();
    
            if (json.error) {
                this.authorized = false;
                return this.#error(`An error happened: ${json.message} (${json.statusCode}) ❌`);
            }

            if (response.status !== 200) return this.#error(`The server returned a status code other than 200 (${response.status}) ❌`);
            
            this.#updateData(json);
            if (this.saveTempFile) {
                await writeFileSync(`${this.#directory}/cvv.json`, JSON.stringify(json, null, 2));
                this.#log("Saved temp file ✅");
            }
        }

        if (!this.authorized) return this.#error("Failed to login ❌");

        this.#log(`Successfully logged in as "${this.user.name} ${this.user.surname}" ✅`);
        this.login_timeout = setTimeout(() => {
            this.login();
        }, 1000 * 60 * 60 * 1.5);
        return this.user;
    }

    /**
     * Logs out from Classeviva
     * @returns {boolean} true if logged out, error if already logged out
     */
    logout(): true | Promise<never> {
        if (!this.authorized) return this.#error("Already logged out ❌");
        clearTimeout(this.login_timeout);
        this.authorized = false;
        this.#token = "";
        this.user = {};
        this.expiration = "";
        this.#log("Successfully logged out ✅");
        return true;
    }

    /**
     * Get student's cards
     * @returns {object[]} Array of objects containing the student's cards
     */
    async getCards(): Promise<Card[]> {
        const data: { cards?: Card[] } | void = await this.#fetch({ path: "/cards" });
        if (data?.cards && data?.cards?.length > 0) this.#updateUser(data.cards[0]);
        
        return data?.cards ?? [];
    }

    /**
     * Get student's card
     * @returns {object} Object containing the student's card
     */
    async getCard(): Promise<Card | undefined> {
        const data: { card?: Card } | void = await this.#fetch({ path: "/card" });
        if (data?.card && Object.keys(data?.card ?? {}).length > 0) this.#updateUser(data.card);

        return data?.card;
    }

    /**
     * Get student's grades
     * @returns {object[]} Array of objects containing the student's grades
     */
    async getGrades(): Promise<Grade[]> {
        const data: {grades: Grade[]} | void = await this.#fetch({ path: `/grades2` });
        return data?.grades ?? [];
    }

    /**
     * Get student's absences
     * @returns {object[]} Array of objects containing the student's absences
     */
    async getAbsences(): Promise<absences[]> {
        const data: {events: absences[]} | void = await this.#fetch({ path: `/absences/details` });
        return data?.events ?? [];
    }

    /**
     * Get student's agenda
     * @param {string} filter "all" | "homework" | "other", default "all", used to filter the agenda
     * @param {Date} start The start date of the agenda (defaults to today)
     * @param {Date} end  The end date of the agenda (defaults to today)
     * @returns {object[]} Array of objects containing the student's agenda
     */
    async getAgenda(filter: AgendaFilter = "all", start: Date = new Date(), end: Date = new Date()): Promise<any> {
        const filters = ["all", "homework", "other"];
        if (!filters.includes(filter)) return this.#error("Invalid filter ❌");
        const map = {
            all: "all",
            homework: "AGHW",
            other: "AGNT",
        };

        const data: any = await this.#fetch({ path: `/agenda/${map[filter]}/${this.#formatDate(start)}/${this.#formatDate(end)}` });
        return data?.agenda ?? [];
    }

    /**
     * Get student's documents
     * @returns {object[]} Array of objects containing the student's documents
     */
    async getDocuments(): Promise<any> {
        const data: any = await this.#fetch({ path: "/documents", method: "POST" });
        return data ?? [];
    }

    /**
     * Get student's noticeboard items
     * @returns {object[]} Array of objects containing the student's noticeboard items
     */
    async getNoticeboard(): Promise<any> {
        const data: any = await this.#fetch({ path: "/noticeboard" });
        return data?.items ?? [];
    }

    /**
     * Get student's books
     * @returns {object[]} Array of objects containing the student's books
     */
    async getSchoolBooks(): Promise<any> {
        const data: any = await this.#fetch({ path: "/schoolbooks" });
        return data?.schoolbooks ?? [];
    }

    /**
     * Get student's calendar
     * @returns {object[]} Array of objects containing the student's calendar
     */
    async getCalendar(): Promise<calendarDay[]> {
        const data: {calendar: calendarDay[]} | void = await this.#fetch({ path: "/calendar/all" });
        return data?.calendar ?? [];
    }

    /**
     * Get student's lessons
     * @param {boolean} [today] Boolean to get today's lessons, default true
     * @param {Date} [start] If today is false, the start date of the lessons (defaults to today)
     * @param {Date} [end] If today is false, the end date of the lessons (defaults to today)
     * @returns {object[]} Array of objects containing the student's lessons
     */
    async getLessons(today: boolean = true, start: Date = new Date(), end: Date = new Date()): Promise<any> {
        const data: any = await this.#fetch({ path: `/lessons${today ? "/today" : `/${this.#formatDate(start)}/${this.#formatDate(end)}`}` });
        return data?.lessons ?? [];
    }

    /**
     * Get student's notes
     * @returns {object[]} Array of objects containing the student's notes
     */
    async getNotes(): Promise<any> {
        const data: any = await this.#fetch({ path: "/notes/all" });
        return data ?? [];
    }

    /**
     * Get student's periods
     * @returns {object[]} Array of objects containing the student's periods
     */
    async getPeriods(): Promise<any> {
        const data: any = await this.#fetch({ path: "/periods" });
        return data?.periods ?? [];
    }

    /**
     * Get student's subjects
     * @returns {object[]} Array of objects containing the student's subjects
     */
    async getSubjects(): Promise<any> {
        const data: any = await this.#fetch({ path: "/subjects" });
        return data?.subjects ?? [];
    }

    /**
     * Get student's didactics items
     * @returns {object[]} Array of objects containing the student's didactics items
     */
    async getDidactics(): Promise<any> {
        const data: any = await this.#fetch({ path: "/didactics" });
        return data?.didacticts ?? [];
    }

    /**
     * Get a list of the Classeviva class' functions
     * @returns {string[]} An array containing the Classeviva class' functions
     */
    getMethods(): string[] {
        return Object.getOwnPropertyNames(Object.getPrototypeOf(this)).filter(prop => prop !== "constructor");
    }

    /**
     * Get a list of the possible parents options for classeviva
     * @returns {object} An object containing all the possible parents options for classeviva
     */
    async getParentsOptions(): Promise<any> {
        const data: any = await this.#fetch({ path: "/_options", method: "GET", type: "parents" });
        return data?.options ?? {};
    }

    /**
     *  Get a list of the avaible talks with teachers on classeviva
     * @returns {object[]} An array of objects containing data about the avaible talks with teachers for classeviva
     */
    async getOverallTalks(): Promise<any> {
        const data: any = await this.#fetch({ path: "/overalltalks/list", method: "GET", type: "parents" });
        return data?.overallTalks ?? [];
    }
    
    /**
     *  Get a list of something regarding the talks with teachers
     * @param {Date} start The start date of the talks (defaults to today)
     * @param {Date} end The end date of the talks (defaults to today)
     * @returns {object[]} An array of objects containing data about the talks with teachers for classeviva
     */
    async getTalks(start: Date = new Date(), end: Date = new Date()): Promise<any> {
        const data: any = await this.#fetch({ path: `/talks/teachersframes/${this.#formatDate(start)}/${this.#formatDate(end)}`, method: "GET", type: "parents" });
        return data?.teachers ?? [];
    }

    /**
     *  Get auth ticket
     * @returns {object} An object containing data about the auth ticket
     */
    async getTicket(): Promise<TicketResponse | void> {
        if (!this.authorized) return this.#error("Not authorized ❌");

        const headers = Object.assign({ "Z-Auth-Token": this.#token }, this.#headers);
        const res: Response = await fetch(`${this.#baseUrl}/auth/ticket`, {
            headers
        });

        const data: TicketResponse = await res.json()
        .catch(() => this.#error("Could not parse JSON while getting ticket ❌"));

        return data ?? {};
    }

    /**
     *  Get the user avatar
     * @returns {unknown} The user avatar (not tested)
     */
    async getAvatar(): Promise<any> {
        if (!this.authorized) return this.#error("Not authorized ❌");

        const headers = Object.assign({ "Z-Auth-Token": this.#token }, this.#headers);
        const res: Response = await fetch(`${this.#baseUrl}/auth/avatar`, {
            headers
        });

        const data: any = await res.json()
        .catch(() => this.#error("Could not parse JSON while getting avatar ❌"));

        return data ?? {};
    }

    /**
     * Get an overview of the day specified or the time specified
     * @param {Date} start The start date of the overview (defaults to today)
     * @param {Date} end The end date of the overview (defaults to today)
     * @returns {object} An object containing data about the overview of a day or the time specified
     */
    async getOverview(start: Date = new Date(), end: Date = new Date()): Promise<Overview | undefined> {
        const data: Overview | void = await this.#fetch({ path: `/overview/all/${this.#formatDate(start)}/${this.#formatDate(end)}` });
        if (typeof data === "undefined") return undefined;
        return data;
    }

    /*/**
     * Not implemented yet 😢
     * @param {string || number} bookingId booking id of the talk
     * @param {string} message message to send
     * @returns {unknown}
     */
    /*async sendTeacherMessage(bookingId: string, message: string) {
        const data: any = await this.#fetch(`/talks/teachermessage/${bookingId}`, "POST", "parents");
        return data ?? {};
    }; */

    /**
     * Read messages from the inbox of a talk
     * @param {string || number} bookingId booking id of the talk
     * @param {string} message message to send
     * @returns {object}
     */
    async readTalkMessage(bookingId: string) {
        const data: any = await this.#fetch({ path: `/talks/teachermessage/${bookingId}`, method: "POST", type: "parents", body: JSON.stringify({ "messageRead": true }) });
        return data ?? {};
    }

    /**
     * Checks if a document is avaible
     * @param {string | number} hash The hash of the document
     * @returns {object} An object containing data about the document
     */
    async checkDocument(hash: string | number): Promise<{ avaible: boolean }> {
        const data: checkDocument | void = await this.#fetch({ path: `/documents/check/${hash}/`, method: "POST" });
        return data?.document ?? { avaible: false };
    }

    /**
     * Book a talk with a teacher
     * @param {string | number} teacherId The id of the teacher
     * @param {string | number} talkId The id of the talk
     * @param {string | number} slot The slot of the talk
     * @param {object} opts contact options
     * @returns {object} An object containing data about the booked talk
     */
    async bookTalk(teacherId: string | number, talkId: string | number, slot: string | number, opts: TalkOptions): Promise<any> {
        const data: any = await this.#fetch({ path: `/talks/book/${teacherId}/${talkId}/${slot}`, method: "POST", type: "parents", body: JSON.stringify(opts) });
        return data ?? {};
    }

    /**
     * Get the list of contents that's displayed in the app (should be "Classeviva extra")
     * @param {boolean} common idk, defaults to true
     * @returns {object[]} An array of objects containing data about the contents that's displayed in the app
     */
    async getContents(common = true): Promise<ContentElement[] | void> {
        if (!this.authorized) return this.#error("Not authorized ❌");
        if (!this.user.school?.code) return this.#error("No school code, please update using getCard() or getCards() ❌");

        const headers = Object.assign({ "Z-Auth-Token": this.#token }, this.#headers);
        const response: Response = await fetch(`https://${Enums.Urls[this.#state]}/gek/api/v1/${this.user.school.code}/2021/students/contents?common=${common}`, {
            headers
        });

        const data: ContentElement[] = await response.json()
        .catch(() => this.#error("Could not parse JSON while getting content ❌"));

        return data ?? [];
    }

    /**
     * Get infos about your agreement to the terms of classeviva. If you haven't agreed yet, this response body will be empty and the function will return an empty object.
     * @returns {object} An object containing data about the agreement to the terms of classeviva
     */
    async getTermsAgreement(): Promise<TermsAgreementResponse | undefined> {
        const data: TermsAgreementResponse | void = await this.#fetch({ path: "/getTermsAgreement", method: "GET", type: "users", body: undefined, json: true, id: "userIdent" });
        if (typeof data === "undefined") return undefined;
        return data;
    }

    /**
     * Set the agreement to the terms of classeviva third party data colletors
     * @param {boolean} ThirdParty Whether you agree to the terms of classeviva third party data colletors, defaults to true
     * @returns {object} An object with the property "msg": "ok" if the agreement was set successfully
     */
    async setTermsAgreement(ThirdParty: boolean = false): Promise<setTermsAgreementResponse> {
        const accepted = ThirdParty ? "1" : "0";
        const data: setTermsAgreementResponse | void = await this.#fetch({ path: "/setTermsAgreement", method: "POST", type: "users", body: JSON.stringify({ bitmask: accepted }), json: true, id: "userIdent" });
        return data ?? { msg: "NOT OK" };
    }

    /**
     * Read a notice from the school
     * @param {string} eventCode Event code of the notice
     * @param {string | number} id Id of the notice
     * @param {object} options { sign, join, text }
     * @returns {object} An object containing data about the notice
     */
    async readNotice(eventCode: string, id: string | number, options: readOptions = {}): Promise<readNotice | undefined> {
        const data: readNotice | void = await this.#fetch({
                path: `/noticeboard/read/${eventCode}/${id}/101`, method: "POST", type: "students", body: options ? JSON.stringify(options) : "", json: true, id: "userId", customHeaders: {
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            });
        
        if (typeof data === "undefined") return undefined;
        return data;
    }

    /**
     * Get the document url of a notice attachment
     * @param {string} eventCode Event code of the notice
     * @param {string | number} id Id of the notice
     * @returns {string} The url of the document
     */
    async getNoticeDocumentUrl(eventCode: string, id: string | number): Promise<string | void> {
        if (!this.authorized) return this.#error("Not authorized ❌");

        const headers = Object.assign({ "Z-Auth-Token": this.#token }, this.#headers);
        const response: Response = await fetch(`${this.#baseUrl}/students/${this.user.ident}/noticeboard/attach/${eventCode}/${id}/`, {
            headers
        });

        const url = response.headers.get("Location");
        return url ?? "";
    }

    /**
     * Get the status of a token
     * @param {string} token token to check, defaults to the token of the user
     * @returns {object} An object containing data about the token
     */
    async getTokenStatus(token = this.#token): Promise<TokenStatus | void> {
        if (!this.authorized || !token) return this.#error("Not authorized ❌");

        const headers = Object.assign({ "Z-Auth-Token": token }, this.#headers);
        const response: Response = await fetch(`${this.#baseUrl}/auth/status/`, {
            headers
        });
        const data: TokenStatus = await response.json()
        .catch(() => this.#error("Could not parse JSON while getting token status ❌"));

        return data ?? {};
    }

    /**
     * Read a document
     * @param {string} hash the hash of the document
     * @returns {Buffer} The document
     */
    async readDocument(hash: string): Promise<Buffer> {
        const data: Buffer | void = await this.#fetch({ path: `/documents/read/${hash}/`, method: "POST", type: "students", body: undefined, json: false });
        return data ?? Buffer.from("");
    }

    async resetPassword(email: string): Promise<resetPassword | void> {
        if (!this.authorized) return this.#error("Not authorized ❌");

        const headers = Object.assign({ "Z-Auth-Token": this.#token }, {
            ...this.#headers,
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json",
            "X-Requested-With": "XMLHttpRequest"
        });
        
        const res: Response = await fetch(`${this.#getHost()}sso/app/default/sam.php?a=akRSPWRQ`, {
            method: "POST",
            body: `eml=${email}`,
            headers
        });

        const data: resetPassword = await res.json()
        .catch(() => this.#error("Could not parse JSON while resetting password ❌"));

        return data ?? {};
    };

    /**
     * @private Gets the host of the current url
     * @returns {string} The host of the current url
     */
    #getHost(): string {
        return this.#baseUrl.split('rest')[0];
    }

    /**
     * @private Updates the user object with school infos and the user type
     * @param {object} card The user card (from getCard() or getCards())
     * @return {void} Nothing
     */
    #updateUser(card: Card): void {
        const { schName, schDedication, schCity, schProv, schCode, usrType } = card;
        this.user.type = Enums.UserTypes[usrType || "S"];
        this.user.school = {
            name: schName,
            dedication: schDedication,
            city: schCity,
            province: schProv,
            code: schCode
        };
    }

    /**
     * @private Checks for temp file
     * @returns {boolean} True if there was temp file and it updated the data, false otherwise or in case of an error
     */
    async #checkTemp(): Promise<boolean> {
        try {
            const temp: string = await readFileSync(`${this.#directory}/cvv.json`, "utf8");
            if (!temp) {
                return false;
            }
            const json = JSON.parse(temp);

            if (new Date(json.expire) <= new Date()) return false;
            
            this.#updateData(json);
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * @private Updates user data
     * @param {LoginResponse} data user data to update
     * @returns {void}
     */
    #updateData(data: LoginResponse): void {
        if (!data) {
            this.logout();
            return;
        }

        if (typeof data !== "object") return;

        new Date(data.expire || new Date()) > new Date() ? this.authorized = true : this.authorized = false;
        this.#token = data.token || "";
        this.user = {
            name: data.firstName,
            surname: data.lastName,
            id: this.#removeLetters(data.ident || ""),
            ident: data.ident,
        };
        this.expiration = data.expire || `${new Date().getFullYear()}-${new Date().getMonth()}-${new Date().getDate()}T${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}+01:00`;
        return;
    }

    /**
     * @private Removes letters from a string
     * @param {string} string string to remove letters from
     * @returns {string} string without letters
     */
    #removeLetters(string: string): string {
        return string.replace(/[^0-9]/g, "");
    }

    /**
     * @private Formats date to string in format YYYYMMDD
     * @param {Date} date date to format
     * @returns {string} date in format YYYYMMDD
     */
    #formatDate(date = new Date()): string {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${year}${month < 10 ? "0" + month : month}${day < 10 ? "0" + day : day}`;
    }

    /**
     * @private Fetch data from the server and the specified endpoint, then returns it
     * @param {string} path api path
     * @param {string} [method] http method
     * @param {string} [type] students | parents
     * @param {string} [body] body to send
     * @param {boolean} [json] if the data should be parsed to json
     * @param {string} [id] user identifier
     * @param {object} [customHeaders] additional headers to send
     * @returns {Promise<any>} the response
     */
    async #fetch<TResponse>({
        path = "/",
        method = "GET",
        type = "students",
        body = "",
        json = true,
        id = "userId",
        customHeaders = {}
    }: FetchOptions = {}): Promise<TResponse | Promise<never>> {
        if (!this.authorized) return this.#error("Not logged in ❌");

        const headers: HeadersInit = Object.assign(this.#headers, { "Z-Auth-Token": this.#token, ...customHeaders });
        const options: RequestInit = {
            method: method.toUpperCase(),
            headers,
        };
        if (body && method !== "GET") options.body = body;

        const response: Response = await require('node-fetch')(`${this.#baseUrl}/${type}/${id == "userId" ? this.user.id : this.user.ident}${path}`, options);

        const res: FetchResponse = {
            status: response.status,
            data: json ? await response.json() : await response.buffer()
        };

        if (res.data?.error) {
            const { data } = res;
            return this.#error(`An error happened: ${data.message ? data.message : data.error.split('/').pop()} (${data.statusCode}) ❌`);
        }

        if (res.status !== 200) return this.#error(`The server returned a status different from 200 (${res.status}) ❌`);

        return res.data;
    }

    /**
     * @private Rejects the promise and logs the error
     * @param message error message
     * @returns {Promise<never>} rejected promise
     */
    #error(message: string): Promise<never> {
        this.#log(message);
        return Promise.reject(message);
    }

    /**
     * @private Logs whatever provided
     * @param  {any[]} args arguments to log
     * @returns {void} log in the console
     */
    #log(...args: any[]): void {
        if (!this.debug) return;
        console.log(`\x1b[31m[CLASSEVIVA]\x1b[0m`, ...args);
    }
}

export default Rest;