import { useEffect, useCallback } from 'react';
import { ChatEntity } from '@joplin/lib/services/database/types';
import Chat from '@joplin/lib/models/Chat';
import { reg } from '@joplin/lib/registry';
import { Dispatch } from 'redux';

export interface HookDependencies {
	dispatch: Dispatch;
}

export default function useFormChat(dependencies: HookDependencies) {
	const { dispatch } = dependencies;

	// 加载聊天记录
	const loadChats = useCallback(async () => {
		try {
			dispatch({ type: 'CHAT_SET_LOADING', payload: { isLoading: true } });
			const chats = await Chat.queryChatAll();
			dispatch({ type: 'CHAT_SET_ALL', payload: { chats } });
		} catch (error) {
			reg.logger().error('useFormChat: 加载聊天记录失败', error);
			dispatch({ type: 'CHAT_SET_ERROR', payload: { error } });
		} finally {
			dispatch({ type: 'CHAT_SET_LOADING', payload: { isLoading: false } });
		}
	}, [dispatch]);

	// 保存新消息
	const saveChat = useCallback(async (message: string) => {
		if (!message.trim()) return null;

		try {
			const now = Date.now();
			const newMessage: Partial<ChatEntity> = {
				msg: message.trim(),
				created_time: now,
				updated_time: now,
				deleted_time: 0,
				markup_language: 1,
			};

			const savedMessage = await Chat.save(newMessage);
			if (savedMessage?.id) {
				dispatch({ type: 'CHAT_ADD', payload: { chat: savedMessage } });
			}
			return savedMessage;
		} catch (error) {
			reg.logger().error('useFormChat: 保存消息失败', error);
			throw error;
		}
	}, [dispatch]);

	// 初始加载
	useEffect(() => {
		void loadChats();
	}, [loadChats]);

	return {
		loadChats,
		saveChat,
	};
}
