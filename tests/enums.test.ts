import * as Enums from '../src/base/enums'

describe('Enums', () => {
    it('should have the correct values and types for States', () => {
        // Test the values of States
        expect(Enums.States.Italy).toBe('IT');
        expect(Enums.States.SanMarino).toBe('SM');
        expect(Enums.States.Argentina).toBe('AR');

        // Test the type of State
        const italianState: Enums.State = 'IT';
        expect(italianState).toBe(Enums.States.Italy);
    });

    it('should have the correct values for StateUrls', () => {
        expect(Enums.StateUrls.IT).toBe('web.spaggiari.eu');
        expect(Enums.StateUrls.SM).toBe('web.spaggiari.sm');
        expect(Enums.StateUrls.AR).toBe('ar.spaggiari.eu');
    });

    it('should have the correct values and types for UserTypes', () => {
        // Test the values of UserTypes
        expect(Enums.UserTypes.S).toBe('studente');
        expect(Enums.UserTypes.G).toBe('genitore');
        expect(Enums.UserTypes.A).toBe('insegnante');
        //expect(Enums.UserTypes.X).toBe('unknonw');

        // Test the type of userTypesKeys
        const studentTypeKey: Enums.userTypesKeys = 'S';

        // Test the type of userType
        const studentType: Enums.userType = 'studente';

        expect(Enums.UserTypes[studentTypeKey]).toBe(studentType);
    });
});
