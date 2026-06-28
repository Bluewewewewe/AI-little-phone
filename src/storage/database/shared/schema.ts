import { pgTable, serial, varchar, text, timestamp, index } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

// ========== 双层记忆系统 ==========

// 公共记忆表（Supabase 存储，所有用户共享）
export const publicMemories = pgTable(
	"public_memories",
	{
		id: serial().primaryKey(),
		category: varchar("category", { length: 50 }).notNull(), // 世界观/角色设定/活动记录/玩家共识
		content: text("content").notNull(),
		source_user_id: varchar("source_user_id", { length: 128 }),
		source_conversation: text("source_conversation"),
		status: varchar("status", { length: 20 }).notNull().default("active"), // active/archived
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
	},
	(table) => [
		index("pm_category_idx").on(table.category),
		index("pm_status_idx").on(table.status),
	]
);

// 晋升候选队列表（用户聊天记忆 → 管理员审核 → 公共记忆）
export const promotionCandidates = pgTable(
	"promotion_candidates",
	{
		id: serial().primaryKey(),
		user_id: varchar("user_id", { length: 128 }).notNull(),
		original_conversation: text("original_conversation").notNull(),
		extracted_memory: text("extracted_memory").notNull(),
		ai_reason: text("ai_reason"),
		category: varchar("category", { length: 50 }), // 建议分类
		status: varchar("status", { length: 20 }).notNull().default("pending"), // pending/approved/rejected
		reviewer_note: text("reviewer_note"),
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		reviewed_at: timestamp("reviewed_at", { withTimezone: true }),
	},
	(table) => [
		index("pc_status_idx").on(table.status),
		index("pc_user_id_idx").on(table.user_id),
		index("pc_created_at_idx").on(table.created_at),
	]
);
