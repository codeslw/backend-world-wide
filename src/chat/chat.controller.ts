import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards, Request, Inject, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { ChatService, PartialAdminInfo } from './chat.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateChatStatusDto } from './dto/update-chat-status.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enum/roles.enum';
import { Role as PrismaRole } from '@prisma/client';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ChatResponseDto } from './dto/chat-response.dto';
import { MessageResponseDto } from './dto/message-response.dto';
import { ChatStatus } from '../common/enum/chat.enum';
import { ChatGateway } from './chat.gateway';
import { ModuleRef } from '@nestjs/core';

const mapToPrismaRole = (role: Role): PrismaRole => {
  switch (role) {
    case Role.ADMIN: return PrismaRole.ADMIN;
    case Role.CLIENT: return PrismaRole.CLIENT;
    case Role.PARTNER: return PrismaRole.PARTNER;
    default: throw new Error(`Unhandled role: ${role}`);
  }
};

@ApiTags('chat')
@Controller('chats')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ChatController implements OnModuleInit {
  constructor(
    @Inject('CHAT_SERVICE_PROVIDER') private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
    private moduleRef: ModuleRef
  ) {}

  onModuleInit() {
    this.chatService.setChatGateway(this.chatGateway);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new chat (client only)' })
  @ApiResponse({ status: 201, description: 'Chat created', type: ChatResponseDto })
  @Roles(Role.CLIENT)
  async createChat(@Request() req, @Body() createChatDto: CreateChatDto) {
    return this.chatService.createChat(req.user.userId, createChatDto);
  }

  @Get('my-chats')
  @ApiOperation({ summary: 'Get chats for the current user (client or admin)' })
  @ApiQuery({ name: 'status', required: false, enum: ChatStatus, description: 'Filter by chat status' })
  @ApiResponse({ status: 200, description: 'List of user chats', type: [ChatResponseDto] })
  async getMyChats(
    @Request() req,
    @Query('status') status?: ChatStatus,
  ) {
    const userRolePrisma = mapToPrismaRole(req.user.role);
    return this.chatService.getUserChats(req.user.userId, userRolePrisma, status);
  }

  @Get('admin/all')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get all chats, including unassigned (Admin only)' })
  @ApiQuery({ name: 'status', required: false, enum: ChatStatus, description: 'Filter by chat status' })
  @ApiResponse({ status: 200, description: 'List of all chats', type: [ChatResponseDto] })
  async getAllChatsForAdmin(
    @Request() req,
    @Query('status') status?: ChatStatus,
  ) {
    return this.chatService.getUserChats(req.user.userId, PrismaRole.ADMIN, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific chat by ID' })
  @ApiParam({ name: 'id', description: 'Chat ID', type: String })
  @ApiResponse({ status: 200, description: 'Chat details', type: ChatResponseDto })
  @ApiResponse({ status: 404, description: 'Chat not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getChatById(@Request() req, @Param('id') id: string) {
    const userRolePrisma = mapToPrismaRole(req.user.role);
    return this.chatService.getChatById(id, req.user.userId, userRolePrisma);
  }

  @Patch(':id/assign-self')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Assign an unassigned chat to the current admin (Admin only)' })
  @ApiParam({ name: 'id', description: 'Chat ID', type: String })
  @ApiResponse({ status: 200, description: 'Admin assigned to chat', type: ChatResponseDto })
  @ApiResponse({ status: 404, description: 'Chat not found' })
  @ApiResponse({ status: 403, description: 'Chat already assigned or forbidden' })
  async assignChatToSelf(@Request() req, @Param('id') id: string) {
    return this.chatService.assignAdminToChat(id, req.user.userId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update chat status (Admin or assigned user)' })
  @ApiParam({ name: 'id', description: 'Chat ID', type: String })
  @ApiResponse({ status: 200, description: 'Chat status updated', type: ChatResponseDto })
  @ApiResponse({ status: 404, description: 'Chat not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async updateChatStatus(
    @Request() req,
    @Param('id') id: string,
    @Body() updateChatStatusDto: UpdateChatStatusDto,
  ) {
    const userRolePrisma = mapToPrismaRole(req.user.role);
    return this.chatService.updateChatStatus(id, req.user.userId, userRolePrisma, updateChatStatusDto);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Send a message to a chat' })
  @ApiParam({ name: 'id', description: 'Chat ID', type: String })
  @ApiResponse({ status: 201, description: 'Message sent', type: MessageResponseDto })
  @ApiResponse({ status: 404, description: 'Chat not found or File not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async createMessage(
    @Request() req,
    @Param('id') id: string,
    @Body() createMessageDto: CreateMessageDto,
  ) {
    const userRolePrisma = mapToPrismaRole(req.user.role);
    return this.chatService.createMessage(req.user.userId, userRolePrisma, { ...createMessageDto, chatId: id });
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Get messages for a chat (paginated)' })
  @ApiParam({ name: 'id', description: 'Chat ID', type: String })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 20)', type: Number })
  @ApiResponse({ status: 200, description: 'List of messages with pagination meta' })
  @ApiResponse({ status: 404, description: 'Chat not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getChatMessages(
    @Request() req,
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const userRolePrisma = mapToPrismaRole(req.user.role);
    return this.chatService.getChatMessages(id, req.user.userId, userRolePrisma, pageNum, limitNum);
  }
} 