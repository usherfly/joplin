import * as React from 'react';
import { useState, useCallback, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { reg } from '@joplin/lib/registry';
import { ChatEntity } from '@joplin/lib/services/database/types';
import { connect } from 'react-redux';
import { AppState } from '../../app.reducer';
import useFormChat from './utils/useFormChat';
import { Dispatch } from 'redux';

const ChatWindowContainer = styled.div`
	width: 100%;
	height: 100%;
	background-color: white;
	border-left: 1px solid #ccc;
	display: flex;
	flex-direction: column;
`;

const ChatHeader = styled.div`
	padding: 10px;
	background-color: #f5f5f5;
	border-bottom: 1px solid #ccc;
`;

const ChatMessages = styled.div`
	flex: 1;
	padding: 10px;
	overflow-y: auto;
`;

const ChatInputContainer = styled.div`
	display: flex;
	padding: 10px;
	border-top: 1px solid #ccc;
`;

const ChatInput = styled.input`
	flex: 1;
	padding: 10px;
	border: 1px solid #ccc;
	border-radius: 4px;
	margin-right: 10px;
`;

const SendButton = styled.button`
	padding: 10px 20px;
	background-color: #007bff;
	color: white;
	border: none;
	border-radius: 4px;
	cursor: pointer;

	&:hover {
		background-color: #0056b3;
	}
`;

interface Props {
	dispatch: Dispatch;
	chats: ChatEntity[];
	isLoading: boolean;
	error: Error | null;
}

const ChatWindow: React.FC<Props> = (props) => {
	const [message, setMessage] = useState('');
	const [isSending, setIsSending] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);

	const { saveChat } = useFormChat({
		dispatch: props.dispatch,
	});

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	};

	// 消息列表变化时滚动到底部
	useEffect(() => {
		scrollToBottom();
	}, [props.chats]);

	// 处理发送消息
	const handleSendMessage = useCallback(async () => {
		if (message.trim() && !isSending) {
			try {
				setIsSending(true);
				await saveChat(message);
				setMessage('');
				scrollToBottom();
			} catch (error) {
				reg.logger().error('ChatWindow: 保存消息失败:', error);
			} finally {
				setIsSending(false);
			}
		}
	}, [message, isSending, saveChat]);

	// 处理输入变化
	const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
		setMessage(event.target.value);
	}, []);

	if (props.error) {
		return (
			<ChatWindowContainer>
				<div style={{ padding: 20, color: 'red' }}>
					加载聊天记录失败: {props.error.message}
				</div>
			</ChatWindowContainer>
		);
	}

	return (
		<ChatWindowContainer>
			<ChatHeader>Chat</ChatHeader>
			<ChatMessages>
				{props.isLoading ? (
					<div style={{ padding: 20 }}>加载中...</div>
				) : (
					<>
						{(props.chats || []).filter(chat => chat && chat.id).map((msg: ChatEntity) => (
							<div key={msg.id}>
								<span>{new Date(msg.created_time).toLocaleString()}: </span>
								<span>{msg.msg}</span>
							</div>
						))}
						<div ref={messagesEndRef} />
					</>
				)}
			</ChatMessages>
			<ChatInputContainer>
				<ChatInput
					type="text"
					placeholder="Type a message..."
					value={message}
					onChange={handleInputChange}
					onKeyPress={(event) => {
						if (event.key === 'Enter') void handleSendMessage();
					}}
					disabled={isSending}
				/>
				<SendButton
					onClick={() => void handleSendMessage()}
					disabled={isSending}
				>
					{isSending ? '发送中...' : 'Send'}
				</SendButton>
			</ChatInputContainer>
		</ChatWindowContainer>
	);
};

const mapStateToProps = (state: AppState) => {
	return {
		chats: state.chats || [],
		isLoading: state.chatLoadingState || false,
		error: state.chatError || null,
	};
};

export default connect(mapStateToProps)(ChatWindow);
