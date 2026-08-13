import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ModelForm from '@/components/admin/ModelForm'

export default async function EditModelPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: model } = await supabase
    .from('models')
    .select('*')
    .eq('id', id)
    .single()

  if (!model) {
    notFound()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">编辑模型</h1>
      <ModelForm mode="edit" model={model} />
    </div>
  )
}
