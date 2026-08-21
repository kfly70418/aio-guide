'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Provider {
  id: string;
  name: string;
  website_url: string | null;
  verification_status: string | null;
}

interface Model {
  id: string;
  slug: string;
  name: string;
  family: string;
}

// 预设模板
const PRESETS = [
  {
    name: '全套主流',
    desc: 'Claude + GPT + Gemini 全系',
    families: ['Claude', 'GPT', 'Gemini'],
    all: true,
  },
  {
    name: 'Claude + GPT',
    desc: '不含 Gemini',
    families: ['Claude', 'GPT'],
    all: true,
  },
  {
    name: '核心热门',
    desc: 'Sonnet / o1 / 4o / Gemini Flash',
    families: null,
    keywords: ['Sonnet', 'Opus', 'o1', 'o3', '4o', '4-turbo', '2.0', '1.5 Pro'],
  },
]

export default function ProviderModelsPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [configuredProviderIds, setConfiguredProviderIds] = useState<Set<string>>(new Set());
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [selectedModels, setSelectedModels] = useState<Set<string>>(new Set());
  const [existingModels, setExistingModels] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [bulkMessage, setBulkMessage] = useState('');
  const [selectedProviderIds, setSelectedProviderIds] = useState<Set<string>>(new Set());
  const [bulkPreset, setBulkPreset] = useState(0);
  const [tab, setTab] = useState<'single' | 'batch'>('single');

  const supabase = createClient();

  useEffect(() => { loadData(); }, []);
  useEffect(() => { if (selectedProvider) loadProviderModels(selectedProvider); }, [selectedProvider]);

  async function loadData() {
    setLoading(true);
    const [{ data: pData }, { data: mData }, { data: channelData }] = await Promise.all([
      supabase.from('providers').select('id, name, website_url, verification_status').eq('verification_status', 'verified').order('name'),
      supabase.from('models').select('id, slug, name, family').eq('status', 'published').order('family, name'),
      supabase.from('channels').select('provider_id, prices(id)'),
    ]);
    setProviders(pData || []);
    setModels(mData || []);
    // 标记已有 prices 配置的服务商
    const configured = new Set<string>(
      (channelData || [])
        .filter((c: any) => c.prices && c.prices.length > 0)
        .map((c: any) => c.provider_id)
    );
    setConfiguredProviderIds(configured);
    setLoading(false);
  }

  async function loadProviderModels(providerId: string) {
    const { data: channels } = await supabase.from('channels').select('id').eq('provider_id', providerId);
    if (!channels || channels.length === 0) { setExistingModels(new Set()); setSelectedModels(new Set()); return; }
    const { data: prices } = await supabase.from('prices').select('model_id').in('channel_id', channels.map(c => c.id));
    const ids = new Set((prices || []).map(p => p.model_id));
    setExistingModels(ids);
    setSelectedModels(new Set(ids));
  }

  function getPresetModelIds(presetIdx: number): string[] {
    const preset = PRESETS[presetIdx];
    if (!preset) return [];
    if (preset.all && preset.families) {
      return models.filter(m => preset.families!.includes(m.family)).map(m => m.id);
    }
    if (preset.keywords) {
      return models.filter(m =>
        preset.keywords!.some(k => m.name.includes(k) || m.slug.includes(k.toLowerCase()))
      ).map(m => m.id);
    }
    return [];
  }

  async function saveModels() {
    if (!selectedProvider) return;
    setSaving(true); setMessage('');
    try {
      const res = await fetch('/api/admin/provider-models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId: selectedProvider, modelIds: Array.from(selectedModels) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage(`✅ 成功保存！已配置 ${data.count} 个模型。`);
      setExistingModels(new Set(selectedModels));
      setTimeout(() => setMessage(''), 3000);
    } catch (e: any) {
      setMessage(`❌ 保存失败: ${e.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function batchSave() {
    if (selectedProviderIds.size === 0) { setBulkMessage('❌ 请先选择服务商'); return; }
    const modelIds = getPresetModelIds(bulkPreset);
    if (modelIds.length === 0) { setBulkMessage('❌ 没有匹配的模型'); return; }

    setBulkSaving(true); setBulkMessage('');
    let ok = 0; let fail = 0;

    for (const providerId of Array.from(selectedProviderIds)) {
      try {
        const res = await fetch('/api/admin/provider-models', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ providerId, modelIds }),
        });
        if (res.ok) ok++;
        else fail++;
      } catch { fail++; }
    }

    setBulkMessage(`✅ 批量配置完成：${ok} 个成功${fail > 0 ? `，${fail} 个失败` : ''}，每个服务商各配置 ${modelIds.length} 个模型。`);
    setSelectedProviderIds(new Set());
    setBulkSaving(false);
  }

  const modelsByFamily = models.reduce((acc, m) => {
    if (!acc[m.family]) acc[m.family] = [];
    acc[m.family].push(m);
    return acc;
  }, {} as Record<string, Model[]>);

  if (loading) return <div className="p-8 text-gray-500">加载中...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">服务商模型配置</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setTab('single')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'single' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            逐个配置
          </button>
          <button
            onClick={() => setTab('batch')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'batch' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            批量配置
          </button>
        </div>
      </div>

      {/* ===== 批量配置 Tab ===== */}
      {tab === 'batch' && (
        <div className="space-y-6">
          {/* 步骤1：选预设 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">步骤 1：选择模型预设</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {PRESETS.map((preset, i) => (
                <button
                  key={i}
                  onClick={() => setBulkPreset(i)}
                  className={`text-left p-4 rounded-lg border-2 transition-colors ${
                    bulkPreset === i ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900">{preset.name}</div>
                  <div className="text-sm text-gray-500 mt-1">{preset.desc}</div>
                  <div className="text-xs text-blue-600 mt-2">
                    约 {getPresetModelIds(i).length} 个模型
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-4 text-sm text-gray-500">
              当前预设包含模型：
              {getPresetModelIds(bulkPreset).map(id => models.find(m => m.id === id)?.name).filter(Boolean).join('、')}
            </div>
          </div>

          {/* 步骤2：选服务商 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">
                步骤 2：选择要配置的服务商
                {selectedProviderIds.size > 0 && (
                  <span className="ml-2 text-sm font-normal text-blue-600">已选 {selectedProviderIds.size} 个</span>
                )}
              </h2>
              <div className="flex gap-2 text-sm">
                <button
                  onClick={() => setSelectedProviderIds(new Set(providers.map(p => p.id)))}
                  className="text-blue-600 hover:underline"
                >
                  全选
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={() => setSelectedProviderIds(new Set(providers.filter(p => !configuredProviderIds.has(p.id)).map(p => p.id)))}
                  className="text-orange-600 hover:underline font-medium"
                >
                  仅选未配置（{providers.filter(p => !configuredProviderIds.has(p.id)).length}个）
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={() => setSelectedProviderIds(new Set())}
                  className="text-gray-500 hover:underline"
                >
                  清除
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-72 overflow-y-auto">
              {providers.map(p => (
                <label
                  key={p.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer border transition-colors ${
                    selectedProviderIds.has(p.id)
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedProviderIds.has(p.id)}
                    onChange={() => {
                      const next = new Set(selectedProviderIds);
                      if (next.has(p.id)) next.delete(p.id); else next.add(p.id);
                      setSelectedProviderIds(next);
                    }}
                    className="rounded border-gray-300 text-blue-600"
                  />
                  <span className="text-sm text-gray-800 truncate">{p.name}</span>
                  {configuredProviderIds.has(p.id) && (
                    <span className="ml-auto text-xs text-green-600 shrink-0">✓</span>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* 步骤3：执行 */}
          <div className="flex items-center gap-4">
            <button
              onClick={batchSave}
              disabled={bulkSaving || selectedProviderIds.size === 0}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {bulkSaving ? '配置中...' : `批量配置 ${selectedProviderIds.size} 个服务商`}
            </button>
            {bulkMessage && (
              <span className={`text-sm ${bulkMessage.startsWith('✅') ? 'text-green-700' : 'text-red-600'}`}>
                {bulkMessage}
              </span>
            )}
          </div>
        </div>
      )}

      {/* ===== 逐个配置 Tab ===== */}
      {tab === 'single' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧服务商列表 */}
          <div className="lg:col-span-1 bg-white rounded-lg border border-gray-200 p-4">
            <h2 className="font-semibold text-gray-900 mb-3">选择服务商</h2>
            <div className="space-y-1 max-h-[600px] overflow-y-auto">
              {providers.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedProvider(p.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
                    selectedProvider === p.id ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'
                  }`}
                >
                  <div className="font-medium text-sm">{p.name}</div>
                  {selectedProvider === p.id && existingModels.size > 0 && (
                    <div className="text-xs mt-0.5 opacity-80">已配置 {existingModels.size} 个模型</div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 右侧模型选择 */}
          <div className="lg:col-span-2">
            {selectedProvider ? (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-semibold text-gray-900">
                      {providers.find(p => p.id === selectedProvider)?.name}
                    </h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                      已选 <span className="font-medium text-blue-600">{selectedModels.size}</span> 个模型
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      onChange={e => {
                        if (!e.target.value) return;
                        const ids = getPresetModelIds(parseInt(e.target.value));
                        setSelectedModels(new Set(ids));
                        e.target.value = '';
                      }}
                      className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg text-gray-700"
                      defaultValue=""
                    >
                      <option value="">快速应用预设...</option>
                      {PRESETS.map((preset, i) => (
                        <option key={i} value={i}>{preset.name}（{getPresetModelIds(i).length}个）</option>
                      ))}
                      <option value="-1">清空选择</option>
                    </select>
                    <button
                      onClick={saveModels}
                      disabled={saving}
                      className="px-5 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {saving ? '保存中...' : '保存配置'}
                    </button>
                  </div>
                </div>

                {message && (
                  <div className={`mb-4 px-4 py-2 rounded-lg text-sm ${message.startsWith('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                    {message}
                  </div>
                )}

                <div className="space-y-4 max-h-[550px] overflow-y-auto pr-1">
                  {Object.entries(modelsByFamily).map(([family, familyModels]) => (
                    <div key={family}>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-gray-800">{family}</h3>
                        <button
                          onClick={() => {
                            const next = new Set(selectedModels);
                            const allSelected = familyModels.every(m => next.has(m.id));
                            familyModels.forEach(m => allSelected ? next.delete(m.id) : next.add(m.id));
                            setSelectedModels(next);
                          }}
                          className="text-xs text-blue-500 hover:underline"
                        >
                          {familyModels.every(m => selectedModels.has(m.id)) ? '取消全选' : '全选'}
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                        {familyModels.map(model => (
                          <label
                            key={model.id}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer border transition-colors ${
                              selectedModels.has(model.id)
                                ? 'border-blue-400 bg-blue-50'
                                : 'border-transparent hover:bg-gray-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedModels.has(model.id)}
                              onChange={() => {
                                const next = new Set(selectedModels);
                                if (next.has(model.id)) next.delete(model.id); else next.add(model.id);
                                setSelectedModels(next);
                              }}
                              className="rounded border-gray-300 text-blue-600"
                            />
                            <div>
                              <div className="text-sm font-medium text-gray-900">{model.name}</div>
                              <div className="text-xs text-gray-400">{model.slug}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center text-gray-400">
                ← 请从左侧选择一个服务商
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
