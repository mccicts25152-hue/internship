import { useForm } from '@tanstack/react-form'

import { useMutation } from '@tanstack/react-query'

import { useState } from 'react'

import type { User } from '@/db/schema'

import {
  insertUserFn,
  insertUserSchema,
  updateUserFn,
  updateUserSchema,
} from '@/features/user/api'

export function EditUserDialog({
  user,

  onClose,
}: {
  user: User | null

  onClose: (edited: boolean) => void
}) {
  const [error, setError] = useState<string | null>(null) // 更新用 Mutation

  const updateUserMutation = useMutation({
    mutationFn: updateUserFn,

    onSuccess: () => onClose(true),

    onError: (err) => setError(err.message),
  }) // 作成用 Mutation

  const insertUserMutation = useMutation({
    mutationFn: insertUserFn,

    onSuccess: () => {
      onClose(true)
    },

    onError: (err) => setError(err.message),
  })

  const form = useForm({
    // user がある場合はその値を、ない場合は空文字を初期値にする

    defaultValues: {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition

      name: user?.name ?? '',

      email: user?.email ?? '',

      password: '',

      role: (user?.role as 'ADMIN' | 'USER') ?? 'USER',
    },

    onSubmit: ({ value }) => {
      if (user) {
        // 編集モード

        const parsed = updateUserSchema.safeParse({ ...value, id: user.id })

        if (!parsed.success) {
          setError(parsed.error.message)

          return
        }

        updateUserMutation.mutate({ data: parsed.data })
      } else {
        // 新規作成モード

        const parsed = insertUserSchema.safeParse(value)

        if (!parsed.success) {
          setError(parsed.error.message)

          return
        }

        insertUserMutation.mutate({ data: parsed.data })
      }
    },
  })

  const isPending = updateUserMutation.isPending || insertUserMutation.isPending

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      
      <div className="bg-white p-6 rounded-lg shadow-xl w-96">
        <h2 className="text-xl font-bold mb-4">
          {user ? 'ユーザー編集' : '新規ユーザー作成'}
        </h2>
        
        <form
          onSubmit={(e) => {
            e.preventDefault()

            e.stopPropagation()

            form.handleSubmit()
          }}
          className="grid gap-4"
        >
          
          {error && <div className="text-red-500 text-sm">{error}</div>}
          
          <form.Field name="name">
            
            {(field) => (
              <div className="grid gap-1">
                
                <label className="text-sm font-medium">名前</label>
                
                <input
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="border p-2 rounded"
                  placeholder="山田 太郎"
                />
                
              </div>
            )}
          </form.Field>
          <form.Field name="email">
            {(field) => (
              <div className="grid gap-1">
                <label className="text-sm font-medium">メールアドレス</label>
                <input
                  type="email"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="border p-2 rounded"
                  placeholder="sample@example.com"
                  disabled={!!user} // 編集時はメール変更不可にする場合が多い
                />
              </div>
            )}
          </form.Field>
          {/* 編集時はパスワード入力を任意にする（または非表示にする）などの調整が可能 */}
          
          {!user && (
            <form.Field name="password">
              
              {(field) => (
                <div className="grid gap-1">
                  
                  <label className="text-sm font-medium">パスワード</label>
                  
                  <input
                    type="password"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="border p-2 rounded"
                  />
                  
                </div>
              )}
              
            </form.Field>
          )}
          
          {user && (
            <form.Field name="role">
              
              {(field) => (
                <div className="grid gap-1">
                 
                  <label className="text-sm font-medium">権限</label>
                  
                  <select
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value as any)}
                    className="border p-2 rounded bg-white"
                  >
                    
                    <option value="USER">一般ユーザー</option>
                    <option value="ADMIN">管理者</option>
                    
                  </select>
                  
                </div>
              )}
              
            </form.Field>
          )}
          
          <div className="flex justify-end gap-2 mt-4">
            
            <button
              type="button"
              onClick={() => onClose(false)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
              disabled={isPending}
            >
                     キャンセル      
            </button>
                 
            <button
              type="submit"
              disabled={isPending}
              className="bg-cyan-600 text-white px-4 py-2 rounded hover:bg-cyan-700 disabled:opacity-50"
            >
                    
              {isPending ? '保存中...' : user ? '更新する' : '作成する'}   
               
            </button>
                
          </div>
             
        </form>
          
      </div>
       
    </div>
  )
}