import ProviderForm from '@/components/admin/ProviderForm'

export default function NewProviderPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">新增服务商</h1>
      <ProviderForm mode="create" />
    </div>
  )
}
