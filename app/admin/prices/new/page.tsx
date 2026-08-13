import PriceForm from '@/components/admin/PriceForm'
import { getChannelOptions, getModelOptions } from '@/lib/adminData'

export default async function NewPricePage() {
  const [channels, models] = await Promise.all([
    getChannelOptions(),
    getModelOptions(),
  ])

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">新增价格</h1>
      <PriceForm mode="create" channels={channels} models={models} />
    </div>
  )
}
