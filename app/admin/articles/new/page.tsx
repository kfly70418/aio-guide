import ArticleForm from '@/components/admin/ArticleForm'
import { getProviderOptions } from '@/lib/adminData'

export default async function NewArticlePage() {
  const providers = await getProviderOptions()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">新增文章</h1>
      <ArticleForm mode="create" providers={providers} />
    </div>
  )
}
