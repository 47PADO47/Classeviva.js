const { Classeviva } = require('../dist/index.js');
let cvv;

beforeEach(() =>{
    cvv = new Classeviva();
});

describe('Classeviva class creation', () => {
    it('successfully initializes without configuration', () => {
        expect(cvv).toBeInstanceOf(Classeviva);
    
        expect(cvv.username).toBeDefined();
        expect(cvv.username).toMatch('');

        expect(cvv.login_timeout).toBeUndefined();

        expect(cvv.expiration).toBeDefined();
        expect(cvv.expiration).toMatch('');
    
        expect(cvv.authorized).toBeDefined();
        expect(cvv.authorized).toBe(false);

        expect(cvv.user).toBeDefined();
        expect(cvv.user).toEqual({
            name: undefined,
            surname: undefined,
            id: undefined,
            ident: undefined,
            type: undefined,
            school: {}
        });
    });
});