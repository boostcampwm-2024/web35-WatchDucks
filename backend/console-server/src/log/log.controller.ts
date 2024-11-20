import { Controller, Get, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { LogService } from './log.service';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GetPathSpeedRankDto } from './dto/get-path-speed-rank.dto';
import { GetPathSpeedRankResponseDto } from './dto/get-path-speed-rank-response.dto';
import { GetTrafficByProjectResponseDto } from './dto/get-traffic-by-project-response.dto';
import { GetTrafficByProjectDto } from './dto/get-traffic-by-project.dto';
import { GetDAUByProjectResponseDto } from './dto/get-dau-by-project-response.dto';
import { GetDAUByProjectDto } from './dto/get-dau-by-project.dto';
import { GetSuccessRateResponseDto } from './dto/get-success-rate-response.dto';
import { GetSuccessRateDto } from './dto/get-success-rate.dto';
import { GetTrafficByGenerationDto } from './dto/get-traffic-by-generation.dto';
import { GetSuccessRateByProjectDto } from './dto/get-success-rate-by-project.dto';
import { GetAvgElapsedTimeResponseDto } from './dto/get-avg-elapsed-time-response.dto';
import { GetTrafficRankResponseDto } from './dto/get-traffic-rank-response.dto';
import { GetTrafficByGenerationResponseDto } from './dto/get-traffic-by-generation-response.dto';
import { GetSuccessRateByProjectResponseDto } from './dto/get-success-rate-by-project-response.dto';
import { GetTrafficDailyDifferenceResponseDto } from './dto/get-traffic-daily-difference-response.dto';
import { GetTrafficDailyDifferenceDto } from './dto/get-traffic-daily-difference.dto';

@Controller('log')
export class LogController {
    constructor(private readonly logService: LogService) {}

    @Get('/elapsed-time')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: '기수 총 트래픽 평균 응답시간 API',
        description: '요청받은 기수의 트래픽에 대한 평균 응답시간을 반환합니다.',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: '평균 응답시간이 성공적으로 반환됨.',
        type: GetAvgElapsedTimeResponseDto,
    })
    async elapsedTime() {
        return await this.logService.getAvgElapsedTime();
    }

    @Get('/traffic/rank')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: '기수 내 트래픽 랭킹 TOP 5',
        description: '요청받은 기수의 트래픽 랭킹 TOP 5를 반환합니다.',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: '트래픽 랭킹 TOP 5가 정상적으로 반환됨.',
        type: GetTrafficRankResponseDto,
    })
    async trafficRank() {
        return await this.logService.getTrafficRank();
    }

    @Get('/success-rate')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: '기수 내 응답 성공률',
        description: '요청받은 기수의 기수 내 응답 성공률를 반환합니다.',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: '기수 내 응답 성공률이 성공적으로 반환됨.',
        type: GetSuccessRateResponseDto,
    })
    async getResponseSuccessRate(getSuccessRateDto: GetSuccessRateDto) {
        return await this.logService.getResponseSuccessRate(getSuccessRateDto);
    }

    @Get('/success-rate/project')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: '프로젝트 별 응답 성공률',
        description: '요청받은 프로젝트의 응답 성공률을 반환합니다.',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: '프로젝트 별 응답 성공률이 성공적으로 반환됨.',
        type: GetSuccessRateByProjectResponseDto,
    })
    async getResponseSuccessRateByProject(
        @Query() getSuccessRateByProjectDto: GetSuccessRateByProjectDto,
    ) {
        return await this.logService.getResponseSuccessRateByProject(getSuccessRateByProjectDto);
    }

    @Get('/traffic/project')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: '프로젝트 별 트래픽 조회',
        description: '프로젝트 이름과 시간 단위로 특정 프로젝트의 트래픽 데이터를 반환합니다.',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: '특정 프로젝트의 트래픽 데이터가 반환됨.',
        type: GetTrafficByProjectResponseDto,
    })
    async getTrafficByProject(@Query() getTrafficByProjectDto: GetTrafficByProjectDto) {
        return await this.logService.getTrafficByProject(getTrafficByProjectDto);
    }

    @Get('/traffic')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: '기수 내 총 트래픽',
        description: ' 요청받은 기수의 기수 내 총 트래픽를 반환합니다.',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: '기수 내 총 트래픽이 정상적으로 반환됨.',
        type: GetTrafficByGenerationResponseDto,
    })
    async getTrafficByGeneration(@Query() getTrafficByGenerationDto: GetTrafficByGenerationDto) {
        return await this.logService.getTrafficByGeneration(getTrafficByGenerationDto);
    }

    @Get('/traffic/daily-difference')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: '기수 별 프로젝트 전일 대비 트래픽',
        description: '요청받은 기수의 프로젝트 전일 대비 트래픽을 반환합니다.',
    })
    @ApiResponse({
        status: 200,
        description: '기수별 프로젝트 전일 대비 트래픽이 정상적으로 반환됨',
        type: GetTrafficDailyDifferenceResponseDto,
    })
    async getTrafficDailyDifferenceByGeneration(
        getTrafficDailyDifferenceDto: GetTrafficDailyDifferenceDto,
    ) {
        return await this.logService.getTrafficDailyDifferenceByGeneration(
            getTrafficDailyDifferenceDto,
        );
    }

    @Get('/elapsed-time/path-rank')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: '개별 프로젝트의 경로별 응답 속도 순위',
        description: '개별 프로젝트의 경로별 응답 속도 중 가장 빠른/느린 3개를 반환합니다.',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: '개별 프로젝트의 경로별 응답 속도 중 가장 빠른/느린 3개가 반환됨.',
        type: GetPathSpeedRankResponseDto,
    })
    async getPathSpeedRankByProject(@Query() getPathSpeedRankDto: GetPathSpeedRankDto) {
        return await this.logService.getPathSpeedRankByProject(getPathSpeedRankDto);
    }

    @Get('/dau')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: '프로젝트별 DAU 조회',
        description: '프로젝트 이름과 날짜로 해당 프로젝트의 DAU를 반환합니다.',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: '프로젝트의 DAU가 정상적으로 반환됨.',
        type: GetDAUByProjectResponseDto,
    })
    async getDAUByProject(@Query() getDAUByProjectDto: GetDAUByProjectDto) {
        return await this.logService.getDAUByProject(getDAUByProjectDto);
    }
}
