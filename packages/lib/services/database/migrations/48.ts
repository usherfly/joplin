import { SqlQuery } from '../types';

export default (): (SqlQuery|string)[] => {
	const queries: (SqlQuery|string)[] = [];

	const chatsSql = `
		CREATE TABLE IF NOT EXISTS chats (
			encryption_applied INT,
			encryption_cipher_text TEXT,
			parent_id TEXT,
			id TEXT PRIMARY KEY,
			msg TEXT,
			markup_language INT,
			created_time INT,
			deleted_time INT,
			updated_time INT
		);
	`;

	queries.push(chatsSql);
	queries.push('CREATE INDEX IF NOT EXISTS chats_parent_id ON chats (parent_id)');
	queries.push('CREATE INDEX IF NOT EXISTS chats_created_time ON chats (created_time)');

	return queries;
};
