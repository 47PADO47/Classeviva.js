import { Client, Dispatcher } from "undici";
import { HTTPClientOptions, IHTTPCLient } from "../types/http";

class HTTPClient extends Client implements IHTTPCLient {
    url: string;
    debug: boolean;
    constructor({ url, ...options }: HTTPClientOptions) {
        super(url, options.options)
        
        this.url = url;
        this.debug = options.debug;
    }

    async request(options: Dispatcher.RequestOptions): Promise<Dispatcher.ResponseData> {
        this.log(options.method, options.path, JSON.stringify(options.body || {}));

        const response = await super.request(options);
        this.log(response.statusCode, response.headers['content-type']);

        return response;
    }

    log(...args: unknown[]): void {
        if (!this.debug) return;
        console.log('[\x1b[36mHTTP Client\x1b[0m]', ...args);
    }
}

export default HTTPClient;