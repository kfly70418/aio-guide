'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Provider {
  id: string;
  name: string;
  website_url: string;
  verification_status: string;
}

interface Model {
  id: string;
  slug: string;
  name: string;
  family: string;
}

interface Channel {
  id: string;
  provider_id: string;
  name: string;
}

interface Price {
  channel_id: string;
  model_id: string;
}

export default function ProviderModelsPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [selectedModels, setSelectedModels] = useState<Set<string>>(new Set());
  const [existingModels, setExistingModels] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedProvider) {
      loadProviderModels(selectedProvider);
    }
  }, [selectedProvider]);

  async function loadData() {
    setLoading(true);

    // 加载服务商
    const { data: providersData } = await supabase
      .from('providers')
      .select('id, name, website_url, verification_status')
      .eq('verification_status', 'verified')
      .order('name');

    // 加载模型
    const { data: modelsData } = await supabase
      .from('models')
      .select('id, slug, name, family')
      .eq('status', 'published')
      .order('family, name');

    setProviders(providersData || []);
    setModels(modelsData || []);
    setLoading(false);
  }

  async function loadProviderModels(providerId: string) {
    // 查询该服务商的 channel
    const { data: channels } = await supabase
      .from('channels')
      .select('id, provider_id, name')
      .eq('provider_id', providerId);

    if (!channels || channels.length === 0) {
      setExistingModels(new Set());
      setSelectedModels(new Set());
      return;
    }

    // 查询该 channel 的所有 prices
    const channelIds = channels.map(c => c.id);
    const { data: prices } = await supabase
      .from('prices')
      .select('channel_id, model_id')
      .in('channel_id', channelIds);

    const modelIds = new Set((prices || []).map(p => p.model_id));
    setExistingModels(modelIds);
    setSelectedModels(new Set(modelIds));
  }

  function toggleModel(modelId: string) {
    const newSelected = new Set(selectedModels);
    if (newSelected.has(modelId)) {
      newSelected.delete(modelId);
    } else {
      newSelected.add(modelId);
    }
    setSelectedModels(newSelected);
  }

  async function saveModels() {
    if (!selectedProvider) return;

    setSaving(true);
    setMessage('');

    try {
      // 1. 查询或创建 channel
      let { data: channels } = await supabase
        .from('channels')
        .select('id')
        .eq('provider_id', selectedProvider)
        .eq('is_primary', true)
        .limit(1);

      let channelId: string;

      if (!channels || channels.length === 0) {
        // 创建新 channel
        const provider = providers.find(p => p.id === selectedProvider);
        const { data: newChannel, error: channelError } = await supabase
          .from('channels')
          .insert({
            provider_id: selectedProvider,
            name: `${provider?.name} 官方渠道`,
            is_primary: true,
            status: 'active',
            priority: 0
          })
          .select('id')
          .single();

        if (channelError) throw channelError;
        channelId = newChannel.id;
      } else {
        channelId = channels[0].id;
      }

      // 2. 删除所有旧的 prices
      await supabase
        .from('prices')
        .delete()
        .eq('channel_id', channelId);

      // 3. 插入新的 prices
      if (selectedModels.size > 0) {
        const pricesData = Array.from(selectedModels).map(modelId => ({
          channel_id: channelId,
          model_id: modelId,
          price_input: 0,
          price_output: 0,
          status: 'active'
        }));

        const { error: pricesError } = await supabase
          .from('prices')
          .insert(pricesData);

        if (pricesError) throw pricesError;
      }

      setMessage(`✅ 成功保存!已为该服务商配置 ${selectedModels.size} 个模型。`);
      setExistingModels(new Set(selectedModels));

      // 3秒后清除消息
      setTimeout(() => setMessage(''), 3000);

    } catch (error: any) {
      setMessage(`❌ 保存失败: ${error.message}`);
    } finally {
      setSaving(false);
    }
  }

  // 按 family 分组
  const modelsByFamily = models.reduce((acc, model) => {
    if (!acc[model.family]) acc[model.family] = [];
    acc[model.family].push(model);
    return acc;
  }, {} as Record<string, Model[]>);


  if (loading) {
    return <div className="p-8">加载中...</div>;
  }

  const selectedProviderData = providers.find(p => p.id === selectedProvider);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-8">服务商模型配置</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧：服务商列表 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">选择服务商</h2>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {providers.map(provider => (
                  <button
                    key={provider.id}
                    onClick={() => setSelectedProvider(provider.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                      selectedProvider === provider.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-medium">{provider.name}</div>
                    {existingModels.size > 0 && selectedProvider === provider.id && (
                      <div className="text-sm mt-1 opacity-80">
                        已配置 {existingModels.size} 个模型
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 右侧：模型选择 */}
          <div className="lg:col-span-2">
            {selectedProviderData ? (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold">{selectedProviderData.name}</h2>
                    <p className="text-sm text-slate-600 mt-1">{selectedProviderData.website_url}</p>
                  </div>
                  <button
                    onClick={saveModels}
                    disabled={saving}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {saving ? '保存中...' : '保存配置'}
                  </button>
                </div>

                {message && (
                  <div className={`mb-6 p-4 rounded-lg ${
                    message.startsWith('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                  }`}>
                    {message}
                  </div>
                )}

                <div className="mb-4 text-sm text-slate-600">
                  已选择 <span className="font-semibold text-blue-600">{selectedModels.size}</span> 个模型
                </div>

                <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2">
                  {Object.entries(modelsByFamily).map(([family, familyModels]) => (
                    <div key={family} className="border-b pb-4 last:border-b-0">
                      <h3 className="font-semibold text-lg mb-3 text-slate-800">{family}</h3>
                      <div className="space-y-2">
                        {familyModels.map(model => (
                          <label
                            key={model.id}
                            className="flex items-center px-4 py-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={selectedModels.has(model.id)}
                              onChange={() => toggleModel(model.id)}
                              className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                            />
                            <div className="ml-3">
                              <div className="font-medium text-slate-900">{model.name}</div>
                              <div className="text-sm text-slate-500">{model.slug}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-6 text-center text-slate-500">
                ← 请从左侧选择一个服务商
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
