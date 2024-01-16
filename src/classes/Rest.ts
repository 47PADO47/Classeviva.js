import { parse, join } from 'path';
import { readFileSync, writeFileSync } from 'fs';
import { ClassOptions, User, LoginResponse, AgendaFilter, TalkOptions, Overview, Card, ContentElement, TermsAgreementResponse, setTermsAgreementResponse, readOptions, TokenStatus, TicketResponse, checkDocument, absences, readNotice, Grade, calendarDay, FetchOptions, resetPassword, AgendaNotes, readNote, Term, RestFetchOptions, MinigameToken, Homeworks, MinigameScope, MinigameLeaderboard, SchoolCheck, SchoolBooksResponse, CourseBooks, Notice, ApiResponse } from '../types/rest';
import * as Enums from '../base/enums';
import BaseApiClient from '../base/client';
import { Dispatcher } from 'undici';

class Rest extends BaseApiClient {
    public readonly username: string;
    readonly #password: string;
    #token: string;

    #state: Enums.State;
    readonly #directory: string;

    public login_timeout: NodeJS.Timeout | null;
    public expiration: string;
    public debug: boolean;
    public saveTempFile: boolean;
    public keepAlive: boolean;

    public user: User;
    constructor(opts: ClassOptions = {}) {
        super({
            debug: opts.debug || false,
            app: opts.app || Enums.Apps.Students,
            host: 'https://web.spaggiari.eu/'
        });

        this.username = opts.username || "";
        this.#password = opts.password || "";

        this.#state = opts.state || Enums.States.Italy;
        this.#directory = join(parse(__dirname).dir, '..');

        this.login_timeout = null;
        this.debug = opts.debug || false;
        this.saveTempFile = opts.saveTempFile ?? true;
        this.keepAlive = opts.keepAlive || true;

        this.resetAuth();
        this.setHeaders({
            "Z-Dev-Apikey": "Tg1NWEwNGIgIC0K",
            "Z-If-None-Match": "",
        });

        this.log('app', this.app);
    }

    /**
     * Logins to Classeviva
     * @param {string} [username] Classeviva credentials username
     * @param {string} [password] Classeviva credentials password
     * @returns {object} user object
     */
    async login(username = this.username, password = this.#password): Promise<undefined | User> {
        if (this.authorized) return this.error("Already logged in");
        if (!username || !password) return this.error("Username or password not set");

        if (!await this.#checkTemp() || !this.saveTempFile) {
            const userData = {
                uid: username,
                pass: password,
            };

            const response = await this.httpClient.request({
                path: `${this.getPath()}/auth/login/`,
                method: "POST",
                headers: this.headers,
                body: JSON.stringify(userData),
            });
    
            const json = await response.body.json() as ApiResponse<LoginResponse>;
    
            if ("error" in json) {
                this.authorized = false;
                return this.error(json.message ?? json.error, json.statusCode);
            }

            if (response.statusCode !== 200) return this.error(`The server returned a status code other than 200`, response.statusCode);
            
            this.#updateData(json);
            if (this.saveTempFile) {
                await writeFileSync(`${this.#directory}/cvv.json`, JSON.stringify(json, null, 2));
                this.log("Saved temp file ✅");
            }
        }

        if (!this.authorized) return this.error("Failed to login");

        this.log(`Successfully logged in as "${this.user.name} ${this.user.surname}" ✅`);
        if (this.keepAlive) {
            this.login_timeout = setTimeout(() => {
                this.login();
            }, 1000 * 60 * 60 * 1.5);
            this.log(`Set login_timeout`);
        };
        
        return this.user;
    }

    /**
     * Logs out from Classeviva
     * @returns {boolean} true if logged out, error if already logged out
     */
    logout(): true {
        if (!this.authorized) return true;
        if (this.login_timeout) clearTimeout(this.login_timeout);
        
        this.resetAuth();
        this.log("Successfully logged out ✅");
        return true;
    }

    /**
     * Get student's cards
     * @returns {object[]} Array of objects containing the student's cards
     */
    async getCards(): Promise<Card[]> {
        const data = await this.#fetchRest<{ cards: Card[] }>({ path: "/cards" });
        if (data?.cards && data?.cards?.length > 0) this.#updateUser(data.cards[0]);
        
        return data?.cards ?? [];
    }

