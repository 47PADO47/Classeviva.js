export type WithLoggingOptions = {
    debug: boolean;
    log?: (...args: any[]) => void;
}

export interface WithLogging extends Required<WithLoggingOptions> {};