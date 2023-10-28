export type WithLoggingOptions = {
    debug: boolean;
    log?: (...args: unknown[]) => void;
}

export interface WithLogging extends Required<WithLoggingOptions> {};