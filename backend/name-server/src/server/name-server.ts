import type { Socket } from 'dgram';
import { createSocket, type RemoteInfo } from 'dgram';
import type { Logger } from '../utils/logger/logger';
import type { DecodedPacket, Question } from 'dns-packet';
import { decode, encode } from 'dns-packet';
import type { ServerConfig } from '../utils/validator/configuration.validator';
import { PacketValidator } from '../utils/validator/packet.validator';
import { DNSResponseBuilder } from './utils/dns-response-builder';
import { db } from '../mysql/mysql-database';

export enum DNSFlags {
    AUTHORITATIVE_ANSWER = 0x0400, // 권한 있는 응답 (네임서버가 해당 도메인의 공식 서버일 때)
    TRUNCATED_RESPONSE = 0x0200, // 응답이 잘린 경우 (UDP 크기 제한 초과)
    RECURSION_DESIRED = 0x0100, // 재귀적 쿼리 요청 (클라이언트가 설정)
    RECURSION_AVAILABLE = 0x0080, // 재귀 쿼리 지원 여부
    AUTHENTIC_DATA = 0x0020, // DNSSEC 검증된 데이터
    CHECKING_DISABLED = 0x0010, // DNSSEC 검증 비활성화
}

export class NameServer {
    private server: Socket;
    private logger: Logger;

    constructor(
        private readonly config: ServerConfig,
        logger: Logger,
    ) {
        this.server = createSocket('udp4');
        this.logger = logger;
        this.initializeServer();
    }

    private initializeServer(): void {
        this.server.on('message', this.handleMessage.bind(this));
        this.server.on('error', this.handleError.bind(this));
        this.server.on('listening', this.handleListening.bind(this));
    }

    private async handleMessage(msg: Buffer, remoteInfo: RemoteInfo): Promise<void> {
        try {
            const query = decode(msg);
            const question = this.parseQuery(query);

            await this.validateRequest(question.name);
            await this.logger.logQuery(question.name, remoteInfo);

            const response = new DNSResponseBuilder(query, this.config).addAnswer(question).build();
            const responseMsg = encode(response);

            await this.sendResponse(responseMsg, remoteInfo);
        } catch (error) {
            await this.handleQueryError(error as Error, remoteInfo);
        }
    }

    private async validateRequest(name: string): Promise<void> {
        const sql = `SELECT EXISTS(SELECT 1
                                   FROM project
                                   WHERE name = ?) as exists_flag`;

        const result = await db.query(sql, [name.toLowerCase()]);
        console.log(result);
    }

    private parseQuery(query: DecodedPacket): Question {
        if (!PacketValidator.validatePacket(query)) {
            throw new Error('Invalid DNS query packet structure');
        }
        if (!PacketValidator.hasQuestions(query)) {
            throw new Error('DNS query packet has no question');
        }

        return query.questions[0];
    }

    private async sendResponse(msg: Buffer, remoteInfo: RemoteInfo): Promise<void> {
        return new Promise((resolve, reject) => {
            this.server.send(msg, remoteInfo.port, remoteInfo.address, (error) => {
                if (error) {
                    this.logger.error('Failed to send DNS response', error);
                    reject(error);
                } else {
                    resolve();
                }
            });
        });
    }

    private async handleQueryError(error: Error, remoteInfo: RemoteInfo): Promise<void> {
        const errorMessage = `Failed to process DNS query from ${remoteInfo.address}:${remoteInfo.port}`;

        await this.logger.error(errorMessage, error);
    }

    private handleError(error: Error): void {
        this.logger.error('Server error', error);
        this.stop();
    }

    private handleListening(): void {
        const address = this.server.address();
        this.logger.info(`Server listening on ${address.address}:${address.port}`);
    }

    public start(): void {
        this.server.bind(this.config.nameServerPort);
    }

    public stop(): void {
        this.server.close();
    }
}
