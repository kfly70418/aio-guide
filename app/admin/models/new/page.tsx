import ModelForm from '@/components/admin/ModelForm'

export default function NewModelPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">新增模型</h1>
      <ModelForm mode="create" />
    </div>
  )
}
