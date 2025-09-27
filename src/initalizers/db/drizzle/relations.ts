import { relations } from "drizzle-orm/relations";
import { users, plaidConnections, transactions } from "./schema";

export const plaidConnectionsRelations = relations(plaidConnections, ({one, many}) => ({
	user: one(users, {
		fields: [plaidConnections.userId],
		references: [users.id]
	}),
	transactions: many(transactions),
}));

export const usersRelations = relations(users, ({many}) => ({
	plaidConnections: many(plaidConnections),
}));

export const transactionsRelations = relations(transactions, ({one}) => ({
	plaidConnection: one(plaidConnections, {
		fields: [transactions.plaidConnectionId],
		references: [plaidConnections.id]
	}),
}));