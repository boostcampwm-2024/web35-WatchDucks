import { FastifyLogger } from '../../src/common/logger/fastify.logger';
import type { FastifyInstance } from 'fastify';
import type { RequestLog, ResponseLog, ErrorLog } from '../../src/domain/log/log.interface';

describe('fastify.logger 테스트', () => {
    let mockServer: FastifyInstance;
    let logger: FastifyLogger;

    beforeEach(() => {
        mockServer = {
            log: {
                info: jest.fn(),
                error: jest.fn(),
            },
        } as unknown as FastifyInstance;

        logger = new FastifyLogger(mockServer);
    });

    describe('logger.info()는 ', () => {
        it('요청 로그를 올바르게 수집해야 한다.', () => {
            const requestLog: RequestLog = {
                method: 'GET',
                host: 'api.example.com',
                path: '/api/v1/users',
            };

            logger.info(requestLog);

            expect(mockServer.log.info).toHaveBeenCalledWith(requestLog);
        });

        it('응답 로그를 올바르게 수집해야 한다.', () => {
            const responseLog: ResponseLog = {
                method: 'POST',
                host: 'api.example.com',
                path: '/api/v1/users',
                statusCode: 201,
                responseTime: 123,
            };

            logger.info(responseLog);

            expect(mockServer.log.info).toHaveBeenCalledWith(responseLog);
        });
    });

    describe('logger.error()는 ', () => {
        it('에러 로그를 올바르게 수집해야 한다.', () => {
            const errorLog: ErrorLog = {
                method: 'GET',
                host: 'api.example.com',
                path: '/api/v1/users',
                request: {
                    method: 'GET',
                    host: 'api.example.com',
                    path: '/api/v1/users',
                    headers: {
                        'user-agent': 'test-client/1.0',
                        'content-type': 'application/json',
                        'x-forwarded-for': '10.0.0.1',
                    },
                },
                error: {
                    message: 'Connection refused',
                    name: 'ConnectionError',
                    stack: 'Error: Connection refused\n    at Object.<anonymous>',
                    originalError: new Error('ECONNREFUSED'),
                },
            };

            logger.error(errorLog);

            expect(mockServer.log.error).toHaveBeenCalledWith(errorLog);
        });
    });
});