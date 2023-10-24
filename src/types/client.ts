import { WithApp, WithAppOptions } from "../interfaces/app";
import { WithLogging, WithLoggingOptions } from "../interfaces/logging"
import { WithAuthorization, WithAuthorizationOptions } from "../interfaces/authorization";

interface IBaseApiClient extends WithLogging, WithApp, WithAuthorization {};

type BaseApiClientOptions = {
    host?: string;
} & WithLoggingOptions & WithAppOptions & WithAuthorizationOptions;

interface FetchOptions {
    url: string
}

interface User extends Record<string, any> {};

export type {
    IBaseApiClient,
    BaseApiClientOptions,
    FetchOptions,
    User,
}