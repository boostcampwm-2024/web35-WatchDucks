import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class TrafficCountByTimeunit {
    @ApiProperty({
        example: '2024-11-07 23:07:28',
        description: '시간 단위 별 타임스탬프',
    })
    @Expose()
    timestamp: string;

    @ApiProperty({
        example: 1500,
        description: '해당 타임스탬프의 트래픽 총량',
    })
    @Expose()
    @Type(() => Number)
    count: number;
}

export class GetTrafficByProjectResponseDto {
    @ApiProperty({
        example: 'watchducks',
        description: '프로젝트 이름',
    })
    @Expose()
    projectName: string;

    @ApiProperty({
        example: 'hour',
        description: '시간 단위',
    })
    @Expose()
    timeUnit: string;

    @ApiProperty({
        type: [TrafficCountByTimeunit],
        description: '시간 단위 별 트래픽 데이터',
    })
    @Expose()
    @Type(() => TrafficCountByTimeunit)
    trafficData: TrafficCountByTimeunit[];
}