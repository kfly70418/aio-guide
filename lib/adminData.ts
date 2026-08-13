// 后台共用的取数函数
import { createClient } from '@/lib/supabase/server'

export interface ChannelOption {
  id: string
  name: string
  provider_name: string
}

export interface ModelOption {
  id: string
  name: string
  family: string
}

export interface ProviderOption {
  id: string
  name: string
}

export async function getChannelOptions(): Promise<ChannelOption[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('channels')
    .select('id, name, provider:providers(name)')
    .order('name', { ascending: true })

  return (data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    provider_name: c.provider?.name ?? '未知服务商',
  }))
}

export async function getModelOptions(): Promise<ModelOption[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('models')
    .select('id, name, family')
    .order('family', { ascending: true })
    .order('name', { ascending: true })

  return (data ?? []).map((m) => ({
    id: m.id,
    name: m.name,
    family: m.family,
  }))
}

export async function getProviderOptions(): Promise<ProviderOption[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('providers')
    .select('id, name')
    .order('name', { ascending: true })

  return (data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
  }))
}
