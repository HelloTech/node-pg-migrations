let connection;
describe('Requiring connectionHandler', () => {
    test('expects to add `SIGINT` and `SIGTERM` handler to global process object', () => {
        expect(process._events.SIGINT).toBeUndefined();
        expect(process._events.SIGTERM).toBeUndefined();
        connection = require('./connectionHandler');
        expect(process._events.SIGINT).not.toBeUndefined();
        expect(process._events.SIGTERM).not.toBeUndefined();
    });

    describe('connection', () => {
        beforeEach(()=>{
            jest.resetModules();
            connection = require('./connectionHandler');
        });

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

            test('expects to attempt to invoke `process.exit()` if `connection.openRequests` becomes less than 1', () => {
                const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
                connection.close();
                expect(mockExit).not.toHaveBeenCalled();
                connection.close();
                expect(mockExit).toHaveBeenCalled();
                mockExit.mockRestore();
            });
        });
    });
});