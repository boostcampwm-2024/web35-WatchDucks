import { Test } from '@nestjs/testing';
import { LogRepository } from './log.repository';
import { Clickhouse } from '../clickhouse/clickhouse';
import type { TestingModule } from '@nestjs/testing';

describe('LogRepository 테스트', () => {
    let repository: LogRepository;
    let clickhouse: Clickhouse;

    const mockClickhouse = {
        query: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                LogRepository,
                {
                    provide: Clickhouse,
                    useValue: mockClickhouse,
                },
            ],
        }).compile();

        repository = module.get<LogRepository>(LogRepository);
        clickhouse = module.get<Clickhouse>(Clickhouse);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('레퍼지토리가 정의될 수 있어야 한다.', () => {
        expect(repository).toBeDefined();
    });

    describe('findAvgElapsedTime()는 ', () => {
        it('TimeSeriesQueryBuilder를 사용하여 올바른 쿼리를 생성해야 한다.', async () => {
            const mockResult = [{ avg_elapsed_time: 150 }];
            mockClickhouse.query.mockResolvedValue(mockResult);

            const result = await repository.findAvgElapsedTime();

            expect(result).toEqual(mockResult[0]);
            expect(clickhouse.query).toHaveBeenCalledWith(
                expect.stringMatching(/SELECT.*avg\(elapsed_time\)/),
                expect.any(Object),
            );
        });
    });

    describe('findCountByHost()는 ', () => {
        it('호스트별 요청 수를 내림차순으로 정렬하여 반환해야 한다.', async () => {
            const mockResult = [
                { host: 'api.example.com', count: 1000 },
                { host: 'web.example.com', count: 500 },
            ];
            mockClickhouse.query.mockResolvedValue(mockResult);

            const result = await repository.findTop5CountByHost();

            expect(result).toEqual(mockResult);
            expect(clickhouse.query).toHaveBeenCalledWith(
                expect.stringMatching(/GROUP BY.*host.*ORDER BY.*DESC/),
                expect.any(Object),
            );
        });
    });

    describe('findResponseSuccessRate()는 ', () => {
        it('성공률을 올바르게 계산할 수 있어야 한다.', async () => {
            const mockQueryResult = [{ is_error_rate: 1.5 }];
            (clickhouse.query as jest.Mock).mockResolvedValue(mockQueryResult);

            const result = await repository.findResponseSuccessRate();

            expect(result).toEqual({ success_rate: 98.5 });
            expect(clickhouse.query).toHaveBeenCalledWith(
                'SELECT (sum(is_error) / count(*)) * 100 as is_error_rate\n    FROM http_log',
            );
        });

        it('에러율이 0%일 때 성공률 100%를 반환해야 한다.', async () => {
            mockClickhouse.query.mockResolvedValue([{ is_error_rate: 0 }]);

            const result = await repository.findResponseSuccessRate();

            expect(result).toEqual({ success_rate: 100 });
        });
    });

    describe('findResponseSuccessRateByProject()는 ', () => {
        const domain = 'example.com';

        it('프로젝트별 성공률을 올바르게 계산할 수 있어야 한다', async () => {
            const mockQueryResult = [{ is_error_rate: 1.5 }];
            (clickhouse.query as jest.Mock).mockResolvedValue(mockQueryResult);

            const result = await repository.findResponseSuccessRateByProject(domain);

            const expectedQuery = `SELECT (sum(is_error) / count(*)) * 100 as is_error_rate
    FROM (SELECT is_error, timestamp
    FROM http_log WHERE host = {host:String} ORDER BY timestamp DESC LIMIT 1000) as subquery`;

            expect(result).toEqual({ success_rate: 98.5 });
            expect(clickhouse.query).toHaveBeenCalledWith(
                expectedQuery,
                expect.objectContaining({ host: domain }),
            );
        });

        it('에러율이 0%일 때 성공률 100%를 반환해야 한다', async () => {
            (clickhouse.query as jest.Mock).mockResolvedValue([{ is_error_rate: 0 }]);

            const result = await repository.findResponseSuccessRateByProject(domain);

            expect(result).toEqual({ success_rate: 100 });
        });

        it('쿼리 에러 발생시 예외를 throw 해야 한다', async () => {
            const error = new Error('Clickhouse connection error');
            (clickhouse.query as jest.Mock).mockRejectedValue(error);

            await expect(repository.findResponseSuccessRateByProject(domain)).rejects.toThrow(
                'Clickhouse connection error',
            );
        });
    });

    describe('findTrafficByGeneration()는 ', () => {
        it('전체 트래픽 수를 반환해야 한다.', async () => {
            const mockResult = { count: 5000 };
            mockClickhouse.query.mockResolvedValue(mockResult);

            const result = await repository.findTrafficByGeneration();

            expect(result).toEqual(mockResult);
            expect(clickhouse.query).toHaveBeenCalledWith(
                expect.stringMatching(/SELECT.*count\(\).*as count/s),
                expect.any(Object),
            );
        });
    });

    describe('getTrafficByProject()는', () => {
        const domain = 'example.com';
        const timeUnit = 'Hour';

        const mockTrafficData = [
            { timestamp: '2024-11-18 10:00:00', count: 150 },
            { timestamp: '2024-11-18 11:00:00', count: 120 },
            { timestamp: '2024-11-18 12:00:00', count: 180 },
        ];

        it('올바른 도메인과 시간 단위를 기준으로 트래픽 데이터를 반환해야 한다.', async () => {
            mockClickhouse.query.mockResolvedValue(mockTrafficData);

            const result = await repository.findTrafficByProject(domain, timeUnit);

            expect(result).toEqual(mockTrafficData);
            expect(clickhouse.query).toHaveBeenCalledWith(
                expect.stringMatching(
                    /SELECT\s+count\(\)\s+as\s+count,\s+toStartOfHour\(timestamp\)\s+as\s+timestamp\s+FROM\s+http_log\s+WHERE\s+host\s+=\s+\{host:String}\s+GROUP\s+BY\s+timestamp\s+ORDER\s+BY\s+timestamp/s,
                ),
                expect.objectContaining({ host: domain }),
            );
        });

        it('트래픽 데이터가 없을 경우 빈 배열을 반환해야 한다.', async () => {
            mockClickhouse.query.mockResolvedValue([]);

            const result = await repository.findTrafficByProject(domain, timeUnit);

            expect(result).toEqual([]);
            expect(clickhouse.query).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({ host: domain }),
            );
        });

        it('Clickhouse 호출 중 에러가 발생하면 예외를 throw 해야 한다.', async () => {
            const error = new Error('Clickhouse query failed');
            mockClickhouse.query.mockRejectedValue(error);

            await expect(repository.findTrafficByProject(domain, timeUnit)).rejects.toThrow(
                'Clickhouse query failed',
            );

            expect(clickhouse.query).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({ host: domain }),
            );
        });
    });

    describe('findTrafficForTimeRange()는 ', () => {
        const mockDate = new Date('2024-03-20T15:00:00Z');

        beforeEach(() => {
            jest.useFakeTimers();
            jest.setSystemTime(mockDate);
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it('특정 기간의 트래픽을 리턴할 수 있어야 한다.', async () => {
            const mockTraffic = [{ count: 500 }];
            const timeRange = {
                start: new Date('2024-01-02T00:00:00Z'),
                end: new Date('2024-01-02T23:59:59Z'),
            };

            mockClickhouse.query.mockResolvedValue(mockTraffic);

            const result = await repository.findTrafficForTimeRange(timeRange.start, timeRange.end);

            expect(result).toEqual(mockTraffic);
            expect(clickhouse.query).toHaveBeenCalledWith(expect.any(String), expect.any(Object));
        });
    });

    describe('getDAUByProject()', () => {
        const domain = 'example.com';
        const date = '2024-11-18';

        it('존재하는 도메인과 날짜가 들어오면 존재하는 DAU 값을 반환해야 한다.', async () => {
            const mockResult = [{ dau: 150 }];
            mockClickhouse.query.mockResolvedValue(mockResult);

            const result = await repository.findDAUByProject(domain, date);

            expect(result).toBe(150);
            expect(clickhouse.query).toHaveBeenCalledWith(
                expect.stringMatching(
                    /SELECT.*SUM\(access\).*as dau.*FROM dau.*WHERE.*domain = \{domain:String}.*AND.*date = \{date:String}/s,
                ),
                expect.objectContaining({ domain, date }),
            );
        });

        it('DAU 데이터가 없을 경우 0을 반환해야 한다.', async () => {
            mockClickhouse.query.mockResolvedValue([]);

            const result = await repository.findDAUByProject(domain, date);

            expect(result).toBe(0);
            expect(clickhouse.query).toHaveBeenCalledWith(
                expect.stringMatching(
                    /SELECT.*SUM\(access\).*as dau.*FROM dau.*WHERE.*domain = \{domain:String}.*AND.*date = \{date:String}/s,
                ),
                expect.objectContaining({ domain, date }),
            );
        });

        it('DAU 값이 null일 경우 0을 반환해야 한다.', async () => {
            const mockResult = [{ dau: null }];
            mockClickhouse.query.mockResolvedValue(mockResult);

            const result = await repository.findDAUByProject(domain, date);

            expect(result).toBe(0);
            expect(clickhouse.query).toHaveBeenCalledWith(
                expect.stringMatching(
                    /SELECT.*SUM\(access\).*as dau.*FROM dau.*WHERE.*domain = \{domain:String}.*AND.*date = \{date:String}/s,
                ),
                expect.objectContaining({ domain, date }),
            );
        });

        it('Clickhouse 호출 중 에러가 발생하면 예외를 throw 해야 한다.', async () => {
            const error = new Error('Clickhouse query failed');
            mockClickhouse.query.mockRejectedValue(error);

            await expect(repository.findDAUByProject(domain, date)).rejects.toThrow(
                'Clickhouse query failed',
            );

            expect(clickhouse.query).toHaveBeenCalledWith(
                expect.stringMatching(
                    /SELECT.*SUM\(access\).*as dau.*FROM dau.*WHERE.*domain = \{domain:String}.*AND.*date = \{date:String}/s,
                ),
                expect.objectContaining({ domain, date }),
            );
        });
    });
});
