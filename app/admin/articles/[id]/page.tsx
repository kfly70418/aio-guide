import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ArticleForm from '@/components/admin/ArticleForm'
import { getProviderOptions } from '@/lib/adminData'

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: article }, providers] = await Promise.all([
    supabase.from('articles').select('*').eq('id', id).single(),
    getProviderOptions(),
  ])

  if (!article) {
    notFound()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">编辑文章</h1>
      <ArticleForm mode="edit" article={article} providers={providers} />
    </div>
  )
}