    /**
     * Get student's card
     * @returns {object} Object containing the student's card
     */
    async getCard(): Promise<Card | undefined> {
        const data = await this.#fetchRest<{ card: Card }>({ path: "/card" });
        if (data?.card && Object.keys(data?.card ?? {}).length > 0) this.#updateUser(data.card);

        return data?.card;
    }

    /**
     * Get student's grades
     * @returns {object[]} Array of objects containing the student's grades
     */
    async getGrades(): Promise<Grade[]> {
        const data = await this.#fetchRest<{grades: Grade[]}>({ path: `/grades2` });
        return data?.grades ?? [];
    }

    /**
     * Get student's absences
     * @returns {object[]} Array of objects containing the student's absences
     */
    async getAbsences(): Promise<absences[]> {
        const data = await this.#fetchRest<{events: absences[]}>({ path: `/absences/details` });
        return data?.events ?? [];
    }

    /**
     * Get student's agenda
     * @param {string} filter "all" | "homework" | "other", default "all", used to filter the agenda
     * @param {Date} start The start date of the agenda (defaults to today)
     * @param {Date} end  The end date of the agenda (defaults to today)
     * @returns {object[]} Array of objects containing the student's agenda
     */
    async getAgenda(filter: AgendaFilter = "all", start: Date = new Date(), end: Date = new Date()): Promise<unknown> {
        const filters = ["all", "homework", "other"];
        if (!filters.includes(filter)) return this.error("Invalid filter");
        const map = {
            all: "all",
            homework: "AGHW",
            other: "AGNT",
        };

        const data = await this.#fetchRest<{ agenda: unknown[] }>({ path: `/agenda/${map[filter]}/${this.#formatDate(start)}/${this.#formatDate(end)}` });
        return data?.agenda ?? [];
    }

    /**
     * Get student's documents
     * @returns {object[]} Array of objects containing the student's documents
     */
    async getDocuments(): Promise<unknown> {
        const data = await this.#fetchRest({ path: "/documents", method: "POST" });
        return data ?? [];
    }

    /**
     * Get student's noticeboard items
     * @returns {object[]} Array of objects containing the student's noticeboard items
     */
    async getNoticeboard(): Promise<Notice[]> {
        const data = await this.#fetchRest<{items: Notice[]}>({ path: "/noticeboard" });
        return data?.items ?? [];
    }

    /**
     * Get student's books
     * @returns {object[]} Array of objects containing the student's books
     */
    async getSchoolBooks(): Promise<CourseBooks[] | undefined> {
        const data = await this.#fetchRest<SchoolBooksResponse>({ path: "/schoolbooks" });
        return data?.schoolbooks;
    }

    /**
     * Get student's calendar
     * @returns {object[]} Array of objects containing the student's calendar
     */
    async getCalendar(): Promise<calendarDay[]> {
        const data = await this.#fetchRest<{ calendar: calendarDay[] }>({ path: "/calendar/all" });
        return data?.calendar ?? [];
    }

    /**
     * Get student's lessons
     * @param {boolean} [today] Boolean to get today's lessons, default true
     * @param {Date} [start] If today is false, the start date of the lessons (defaults to today)
     * @param {Date} [end] If today is false, the end date of the lessons (defaults to today)
     * @returns {object[]} Array of objects containing the student's lessons
     */
    async getLessons(today: boolean = true, start: Date = new Date(), end: Date = new Date()): Promise<unknown> {
        const data = await this.#fetchRest<{ lessons: unknown[] }>({ path: `/lessons${today ? "/today" : `/${this.#formatDate(start)}/${this.#formatDate(end)}`}` });
        return data?.lessons ?? [];
    }

    /**
     * Get student's notes
     * @returns {object[]} Array of objects containing the student's notes
     */
    async getNotes(): Promise<unknown> {
        const data = await this.#fetchRest({ path: "/notes/all" });
        return data ?? [];
    }

    /**
     * Get student's periods
     * @returns {object[]} Array of objects containing the student's periods
     */
    async getPeriods(): Promise<unknown> {
        const data = await this.#fetchRest<{ periods: unknown[] }>({ path: "/periods" });
        return data?.periods ?? [];
    }

    /**
     * Get student's subjects
     * @returns {object[]} Array of objects containing the student's subjects
     */
    async getSubjects(): Promise<unknown> {
        const data = await this.#fetchRest<{ subjects: unknown[] }>({ path: "/subjects" });
        return data?.subjects ?? [];
    }

