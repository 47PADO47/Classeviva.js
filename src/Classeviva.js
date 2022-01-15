const { readFileSync, writeFileSync } = require('fs');

class Classeviva {
    #token = "";
    #headers = {};
    constructor(username = "", password = "") {
        this.username = username;
        this.password = password;
        this.#token = "";

        this.baseUrl = "https://web.spaggiari.eu/rest/v1";
        this.directory = require('path').parse(__dirname).dir;

        this.login_timeout = null;
        this.expiration = null;

        this.authorized = false;
        this.user = {
            name: "",
            surname: "",
            id: "",
        };

        this.#headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "zorro/1.0",
            "Z-Dev-ApiKey": "+zorro+",
        };
    };

    /**
     * Logins to Classeviva
     * @param {string} [username] Classeviva credentials username
     * @param {string} [password] Classeviva credentials password
     * @returns {object} user object
     */
    async login(username = this.username, password = this.password) {
        if (this.authorized) return this.#log("Already logged in ❌");

        if (!await this.#checkTemp()) {
            const userData = {
                uid: username,
                pass: password,
            };
    
            const response = await require('node-fetch')(`${this.baseUrl}/auth/login/`, {
                method: "POST",
                headers: this.#headers,
                body: JSON.stringify(userData),
            });
    
            const json = await response.json();
    
            if (json.error) {
                this.#log(`An error happened: ${json.message} (${json.statusCode}) ❌`);
                this.authorized = false;
                return;
            };
            if (response.status === 200) {
                this.#updateData(json);
    
                writeFileSync(`${this.directory}/cvv.json`, JSON.stringify(json, null, 2));
            };
        };

        if (this.authorized) {
            this.#log(`Successfully logged in as "${this.user.name} ${this.user.surname}" ✅`);
            this.login_timeout = setTimeout(() => {
                this.login();
            }, new Date(this.expiration) - +new Date() - (10 * 60 * 1000));
        } else {
            this.#log("Failed to login ❌");
        };

        return this.user;
    };

    /**
     * Logs out from Classeviva
     * @returns {boolean} true if logged out, false if already logged out
     */
    logout() {
        if (this.authorized) {
            clearTimeout(this.login_timeout);
            this.authorized = false;
            this.#token = "";
            this.user = {};
            this.expiration = null;
            this.#log("Successfully logged out ✅");
            return true;
        } else {
            this.#log("Already logged out ❌");
            return false;
        };
    };

    /**
     * Get student's cards
     * @returns {object[]} Array of objects containing the student's cards
     */
    async getCards() {
        const data = await this.#fetch("/cards");
        return data?.cards ? data.cards : [];
    };

    /**
     * Get student's grades
     * @returns {object[]} Array of objects containing the student's grades
     */
    async getGrades() {
        //${subject ? `/subject/${subject}` : `/`}
        const data = await this.#fetch(`/grades`);
        return data?.grades ? data.grades : [];
    };

    /**
     * Get student's absences
     * @returns {object[]} Array of objects containing the student's absences
     */
    async getAbsences() {
        const data = await this.#fetch(`/absences/details`);
        return data?.events ? data.events : [];
    };

    /**
     * Get student's agenda
     * @param {string} filter "all" | "homework" | "other", default "all", used to filter the agenda
     * @param {Date} start The start date of the agenda (defaults to today)
     * @param {Date} end  The end date of the agenda (defaults to today)
     * @returns {object[]} Array of objects containing the student's agenda
     */
    async getAgenda(filter = "all", start = new Date(), end = new Date()) {
        const filters = ["all", "homework", "other"];
        if (!filters.includes(filter)) return this.#log("Invalid filter ❌");
        const map = {
            all: "all",
            homework: "AGHW",
            other: "AGNT",
        };

        const data = await this.#fetch(`/agenda/${map[filter]}/${this.#formatDate(start)}/${this.#formatDate(end)}`);
        return data?.agenda ? data.agenda : [];
    };

    /**
     * Get student's documents
     * @returns {object[]} Array of objects containing the student's documents
     */
    async getDocuments() {
        const data = await this.#fetch("/documents", "POST");
        return data ? data : [];
    };

    /**
     * Get student's noticeboard items
     * @returns {object[]} Array of objects containing the student's noticeboard items
     */
    async getNoticeboard() {
        const data = await this.#fetch("/noticeboard");
        return data?.items ? data.items : [];
    };

    /**
     * Get student's books
     * @returns {object[]} Array of objects containing the student's books
     */
    async getSchoolBooks() {
        const data = await this.#fetch("/schoolbooks");
        return data?.schoolbooks ? data.schoolbooks : [];
    };

    /**
     * Get student's calendar
     * @returns {object[]} Array of objects containing the student's calendar
     */
    async getCalendar() {
        const data = await this.#fetch("/calendar/all");
        return data?.calendar ? data.calendar : [];
    };

    /**
     * Get student's lessons
     * @param {boolean} [today] Boolean to get today's lessons, default true
     * @param {Date} [start] If today is false, the start date of the lessons (defaults to today)
     * @param {Date} [end] If today is false, the end date of the lessons (defaults to today)
     * @returns {object[]} Array of objects containing the student's lessons
     */
    async getLessons(today = true, start = new Date(), end = new Date()) {
        const data = await this.#fetch(`/lessons${today ? "/today" : `/${this.#formatDate(start)}/${this.#formatDate(end)}`}`);
        return data?.lessons ? data.lessons : [];
    };

    /**
     * Get student's notes
     * @returns {object[]} Array of objects containing the student's notes
     */
    async getNotes() {
        const data = await this.#fetch("/notes/all");
        return data ? data : [];
    };

    /**
     * Get student's periods
     * @returns {object[]} Array of objects containing the student's periods
     */
    async getPeriods() {
        const data = await this.#fetch("/periods");
        return data?.periods ? data.periods : [];
    };

    /**
     * Get student's subjects
     * @returns {object[]} Array of objects containing the student's subjects
     */
    async getSubjects() {
        const data = await this.#fetch("/subjects");
        return data?.subjects ? data.subjects : [];
    };

    /**
     * Get student's didactics items
     * @returns {object[]} Array of objects containing the student's didactics items
     */
    async getDidactics() {
        const data = await this.#fetch("/didactics");
        return data?.didacticts ? data.didacticts : [];
    };

    /**
     * Get a list of the Classeviva clas' functions
     * @returns {string[]} An array containing the Classeviva class' functions
     */
    getMethods() {
        return Object.getOwnPropertyNames(Object.getPrototypeOf(this)).filter(prop => prop !== "constructor");
    };

    /**
     * @private Checks for temp file
     * @returns {boolean} True if there was temp file and it updated the data, false otherwise or in case of an error
     */
    async #checkTemp() {
        try {
            const temp = await readFileSync(`${this.directory}/cvv.json`, "utf8");
            if (!temp) {
                return false;
            };
            const json = JSON.parse(temp);

            if (new Date(json.expire) > new Date()) {
                this.#updateData(json);
                return true;
            } else return false;
        } catch (e) {
            return false;
        };
    };

    /**
     * @private Updates user data
     * @param {object} data user data to update
     * @returns {void}
     */
    #updateData(data) {
        if (!data) {
            this.logout();
            return;
        };

        if (typeof data === "object") {
            new Date(data.expire) > new Date() ? this.authorized = true : this.authorized = false;
            this.#token = data.token;
            this.user = {
                name: data.firstName,
                surname: data.lastName,
                id: this.#removeLetters(data.ident),
            };
            this.expiration = data.expire;
            return;
        } else return;

    };

    /**
     * @private Removes letters from a string
     * @param {string} string string to remove letters from
     * @returns {string} string without letters
     */
    #removeLetters(string) {
        return string.replace(/[^0-9]/g, "");
    };

    /**
     * @private Formats date to string in format YYYYMMDD
     * @param {Date} date date to format
     * @returns {string} date in format YYYYMMDD
     */
    #formatDate(date = new Date()) {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${year}${month < 10 ? "0" + month : month}${day < 10 ? "0" + day : day}`;
    };

    /**
     * @private Fetch data from the server and the specified endpoint, then returns it
     * @param {string} path api path
     * @param {string} method http method
     * @param {string} responseType the response type
     * @returns {Promise<object>} the response
     */
    async #fetch(path = "/", method = "GET", responseType = "json") {
        if (!this.authorized) return this.#log("Not logged in ❌");
        const headers = Object.assign({ "Z-Auth-Token": this.#token }, this.#headers);

        var response = await require('node-fetch')(`${this.baseUrl}/students/${this.user.id}${path}`, {
            method: method.toUpperCase(),
            headers
        });

        if (responseType == "json") response = { data: await response.json(), status: response.status };
        if (response?.data?.error) {
            const { data } = response;
            return this.#log(`An error happened: ${data.message ? data.message : data.error.split('/').pop()} (${data.statusCode}) ❌`);
        };
        if (response.status === 200) {
            return responseType == "json" ? response.data : response.body;
        };
    };

    /**
     * @private Logs whatever provided
     * @param  {...any} args arguments to log
     * @returns {void} log in the console
     */
    #log(...args) {
        return console.log(`\x1b[31m[CLASSEVIVA]\x1b[0m`, ...args);
    };
};

module.exports = Classeviva;