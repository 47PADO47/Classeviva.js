import { ObjectValues } from "../types/enums";

const States = {
    Italy: "IT",
    SanMarino: "SM",
    Argentina: "AR",
} as const;
type State = ObjectValues<typeof States>;

const Apps = {
    Students: "CVVS/studente/4.1.8",
    Family: "CVVS/famiglia/4.1.8",
    Aant: "CVVS/aant/2.1.2",
    Teachers: "CVVS/docente/2.1.4",
    Inalpi: "CVVS/inapli/3.1.7",
    //Inalpi: "classevivaInalpi/3.1.7",
    //Tibidabo: "OAS User Agent"
    //Tibidabo: "Il Social/1.205 CFNetwork/1474 Darwin/23.0.0",
    //CatalogoSpaggiari: "CatalogoSpaggiari iPad User Agent ;)"
} as const;
type App = ObjectValues<typeof Apps>;

const StateUrls = {
    IT: "web.spaggiari.eu",
    SM: "web.spaggiari.sm",
    AR: "ar.spaggiari.eu",
} as const;

const UserTypes = {
    S: "studente",
    G: "genitore",
    A: "insegnante",
    X: "unknonw"
} as const;
type userTypesKeys = keyof typeof UserTypes;
type userType = ObjectValues<typeof UserTypes>;

export {
    States,
    Apps,
    StateUrls,
    UserTypes,
};

export type {
    State,
    App,
    userTypesKeys,
    userType,
}