    /**
     * Get student's didactics items
     * @returns {object[]} Array of objects containing the student's didactics items
     */
    async getDidactics(): Promise<unknown> {
        const data = await this.#fetchRest<{ didacticts: unknown[] }>({ path: "/didactics" });
        return data?.didacticts ?? [];
    }

    /**
     * Get a list of the possible parents options for classeviva
     * @returns {object} An object containing all the possible parents options for classeviva
     */
    async getParentsOptions(): Promise<unknown> {
        const data = await this.#fetchRest<{ options: unknown[] }>({ path: "/_options", method: "GET", type: "parents" });
        return data?.options ?? {};
    }

    /**
     *  Get a list of the avaible talks with teachers on classeviva
     * @returns {object[]} An array of objects containing data about the avaible talks with teachers for classeviva
     */
    async getOverallTalks(): Promise<unknown> {
        const data = await this.#fetchRest<{ overallTalks: unknown[] }>({ path: "/overalltalks/list", method: "GET", type: "parents" });
        return data?.overallTalks ?? [];
    }
    
    /**
     *  Get a list of something regarding the talks with teachers
     * @param {Date} start The start date of the talks (defaults to today)
     * @param {Date} end The end date of the talks (defaults to today)
     * @returns {object[]} An array of objects containing data about the talks with teachers for classeviva
     */
    async getTalks(start: Date = new Date(), end: Date = new Date()): Promise<unknown> {
        const data = await this.#fetchRest<{ teachers: unknown[] }>({ path: `/talks/teachersframes/${this.#formatDate(start)}/${this.#formatDate(end)}`, method: "GET", type: "parents" });
        return data?.teachers ?? [];
    }

    /**
     *  Get auth ticket
     * @returns {object} An object containing data about the auth ticket
     */
    async getTicket(): Promise<TicketResponse | undefined> {
        return this.fetch<TicketResponse>({
            url: `${this.getPath()}/auth/ticket`
        });
    }

    /**
     *  Get the user avatar
     * @returns {unknown} The user avatar (not tested)
     */
    async getAvatar() {
        return this.fetch({
            url: `${this.getPath()}/auth/avatar`
        });
    }

    /**
     * Get an overview of the day specified or the time specified
     * @param {Date} start The start date of the overview (defaults to today)
     * @param {Date} end The end date of the overview (defaults to today)
     * @returns {object} An object containing data about the overview of a day or the time specified
     */
    async getOverview(start: Date = new Date(), end: Date = new Date()): Promise<Overview | undefined> {
        const data = await this.#fetchRest<Overview>({ path: `/overview/all/${this.#formatDate(start)}/${this.#formatDate(end)}` });
        return data;
    }

    /*/**
     * Not implemented yet 😢
     * @param {string || number} bookingId booking id of the talk
     * @param {string} message message to send
     * @returns {unknown}
     */
    /*async sendTeacherMessage(bookingId: string, message: string) {
        const data = await this.#fetchRest(`/talks/teachermessage/${bookingId}`, "POST", "parents");
        return data ?? {};
    }; */

    /**
     * Read messages from the inbox of a talk
     * @param {string || number} bookingId booking id of the talk
     * @param {string} message message to send
     * @returns {object}
     */
    async readTalkMessage(bookingId: string) {
        const data = await this.#fetchRest({ path: `/talks/teachermessage/${bookingId}`, method: "POST", type: "parents", body: JSON.stringify({ "messageRead": true }) });
        return data ?? {};
    }

    /**
     * Checks if a document is avaible
     * @param {string | number} hash The hash of the document
     * @returns {object} An object containing data about the document
     */
    async checkDocument(hash: string | number): Promise<checkDocument | undefined> {
        const data = await this.#fetchRest<checkDocument>({ path: `/documents/check/${hash}/`, method: "POST" });
        return data;
    }

    /**
     * Book a talk with a teacher
     * @param {string | number} teacherId The id of the teacher
     * @param {string | number} talkId The id of the talk
     * @param {string | number} slot The slot of the talk
     * @param {object} opts contact options
     * @returns {object} An object containing data about the booked talk
     */
    async bookTalk(teacherId: string | number, talkId: string | number, slot: string | number, opts: TalkOptions): Promise<unknown> {
        const data = await this.#fetchRest({ path: `/talks/book/${teacherId}/${talkId}/${slot}`, method: "POST", type: "parents", body: JSON.stringify(opts) });
        return data ?? {};
    }

