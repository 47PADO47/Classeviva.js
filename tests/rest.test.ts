import Rest from '../src/classes/Rest';
import { ClassOptions } from '../src/types/rest';

describe('Rest API Client', () => {
    let client: Rest;

    beforeAll(() => {
        const testOptions: ClassOptions = {
            keepAlive: false,
            saveTempFile: false,
        };
        client = new Rest(testOptions);
    });

    afterAll(() => {
        client.logout();
    });

    it('successfully initializes without configuration', () => {
        expect(client).toBeInstanceOf(Rest);
    });

    it('should have certain methods', () => {
        const methods = client.getMethods();

        expect(methods).toBeInstanceOf(Array);
        expect(methods).toContain('login');
        expect(methods).toContain('logout');
        expect(methods).toContain('setState');
    });

    it('should log out successfully', () => {
        const loggedOut = client.logout();
        expect(loggedOut).toBe(true);
        expect(client.authorized).toBe(false);
    });
});
