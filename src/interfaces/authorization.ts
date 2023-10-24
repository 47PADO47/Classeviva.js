export type WithAuthorizationOptions = {
    resetAuth?<T = void>(): T
}

export interface WithAuthorization {
    authorized: boolean;
    //resetAuth<T = void>(): T
};