    /**
     * Get the list of contents that's displayed in the app (should be "Classeviva extra")
     * @param {number} year year of contents
     * @param {boolean} common idk, defaults to true
     * @returns {object[]} An array of objects containing data about the contents that's displayed in the app
     */
    async getContents(year: string | number = new Date().getFullYear(), common = true): Promise<ContentElement[] | void> {
        if (!this.user.school?.code) return this.error("No school code, please update using getCard() or getCards()");
        
        return this.fetch<ContentElement[]>({
            url: `${this.getHost()}/gek/api/v1/${this.user.school.code}/${year}/students/contents?common=${common}`
        });
    }

    /**
     * Get infos about your agreement to the terms of classeviva. If you haven't agreed yet, this response body will be empty and the function will return an empty object.
     * @returns {object} An object containing data about the agreement to the terms of classeviva
     */
    async getTermsAgreement(): Promise<TermsAgreementResponse | undefined> {
        const data = await this.#fetchRest<TermsAgreementResponse>({ path: "/getTermsAgreement", type: "users", id: "userIdent" });
        return data;
    }

    /**
     * Set the agreement to the terms of classeviva third party data colletors
     * @param {boolean} ThirdParty Whether you agree to the terms of classeviva third party data colletors, defaults to true
     * @returns {object} An object with the property "msg": "ok" if the agreement was set successfully
     */
    async setTermsAgreement(ThirdParty: boolean = false): Promise<setTermsAgreementResponse> {
        const accepted = ThirdParty ? "1" : "0";
        const data = await this.#fetchRest<setTermsAgreementResponse>({ path: "/setTermsAgreement", method: "POST", type: "users", body: JSON.stringify({ bitmask: accepted }), id: "userIdent" });
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
        const data = await this.#fetchRest<readNotice>({
                path: `/noticeboard/read/${eventCode}/${id}/101`, method: "POST", body: options ? JSON.stringify(options) : "", customHeaders: {
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            });
        
