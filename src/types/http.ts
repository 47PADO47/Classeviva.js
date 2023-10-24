import { WithLogging, WithLoggingOptions } from "../interfaces/logging";
import { Client } from 'undici';

export interface IHTTPCLient extends WithLogging {
    url: string;
}

export type HTTPClientOptions = {
    url: string;
    options?: Client.Options
} & WithLoggingOptions