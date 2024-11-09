import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fastify from 'fastify';
import replyFrom from '@fastify/reply-from';
import type { ProxyConfig } from '../config';
import { projectQuery } from './database/query/project.query';

export class ProxyServerFastify {
    private readonly server: FastifyInstance;

    constructor(private readonly config: ProxyConfig) {
        this.server = fastify({
            logger: false,
            bodyLimit: 10485760, // 10MB
        });
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        this.server.register(replyFrom, {
            undici: {
                connections: 128,
                pipelining: 1,
                keepAliveTimeout: 60 * 1000,
            },
        });

        this.server.all('*', async (request, reply) => {
            const host = request.headers['host'];

            if (!host) {
                reply.status(400).send({ error: '요청에 Host 헤더가 없습니다.' });
                return;
            }
            const ip = await projectQuery.findIpByDomain(host);

            const requestPath = request.url || '/';
            const targetUrl = `http://${ip}${requestPath}`;

            console.log('url target : ', targetUrl);

            return reply.from(targetUrl, {
                onError: (reply, error) => {
                    console.error('프록시 요청 중 에러 발생:', error);
                    reply.status(500).send('요청 중 에러가 발생했습니다.');
                },
            });
        });
    }

    public async start(): Promise<void> {
        try {
            await this.server.listen({ port: this.config.port, host: '0.0.0.0' });
            console.log(`Proxy server is running on port ${this.config.port}`);
        } catch (err) {
            console.error('Failed to start proxy server:', err);
            process.exit(1);
        }
    }
}