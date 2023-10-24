import { BaseApiClientOptions, FetchOptions, IBaseApiClient, User } from "../types/client";
import HTTPClient from "./http";
import ApiError from "./error";
import { App } from "./enums";
import { Dispatcher } from "undici";

abstract class BaseApiClient implements IBaseApiClient {
    protected headers: Record<string, string>;
    protected httpClient: HTTPClient;
    public abstract user: User;
    public debug: boolean;
    public readonly app: App | null;
    public authorized: boolean;

    constructor(options: BaseApiClientOptions) {
        this.debug = options.debug;
        if (options.log) this.log = options.log;
        if (options.resetAuth) this.resetAuth = options.resetAuth;
        
        this.httpClient = new HTTPClient({
            url: options.host ?? this.getHost(),
            debug: options.debug,
        });

        this.app = options.app || null;
        this.headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": this.app || '',
            "X-Requested-With": "XMLHttpRequest",
        };

        this.log('app', this.app);
    }
    
    public abstract login(): Promise<User | undefined>;
    public abstract logout(): boolean;
    protected abstract fetch<T = unknown>(options: FetchOptions): Promise<T | undefined>
    protected abstract getPath(): string;
    protected abstract resetAuth(): BaseApiClient;

    log(...args: any[]): void {
        if (!this.debug) return;
        console.log(`[\x1b[31mCLASSEVIVA\x1b[0m]`, ...args);
    }

    protected error(message: string, statusCode: number = 0): Promise<never> {
        this.log(`An error happened: ${message} ❌`);
        return Promise.reject(new ApiError(message, statusCode));
    }
    
    protected getHost(): string {
        return 'https://web.spaggiari.eu/';
    };

    protected rebuildHTTPClient() {
        this.httpClient.close();
        
        this.httpClient = new HTTPClient({
            url: this.getHost(),
            debug: this.debug,
        });

        return this;
    }

    protected setHeaders(headers: Record<string, string>) {
        Object.assign(this.headers, headers);
        return this;
    }

    protected getCookie(response: Dispatcher.ResponseData, name: string): string {
        const cookies = response.headers[name];
        if (!cookies) return "";
    
        const cookie = (Array.isArray(cookies) ? cookies[0] : cookies)
          .split(", ")
          .pop();
    
        return cookie ?? "";
    }

    /**
     * Get a list of the Classeviva class' functions
     * @returns {string[]} An array containing the Classeviva class' functions
     */
    public getMethods(): string[] {
        return Object
            .getOwnPropertyNames(Object.getPrototypeOf(this))
            .filter(prop => prop !== "constructor");
    }
};


export default BaseApiClient;