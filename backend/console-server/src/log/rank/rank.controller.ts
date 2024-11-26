import { RankService } from './rank.service';
import { Controller, Get, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { GetSuccessRateRankResponseDto } from './dto/get-success-rate-rank-response.dto';
import { GetSuccessRateRankDto } from './dto/get-success-rate-rank.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GetDAURankDto } from './dto/get-dau-rank.dto';
import { GetDAURankResponseDto } from './dto/get-dau-rank-response.dto';

@Controller('log/rank')
export class RankController {
    constructor(private readonly rankService: RankService) {}

    @Get('/success-rate')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: '기수 내 응답 성공률 랭킹',
        description: '요청받은 기수의 기수 내 응답 성공률 랭킹을 반환합니다.',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: '기수 내 응답 성공률 랭킹이 성공적으로 반환됨.',
        type: GetSuccessRateRankResponseDto,
    })
    async getSuccessRateRank(@Query() getSuccessRateRankDto: GetSuccessRateRankDto) {
        return await this.rankService.getSuccessRateRank(getSuccessRateRankDto);
    }

    @Get('/dau')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: '기수 내 DAU 랭킹',
        description: '요청받은 기수의 기수 내 DAU 랭킹을 반환합니다.',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: '기수 내 DAU 랭킹이 송공적으로 반환됨.',
        type: GetDAURankResponseDto,
    })
    async getDAURank(@Query() getDAURankDto: GetDAURankDto) {
        return await this.rankService.getDAURank(getDAURankDto);
    }
}