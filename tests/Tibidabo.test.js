const { Tibidabo } = require('../dist/index.js');
let cvv;

beforeEach(() =>{
    cvv = new Tibidabo();
});

describe('Classeviva Tibidabo class creation', () => {
    it('successfully initializes without configuration', () => {
        expect(cvv).toBeInstanceOf(Tibidabo);
    
        expect(cvv.email).toBeDefined();
        expect(cvv.email).toMatch('');

        expect(cvv.schoolCode).toBeDefined();
        expect(cvv.schoolCode).toMatch('');
    
        expect(cvv.authorized).toBeDefined();
        expect(cvv.authorized).toBe(false);

        expect(cvv.user).toBeDefined();
        expect(cvv.user).toEqual({
            auth_string: "",
            auth_type: "",
            cognome: "",
            nome: "",
            dinsert: "",
            id: "",
            alt_cell: null,
            alt_codfis: null,
            alt_fbuid: null,
            alt_nickname: null,
            password_changed: "",
        });

        expect(cvv.account).toBeDefined();
        expect(cvv.account).toEqual({
            account_desc: "",
            account_string: "",
            dinsert: "",
            id: "",
            nome: "",
            scuola_descrizione: "",
            scuola_intitolazione: "",
            scuola_luogo: "",
            sede_codice: "",
            target: "",
            wsc_cat: "",
        });
    });
});