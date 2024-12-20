import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNumber, IsString } from 'class-validator';

export class ElapsedTimeRank {
    @IsString()
    @Expose()
    projectName: string;

    @IsNumber()
    @Expose()
    value: number;
}

export class GetElapsedTimeRankResponseDto {
    @ApiProperty({
        description: '총 갯수',
        example: 30,
    })
    @IsNumber()
    total: number;

    @ApiProperty({
        description: '응답 소요 시간 짧은 순으로 정렬된 프로젝트명과 시간(ms)',
        example: [
            {
                projectName: 'test059',
                value: 100,
            },
            {
                projectName: 'test007',
                value: 110,
            },
            {
                projectName: 'test079',
                value: 120,
            },
        ],
    })
    @Expose()
    rank: ElapsedTimeRank[];
}