        return data;
    }

    /**
     * Get the document url of a notice attachment
     * @param {string} eventCode Event code of the notice
     * @param {string | number} id Id of the notice
     * @returns {string} The url of the document
     */
    async getNoticeDocumentUrl(eventCode: string, id: string | number): Promise<string | void> {
        if (!this.authorized) return this.error("Not authorized");

        const headers = {
            ...this.headers,
            "Z-Auth-Token": this.#token,
        };
        
        const response = await this.httpClient.request({
            path: `${this.getPath()}/students/${this.user.ident}/noticeboard/attach/${eventCode}/${id}/`,
            method: 'GET',
            headers,
        });

        const location = response.headers["Location"];

        const url = Array.isArray(location) ? location[0] : location;
        return url ?? "";
    }

    /**
     * Get the status of the user token
     * @returns {object} An object containing data about the token
     */
    async getTokenStatus(): Promise<TokenStatus | void> {
        return this.fetch<TokenStatus>({
            url: `${this.getPath()}/auth/status`
        });
    }

    /**
     * Read a document
     * @param {string} hash the hash of the document
     * @returns {Buffer} The document
     */
    async readDocument(hash: string): Promise<Buffer | undefined> {
        const data = await this.#fetchRest<Buffer>({ path: `/documents/read/${hash}/`, method: "POST", responseType: "buffer" });
        return data;
    }

    async resetPassword(email: string): Promise<resetPassword | void> {
        return this.fetch<resetPassword>({
            url: `${this.getHost()}sso/app/default/sam.php?a=akRSPWRQ`,
            body: `eml=${email}`,
            customHeaders: {
                "Content-Type": "application/x-www-form-urlencoded",
                "X-Requested-With": "XMLHttpRequest"
            }
        });
    }

    async readNote(noteType: keyof AgendaNotes, noteId: string | number): Promise<readNote | undefined> {
        const data = await this.#fetchRest<{ event: readNote }>({ path: `/notes/${noteType}/read/${noteId}/`, method: "POST", type: "students", body: undefined });
        return data?.event;
    }

    async getTerms(): Promise<Term[] | void> {
        return this.fetch<Term[]>({
            url: `${this.getHost()}auc/api/v2/getTerms`,
        });
    }

    async getAucContents() {
        return this.fetch({
            url: `${this.getHost()}auc/api/v2/contents`,
            responseType: "text",
        });
    }

    async getAucContentAuths() {
        return this.fetch({
            url: `${this.getHost()}auc/api/v2/contentAuths`,
            responseType: "text",
        });
    }

    async getSchoolPresentation(schoolCode: string) {
        return this.fetch<string>({
            url: `${this.getHost()}gek/getSchoolPresentation/${schoolCode}`,
            responseType: "text",
        });
    }

    setState(newState: Enums.State) {
        this.#state = newState;
        this.rebuildHTTPClient();

        this.log('set state to', newState);
    };

    async getHomeworks() {
        return this.#fetchRest<Homeworks>({ path: '/homeworks' })
    }

    async getMinigameToken() {
        /*
            minigameToken payload: 
            {
                "exp": number, //expiration unix timestamp
                "sub": string, //user identi (with letters)
                "aud": string, //school code
                "syr": string //year
            }
        */
        return this.fetch<MinigameToken>({
            url: `${this.getPath()}/auth/minigame`
        })
    }

    async getMinigameLeaderboard(scope: MinigameScope, gameId: number) {
        return await this.#fetchMinigame<MinigameLeaderboard>({
            url: `${this.getPath()}/minigame/leaderboards/${scope}/${gameId}/${this.user.ident}`,
        });
    }
    
    async checkSchool(schoolCode = this.user.school?.code, year = 2022): Promise<SchoolCheck | undefined> {
        return await this.fetch<SchoolCheck>({
            url: `${this.getHost()}gek/api/v1/${schoolCode}/${year}/checkSchool`,
        })
    }

    protected getPath() {
        return `${this.getHost()}rest/v1`;
    }

    /**
     * @private Returns the classeviva host
     * @returns {string} The classeviva host
     */
    protected getHost(state: Enums.State = this.#state): string {
        return `https://${Enums.StateUrls[state]}/`;
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

    protected async fetch<T = unknown>({
        url,
        method = "GET",
        body,
        responseType = "json",
        customHeaders = {}
    }: FetchOptions): Promise<T | undefined> {
        if (!this.authorized) return this.error("Not logged in");

        const headers: Record<string, string> = {
            ...this.headers,
            "Z-Auth-Token": this.#token,
            ...customHeaders,
        };

        const options: Dispatcher.RequestOptions = {
            path: url,
            method,
            headers,
            body: method.toUpperCase() !== 'GET' ? body : undefined
        };

        const response = await this.httpClient.request(options);

        switch (responseType) {
            case 'json':
                const data = await response.body.json() as ApiResponse<T>;

                if ("error" in data) {
                    return this.error(data.message ? data.message : (data.error.split('/').pop() ?? 'Unknown error'), data.statusCode);
                }

                return data;
            case 'buffer':
                return await response.body.blob() as T;
            case 'text':
                return await response.body.text() as T;
            default:
                return this.error('Invalid responseType')
        }
    }

    /**
     * @private Fetch data from the REST API
     * @param {string} path api path
     * @param {string} [method] http method
     * @param {string} [type] students | parents
     * @param {string} [body] body to send
     * @param {string} [responseType] response body type
     * @param {string} [id] user identifier
     * @param {object} [customHeaders] additional headers to send
     * @returns {Promise<unknown>} the response
     */
    async #fetchRest<T>({
        path = "/",
        type = "students",
        id = "userId",
        ...opts
    }: RestFetchOptions) {
        const url = `${this.getPath()}/${type}/${id == "userId" ? this.user.id : this.user.ident}${path}`;

        return this.fetch<T>({
            url,
            ...opts,
        });
    }

    async #fetchMinigame<T extends {}>(opts: FetchOptions) {
        const data = await this.getMinigameToken();
        if (!data?.minigameToken) return;

        return this.fetch<T>({
            ...opts,
            customHeaders: {
                'Authorization': `Bearer ${data.minigameToken}`,
            }
        })
    }

    protected resetAuth() {
        this.authorized = false;
        this.#token = "";
        this.expiration = "";

        this.user = {
            name: undefined,
            surname: undefined,
            id: undefined,
            ident: undefined,
            type: undefined,
            school: {}
        };

        return this;
    };
}

export default Rest;