import Tibidabo from '../src/classes/Tibidabo';
import { ClassOptions } from '../src/types/tibidabo';

describe('Tibidabo API Client', () => {
    let client: Tibidabo;

    beforeAll(() => {
        const testOptions: ClassOptions = {};
        client = new Tibidabo(testOptions);
    });

    afterAll(() => {
        client.logout();
    });

    it('successfully initializes without configuration', () => {
        expect(client).toBeInstanceOf(Tibidabo);
    });

    it('should have certain methods', () => {
        const methods = client.getMethods();

        expect(methods).toBeInstanceOf(Array);
        expect(methods).toContain('login');
        expect(methods).toContain('logout');
        expect(methods).toContain('setSessionId');
    });

    it('should log out successfully', () => {
        const loggedOut = client.logout();
        expect(loggedOut).toBe(true);
        expect(client.authorized).toBe(false);
    });
});
