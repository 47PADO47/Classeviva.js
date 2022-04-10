export interface IStates {
    Italy: string;
    SanMarino: string;
    Argentina: string;
};

export const States: Readonly<IStates> = Object.freeze({
    Italy: "IT",
    SanMarino: "SM",
    Argentina: "AR",
});

export interface IApps {
    Students: string;
    Family: string;
    Aant: string;
    Teachers: string;
};

export const Apps: Readonly<IApps> = Object.freeze({
    Students: "CVVS/studente/4.1.5",
    Family: "CVVS/famiglia/4.1.5",
    Aant: "CVVS/aant/2.1.2",
    Teachers: "CVVS/docente/2.1.4",
});

export interface IUrls {
    [key: string]: string;
};

export const Urls: Readonly<IUrls> = Object.freeze({
    IT: "web.spaggiari.eu",
    SM: "web.spaggiari.sm",
    AR: "ar.spaggiari.eu",
});

export interface IUsers {
    [key: string]: string;
}

export const UserTypes: Readonly<IUsers> = {
    S: "studente",
    G: "genitore",
};

export default {
    States,
    Apps,
    Urls,
    UserTypes,
};