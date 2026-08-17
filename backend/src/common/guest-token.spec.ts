import { createGuestAccessToken, guestAccessTokenMatches, hashGuestAccessToken } from './guest-token';

describe('guest access token', () => {
    it('matches the hash of the issued token', () => {
        const { token, hash } = createGuestAccessToken();
        expect(hash).toBe(hashGuestAccessToken(token));
        expect(guestAccessTokenMatches(token, hash)).toBe(true);
    });

    it('rejects a different token', () => {
        const { hash } = createGuestAccessToken();
        const other = createGuestAccessToken();
        expect(guestAccessTokenMatches(other.token, hash)).toBe(false);
        expect(guestAccessTokenMatches(undefined, hash)).toBe(false);
        expect(guestAccessTokenMatches('abc', hash)).toBe(false);
    });
});
