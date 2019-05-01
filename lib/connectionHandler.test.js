const connection = require('./connectionHandler');

describe('connectionHandler', () => {
    describe('.openRequests', async () => {
        test('expects to return a number', () => {
            const isNumber = (typeof connection.openRequests === 'number');
            expect(isNumber).toBeTruthy();
        });
    });

    describe('.open()', async () => {
        test('expects to increment `connection.openRequests`', () => {
            const prevVal = connection.openRequests;
            connection.open();
            expect(prevVal).toBeLessThan(connection.openRequests);
        });
    });

    describe('.close()', async () => {
        beforeEach(() => {
            connection.openRequests = 2;
        });

        test('expects to decrement `connection.openRequests`', () => {
            const prevVal = connection.openRequests;
            connection.close();
            expect(prevVal).toBeGreaterThan(connection.openRequests);
        });

        test('expects NOT to invoke `process.exit()` if `connection.openRequests` is not less than 1', () => {
            const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
            connection.close();
            expect(mockExit).not.toHaveBeenCalled();
            mockExit.mockRestore();
        });

        test('expects to invoke `process.exit()` if `connection.openRequests` is less than 1', () => {
            const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
            connection.close();
            connection.close();
            expect(mockExit).toHaveBeenCalled();
            mockExit.mockRestore();
        });
    });
});