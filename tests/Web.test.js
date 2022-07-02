const { Web } = require('../dist/index.js');
let cvv;

beforeEach(() =>{
    cvv = new Web();
});

describe('Classeviva WEB class creation', () => {
    it('successfully initializes without configuration', () => {
        expect(cvv).toBeInstanceOf(Web);
    
        expect(cvv.authorized).toBeDefined();
        expect(cvv.authorized).toBe(false);

        expect(cvv.user).toBeDefined();
        expect(cvv.user).toEqual({
            cid: "",
            cognome: "",
            nome: "",
            id: 0,
            type: "",
        });
    });
});