import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ProviderForm from '@/components/admin/ProviderForm'

export default async function EditProviderPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: provider } = await supabase
    .from('providers')
    .select(`
      id, slug, name, name_en, logo_url, website_url, description, features,
      is_recommended, status, sort_order, verified_at,
      min_topup, trial_credit, transaction_fee, invoice_support, coupon_code, verification_status,
      created_by, updated_by, created_at, updated_at
    `)
    .eq('id', id)
    .single()

  if (!provider) {
    notFound()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">编辑服务商</h1>
      <ProviderForm mode="edit" provider={provider} />
    </div>
  )
}
