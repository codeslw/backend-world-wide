import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards, Request, Inject, OnModuleInit } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateChatStatusDto } from './dto/update-chat-status.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enum/roles.enum';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ChatResponseDto } from './dto/chat-response.dto';
import { MessageResponseDto } from './dto/message-response.dto';
import { ChatStatus } from '../common/enum/chat.enum';
import { ChatGateway } from './chat.gateway';
import { ModuleRef } from '@nestjs/core';

@ApiTags('chat')
@Controller('chat')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ChatController implements OnModuleInit {
  constructor(
    @Inject('CHAT_SERVICE_PROVIDER') private readonly chatService: any,
    private readonly chatGateway: ChatGateway,
    private moduleRef: ModuleRef
  ) {}

  onModuleInit() {
    // Set the gateway in the service to avoid circular dependency
    this.chatService.setChatGateway(this.chatGateway);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new chat' })
  @ApiResponse({ status: 201, description: 'Chat created', type: ChatResponseDto })
  async createChat(@Request() req, @Body() createChatDto: CreateChatDto) {
    return this.chatService.createChat(req.user.userId, createChatDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all chats for the current user' })
  @ApiQuery({ name: 'status', required: false, enum: ChatStatus, description: 'Filter by chat status' })
  @ApiResponse({ status: 200, description: 'List of chats', type: [ChatResponseDto] })
  async getUserChats(
    @Request() req,
    @Query('status') status?: ChatStatus,
  ) {
    return this.chatService.getUserChats(req.user.userId, req.user.role, status);
  }

  @Get('admin')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get all chats (Admin only)' })
  @ApiQuery({ name: 'status', required: false, enum: ChatStatus, description: 'Filter by chat status' })
  @ApiResponse({ status: 200, description: 'List of chats', type: [ChatResponseDto] })
  async getAllChats(
    @Request() req,
    @Query('status') status?: ChatStatus,
  ) {
    return this.chatService.getUserChats(req.user.userId, Role.ADMIN, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a chat by ID' })
  @ApiParam({ name: 'id', description: 'Chat ID' })
  @ApiResponse({ status: 200, description: 'Chat details', type: ChatResponseDto })
  @ApiResponse({ status: 404, description: 'Chat not found' })
  async getChatById(@Request() req, @Param('id') id: string) {
    return this.chatService.getChatById(id, req.user.userId, req.user.role);
  }

  @Patch(':id/assign')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Assign an admin to a chat (Admin only)' })
  @ApiParam({ name: 'id', description: 'Chat ID' })
  @ApiResponse({ status: 200, description: 'Admin assigned to chat', type: ChatResponseDto })
  @ApiResponse({ status: 404, description: 'Chat not found' })
  async assignAdminToChat(@Request() req, @Param('id') id: string) {
    return this.chatService.assignAdminToChat(id, req.user.userId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update chat status' })
  @ApiParam({ name: 'id', description: 'Chat ID' })
  @ApiResponse({ status: 200, description: 'Chat status updated', type: ChatResponseDto })
  @ApiResponse({ status: 404, description: 'Chat not found' })
  async updateChatStatus(
    @Request() req,
    @Param('id') id: string,
    @Body() updateChatStatusDto: UpdateChatStatusDto,
  ) {
    return this.chatService.updateChatStatus(id, req.user.userId, req.user.role, updateChatStatusDto);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Send a message to a chat' })
  @ApiParam({ name: 'id', description: 'Chat ID' })
  @ApiResponse({ status: 201, description: 'Message sent', type: MessageResponseDto })
  @ApiResponse({ status: 404, description: 'Chat not found' })
  async createMessage(
    @Request() req,
    @Param('id') id: string,
    @Body() createMessageDto: CreateMessageDto,
  ) {
    return this.chatService.createMessage(req.user.userId, id, createMessageDto);
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Get messages for a chat' })
  @ApiParam({ name: 'id', description: 'Chat ID' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiResponse({ status: 200, description: 'List of messages', type: [MessageResponseDto] })
  @ApiResponse({ status: 404, description: 'Chat not found' })
  async getChatMessages(
    @Request() req,
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 20;
    return this.chatService.getChatMessages(id, req.user.userId, req.user.role, pageNum, limitNum);
  }
} 