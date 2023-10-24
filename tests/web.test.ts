import Web from '../src/classes/Web';
import { ClassOptions } from '../src/types/web';

describe('Web API Client', () => {
    let client: Web;

    beforeAll(() => {
        const testOptions: ClassOptions = {};
        client = new Web(testOptions);
    });

    afterAll(() => {
        client.logout();
    });

    it('successfully initializes without configuration', () => {
        expect(client).toBeInstanceOf(Web);
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
