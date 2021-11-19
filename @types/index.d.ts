export class Classeviva {
    constructor(username: string, password: string);
    login(): user;
    logout(): boolean;
    getCards(): Array<object>;
    getGrades(): Array<object>;
    getAbsences(): Array<object>;
    getAgenda(filter: agendaFilter, start: Date, end: Date): Array<object>;
    getDocuments(): Array<object>;
    getNoticeboard(): Array<object>;
    getSchoolBooks(): Array<object>;
    getCalendar(): Array<object>;
    getLessons(today: boolean, start: Date, end: Date): Array<object>;
    getNotes(): Array<object>;
    getPeriods(): Array<object>;
    getSubjects(): Array<object>;
    getDidactics(): Array<object>;
}

export interface user {
    name?: string;
    surname?: string;
    id?: number | string;
}

export type agendaFilter = 'all' | 'homework' | 'other';