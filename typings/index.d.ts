declare module "classeviva.js" {
    export class Classeviva {
        constructor(username: string, password: string);
        login(username?: string, password?: string): user;
        logout(): boolean;
        getCards(): object[];
        getGrades(): object[];
        getAbsences(): object[];
        getAgenda(filter?: agendaFilter, start?: Date, end?: Date): object[];
        getDocuments(): object[];
        getNoticeboard(): object[];
        getSchoolBooks(): object[];
        getCalendar(): object[];
        getLessons(today?: boolean, start?: Date, end?: Date): object[];
        getNotes(): object[];
        getPeriods(): object[];
        getSubjects(): object[];
        getDidactics(): object[];
        getMethods(): string[];
    }
    
    export interface user {
        name?: string;
        surname?: string;
        id?: number | string;
    }
    
    export type agendaFilter = 'all' | 'homework' | 'other';
}