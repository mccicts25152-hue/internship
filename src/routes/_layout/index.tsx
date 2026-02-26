import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { type ColumnDef } from '@tanstack/react-table'
import { useMemo, useState } from 'react'
import type { User } from '@/db/schema'
import type { UserResponse } from '@/features/user/api'
import { EditUserDialog } from '@/components/dialog/EditUserDialog'
import { pagingSchema } from '@/features/paging'
import { deleteUser, getAllUsersFn } from '@/features/user/api'
import { DataTable } from '@/components/table/DataTable'
import { Pagination } from '@/components/table/Pagination'

export const Route = createFileRoute('/_layout/')({
  component: RouteComponent,
  validateSearch: pagingSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    const { page, pageSize } = deps

    await context.queryClient.ensureQueryData<UserResponse>({
      queryKey: ['users', page, pageSize],
      queryFn: () =>
        getAllUsersFn({ data: { page: page, pageSize: pageSize } }),
    })
    return { page, pageSize }
  },
})

function RouteComponent() {
  const { page, pageSize } = Route.useSearch()
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>()
  const [show, setShow] = useState<'insert' | 'update' | 'delete' | null>(null)
  const queryClient = useQueryClient()
  const deleteUserMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', page, pageSize] })
      setDeleteError(null) // 成功したらエラーをクリア
    },
    onError: (error) => {
      // alert(`削除に失敗しました: ${error.message}`) // alertを削除
      setDeleteError(error.message) // <-- エラーメッセージをStateに保存
    },
  })
  const columns = useMemo(() => {
    const column: ColumnDef<User>[] = [
      {
        accessorKey: 'id',
        header: 'ID',
      },

      {
        accessorKey: 'name',
        header: '名前',
        cell(cellProps) {
          return <>{cellProps.row.original.name}さん</>
        },
      },

      {
        accessorKey: 'email',
        header: 'メールアドレス',
      },

      {
        accessorKey: 'role',
        header: '権限',
        cell(cellProps) {
          return (
            <>
              {cellProps.row.original.role === 'ADMIN'
                ? '管理者'
                : '一般ユーザー'}
            </>
          )
        },
      },

      {
        accessorKey: 'createdAt',
        header: '作成日時',
        meta: {
          cellClass: 'whitespace-nowrap',
        },
        cell(cellProps) {
          return <>{cellProps.row.original.createdAt?.toLocaleString()}</>
        },
      },

      {
        id: 'actions',
        header: '操作',
        cell(cellProps) {
          const user = cellProps.row.original

          return (
            <>
              <button
                onClick={() => {
                  setEditingUser(user)
                  setShow('update')
                }}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                編集
              </button>
              <button
                onClick={() => {
                  if (window.confirm(`本当に「削除しますか？`)) {
                    deleteUserMutation.mutate({
                      data: { id: user.id! },
                    })
                  }
                }}
                className="text-red-500 hover:text-red-800 font-medium ps-10 "
              >
                削除
              </button>
            </>
          )
        },
      },
    ]
    return column
  }, [])

  // 4. useQueryもloaderと同じキーと関数でデータを取得
  const { data } = useQuery({
    queryKey: ['users', page, pageSize],
    queryFn: () => getAllUsersFn({ data: { page: page, pageSize: pageSize } }),
  })

  const navigate = Route.useNavigate()

  return (
    <div>
      顧客リスト
        {/* 削除のエラー表示用 */}
      {deleteError && <div className="text-red-500">{deleteError}</div>}
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => setShow('insert')}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          ユーザー新規作成
        </button>
      </div>
      <DataTable<User> columns={columns} data={data?.users ?? []} />
      <Pagination
        page={page}
        pageSize={pageSize}
        totalCount={data?.total ?? 0}
        currentPageCount={data?.users.length ?? 0}
        usePageSize
        onChangePage={(newPage) => {
          navigate({
            search: (prev) => ({
              ...prev,
              page: newPage,
            }),
          })
        }}
        onChangePageSize={(newPageSize) => {
          navigate({
            search: (prev) => ({
              ...prev,
              page: 0,
              pageSize: newPageSize,
            }),
          })
        }}
      />
      {show === 'insert' && (
        <EditUserDialog
          user={null}
          onClose={async (edited) => {
            if (edited) {
              await queryClient.refetchQueries({
                queryKey: ['users', page, pageSize],
              })
            }
            setShow(null)
          }}
        />
      )}
      {show === 'update' && (
        <EditUserDialog
          user={editingUser}
          onClose={async (edited) => {
            if (edited) {
              await queryClient.refetchQueries({
                queryKey: ['users', page, pageSize],
              })
            }
            setShow(null)
          }}
        />
      )}
    </div>
  )
}
