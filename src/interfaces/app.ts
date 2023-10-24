import { App } from "../base/enums";

export type WithAppOptions = {
    app?: App;
}

export interface WithApp {
    readonly app: App | null;
};