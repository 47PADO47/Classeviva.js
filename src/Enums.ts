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
    Students: "CVVS/studente/4.1.8",
    Family: "CVVS/famiglia/4.1.8",
    Aant: "CVVS/aant/2.1.2",
    Teachers: "CVVS/docente/2.1.4",
    Inalpi: "classevivaInalpi/3.1.7",
    Tibidabo: "Il Social/1.205",
    CatalogoSpaggiari: "CatalogoSpaggiari iPad User Agent ;)"
});

export interface IUrls {
    [key: string]: string;
};

export const Urls: Readonly<IUrls> = Object.freeze({
    IT: "web.spaggiari.eu",
    SM: "web.spaggiari.sm",
    AR: "ar.spaggiari.eu",
});

export type userTypesKeys = 'S' | 'G' | 'A' | 'X';

export type IUsers = {
    [key: string]: string;
};

export const UserTypes: Readonly<IUsers> = {
    S: "studente",
    G: "genitore",
    A: "insegnante",
};

export default {
    States,
    Apps,
    Urls,
    UserTypes,
};