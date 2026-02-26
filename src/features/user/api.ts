import { db } from '@/db'
import { userTable } from '@/db/schema'
import { pagingSchema } from '@/features/paging'
import { auth } from '@/lib/better-auth/auth'

import { asc, count, eq, sql } from 'drizzle-orm'
import { createInsertSchema } from 'drizzle-zod'
import z from 'zod'

import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'

// getAllUsersFnから帰ってくる型情報の生成
export type UserResponse = Awaited<ReturnType<typeof getAllUsersFn>>
//
export const getAllUsersFn = createServerFn({ method: 'GET' }) // 1. Zodスキーマでサーバーへの入力を検証
  .inputValidator(pagingSchema) // 2. handlerは検証済みのデータを `data` として受け取る
  .handler(async ({ data }) => {
    // 3. トランザクション内で2つのクエリを並列実行
    return await db.transaction(async (tx) => {
      const [users, totalResult] = await Promise.all([
        // ユーザーデータをページ指定で取得
        tx.query.userTable.findMany({
          limit: data.pageSize,
          offset: data.page * data.pageSize,
          orderBy: [asc(userTable.createdAt)],
        }), // 総ユーザー数を取得
        tx.select({ value: count() }).from(userTable),
      ])
      return {
        users,
        total: totalResult[0].value,
      }
    })
  })

// (updateUser, deleteUser は後続のタスクで改修)
export const updateUserSchema = createInsertSchema(userTable).pick({
  id: true,
  name: true,
  email: true,
  role: true,
})

export const insertUserSchema = createInsertSchema(userTable)
  .pick({
    name: true,

    email: true,
  })

  .extend({
    password: z.string(),
  })

export const updateUserFn = createServerFn({ method: 'POST' })
  .inputValidator(updateUserSchema)

  .handler(async ({ data: { id, ...rest } }) => {
    await db.transaction(async (tx) => {
      if (id != null) {
        await tx

          .update(userTable)

          .set({
            ...rest,

            updatedAt: sql`now()`,
          })

          .where(eq(userTable.id, id))
      }
    })
  })

export const insertUserFn = createServerFn({ method: 'POST' })
  .inputValidator(insertUserSchema)

  .handler(async ({ data: { ...rest } }) => {
    return await db.transaction(async () => {
      await auth.api.signUpEmail({
        body: {
          ...rest,
        }, // これを追加すると、セッション（クッキー）が発行されません

        query: {
          disableSession: true,
        },
      })
    })
  })

export const deleteUserSchema = createInsertSchema(userTable).pick({
  id: true,
})
export const deleteUser = createServerFn({ method: 'POST' })
  .inputValidator(deleteUserSchema) // 削除対象のIDが文字列であることを検証
  .handler(async ({ data: userIdToDelete }) => {
    // dataがuserIdToDeleteになる
    // 1. 現在のセッションを取得
    const request = getRequest() // <-- 追記
    const session = await auth.api.getSession({ headers: request.headers }) // <-- 修正
    const currentUser = session?.user

    // 2. 権限チェック
    if (!currentUser || currentUser.role !== 'ADMIN') {
      throw new Error('管理者権限が必要です。')
    }

    // 3. 自己削除チェック
    if (currentUser.id === userIdToDelete.id) {
      throw new Error('自分自身を削除することはできません。')
    }

    // 4. ユーザーを削除
    await db.delete(userTable).where(eq(userTable.id, userIdToDelete.id))

    return { success: true }
  })

export const selfintroduction = createServerFn({ method: 'GET' }).handler(
  async () => {
    return await db.query.selfintroductiononTable.findFirst()
  },
)
