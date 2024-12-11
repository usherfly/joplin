import { ChatEntity } from '../services/database/types';
import BaseModel from '../BaseModel';
import { reg } from '../registry';
import Database from '../database';
import uuid from '../uuid';

// 聊天消息模型
// 处理聊天消息的数据库操作
export default class Chat extends BaseModel {
	// 获取数据库表名
	public static tableName(): string {
		return 'chats';
	}

	// 获取模型类型
	public static modelType(): number {
		return BaseModel.TYPE_CHAT;
	}

	// 查询所有未删除的聊天记录
	// @returns 按创建时间升序排序的聊天记录列表
	public static async queryChatAll(): Promise<ChatEntity[]> {
		try {
			const sql = 'SELECT * FROM chats WHERE deleted_time = 0 OR deleted_time IS NULL ORDER BY created_time ASC';
			const chats = await this.db().selectAll(sql);
			reg.logger().info('Chat.queryChatAll: 成功加载聊天记录', { count: chats.length });
			return chats;
		} catch (error) {
			reg.logger().error('Chat.queryChatAll: 加载聊天记录失败', error);
			throw error;
		}
	}

	// 保存新的聊天消息
	// @param chat - 要保存的聊天消息
	// @returns 保存后的聊天消息实体
	public static async save(chat: Partial<ChatEntity>): Promise<ChatEntity> {
		try {
			const now = Date.now();
			const finalChat = {
				...chat,
				id: uuid.create(),
				created_time: chat.created_time || now,
				updated_time: now,
				deleted_time: chat.deleted_time || 0,
				markup_language: chat.markup_language || 1,
			} as ChatEntity;

			const query = Database.insertQuery(this.tableName(), finalChat);
			await this.db().exec(query.sql, query.params);

			const savedChat = await this.db().selectOne('SELECT * FROM chats WHERE id = ?', [finalChat.id]);
			if (savedChat) {
				reg.logger().info('Chat.save: 消息保存成功', { id: savedChat.id });
				return savedChat;
			} else {
				throw new Error(`消息保存失败: 无法找到ID为 ${finalChat.id} 的消息`);
			}
		} catch (error) {
			reg.logger().error('Chat.save: 保存消息失败', error);
			throw error;
		}
	}
}
