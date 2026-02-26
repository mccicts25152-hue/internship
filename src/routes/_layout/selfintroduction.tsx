/*import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_layout/task')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div>
      <div className="ml-4 text-3xl font-medium"> 自己紹介 </div>
      <br></br>
      　　　　名前：税所幸恵 <br></br>
      　　　　学校：都城コアカレッジ　ICTエンジニア科<br></br>
      　　授業内容：現在は「ロボット制御」という授業を通じてETロボコン用にC＋言語を学んでいます。
      <br></br>
      　　卒業までの課題
    </div>
  )
}
*/

import { selfintroduction } from '@/features/user/api'
import { createFileRoute } from '@tanstack/react-router'
export const Route = createFileRoute('/_layout/selfintroduction')({
  component: RouteComponent,
  loader: async () => {
    const data = await selfintroduction()
    return { data }
  },
})

function RouteComponent() {
  // loaderでリターンされたデータをここで取得
  const { data } = Route.useLoaderData()
  return (
    <div>
      <div className="ml-4 text-3xl font-medium "> 私の名前は {data?.name} です。 </div>
      <div className="ml-4 text-3xl font-medium "> {data?.id} {data?.content}に在学しています。 </div>
      <div className="ml-4 text-3xl font-medium "> 今後の目標は {data?.task} です。 </div>
    </div>
  )
}