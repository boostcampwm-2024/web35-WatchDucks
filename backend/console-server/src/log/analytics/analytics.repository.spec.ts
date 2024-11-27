import { Clickhouse } from '../../clickhouse/clickhouse';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { AnalyticsRepository } from './analytics.repository';
import type { DauMetric } from './metric/dau.metric';

describe('AnalyticsRepository 테스트', () => {
    let repository: AnalyticsRepository;
    let clickhouse: Clickhouse;

    const mockClickhouse = {
        query: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AnalyticsRepository,
                {
                    provide: Clickhouse,
                    useValue: mockClickhouse,
                },
            ],
        }).compile();

        repository = module.get<AnalyticsRepository>(AnalyticsRepository);
        clickhouse = module.get<Clickhouse>(Clickhouse);

        jest.useFakeTimers();
        jest.setSystemTime(new Date('2024-11-26T00:00:00.000Z'));
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('레퍼지토리가 정의될 수 있어야 한다.', () => {
        expect(repository).toBeDefined();
    });

    describe('findDAUsByProject()', () => {
        const domain = 'example.com';
        const start = new Date('2024-11-01');
        const end = new Date('2024-11-30');

        it('존재하는 도메인과 기간이 들어오면 해당 기간의 DAU 데이터를 반환해야 한다.', async () => {
            const mockResult: DauMetric[] = [
                { date: new Date('2024-11-01'), dau: 100 },
                { date: new Date('2024-11-05'), dau: 150 },
                { date: new Date('2024-11-10'), dau: 200 },
            ];
            mockClickhouse.query.mockResolvedValue(mockResult);

            const result = await repository.findDAUsByProject(domain, start, end);

            expect(result).toEqual(mockResult);
            expect(clickhouse.query).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({ domain, startTime: start, endTime: end }),
            );
        });

        it('DAU 데이터가 없을 경우 빈 배열을 반환해야 한다.', async () => {
            mockClickhouse.query.mockResolvedValue([]);

            const result = await repository.findDAUsByProject(domain, start, end);

            expect(result).toEqual([]);
            expect(clickhouse.query).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({ domain, startTime: start, endTime: end }),
            );
        });

        it('Clickhouse 호출 중 에러가 발생하면 예외를 throw 해야 한다.', async () => {
            const error = new Error('Clickhouse query failed');
            mockClickhouse.query.mockRejectedValue(error);

            await expect(repository.findDAUsByProject(domain, start, end)).rejects.toThrow(
                'Clickhouse query failed',
            );

            expect(clickhouse.query).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({ domain, startTime: start, endTime: end }),
            );
        });
    });
});
