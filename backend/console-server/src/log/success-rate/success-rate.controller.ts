import { Controller, Get, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { SuccessRateService } from './success-rate.service';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GetSuccessRateResponseDto } from './dto/get-success-rate-response.dto';
import { GetSuccessRateDto } from './dto/get-success-rate.dto';
import { GetProjectSuccessRateResponseDto } from './dto/get-project-success-rate-response.dto';
import { GetProjectSuccessRateDto } from './dto/get-project-success-rate.dto';

@Controller('success-rate')
export class SuccessRateController {
    constructor(private readonly successRateService: SuccessRateService) {}

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
    async getSuccessRate(@Query() getSuccessRateDto: GetSuccessRateDto) {
        return await this.successRateService.getSuccessRate(getSuccessRateDto);
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
        type: GetProjectSuccessRateResponseDto,
    })
    async getProjectSuccessRate(@Query() getProjectSuccessRateDto: GetProjectSuccessRateDto) {
        return await this.successRateService.getProjectSuccessRate(getProjectSuccessRateDto);
    }
}