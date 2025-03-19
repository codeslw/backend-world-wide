import { Module, forwardRef } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { PrismaService } from '../db/prisma.service';
import { FilesModule } from '../files/files.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WebSocketDocsController } from './websocket-docs.controller';

@Module({
  imports: [
    FilesModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [ChatController, WebSocketDocsController],
  providers: [
    {
      provide: 'CHAT_SERVICE_PROVIDER',
      useClass: ChatService,
    },
    ChatGateway,
    PrismaService,
    WebSocketDocsController
  ],
  exports: ['CHAT_SERVICE_PROVIDER', ChatGateway]
})
export class ChatModule {} 