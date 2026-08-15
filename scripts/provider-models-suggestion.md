# 服务商模型配置建议

## 📊 配置原则

### 1️⃣ **老牌综合型服务商**（通常支持所有主流模型）
- Claude 全系列
- GPT 全系列  
- Gemini 全系列
- 其他主流模型（Llama、Mistral 等）

### 2️⃣ **专注型服务商**（只支持特定家族）
- 仅 OpenAI 系
- 仅 Claude 系
- 仅国产模型

### 3️⃣ **新兴服务商**（先配置核心模型）
- GPT-4o、Claude Sonnet、Gemini Pro
- 后续根据实际情况补充

---

## 🎯 具体配置建议

### ⭐ 综合型老牌（建议全选）

#### **API2D**
- ✅ Claude 全系列（Opus、Sonnet、Haiku）
- ✅ GPT 全系列（o1、o3、4o、4-turbo、3.5）
- ✅ Gemini 全系列（2.0、1.5 Pro/Flash、1.0）
- ✅ 其他：Llama、Mistral、Doubao

#### **OpenAI-HK**
- ✅ GPT 全系列（重点）
- ✅ Claude 全系列
- ✅ Gemini 1.5 系列
- ⚠️ 注：名字带 OpenAI 但通常是综合平台

#### **APIHub**
- ✅ Claude 全系列
- ✅ GPT 全系列
- ✅ Gemini 全系列
- ✅ 其他：Llama、Qwen、DeepSeek

#### **LinkAI**
- ✅ Claude 全系列
- ✅ GPT 全系列
- ✅ Gemini 全系列

#### **AISKT**
- ✅ Claude 全系列
- ✅ GPT 全系列
- ✅ Gemini 全系列

---

### 🆕 新兴排行榜优质（核心模型优先）

#### **DuiAPI**（排行榜第1，运行率100%）
- ✅ Claude: Sonnet 3.5/3.7, Opus 4
- ✅ GPT: o1, o3, 4o, 4-turbo
- ✅ Gemini: 2.0 Flash, 1.5 Pro

#### **wawapi.top**（综合评分满分）
- ✅ Claude: Sonnet 3.5/3.7, Opus 4
- ✅ GPT: o1, o3, 4o
- ✅ Gemini: 2.0 Flash

#### **api-top.com**（排行榜第3，综合99分）
- ✅ Claude: Sonnet 3.5/3.7
- ✅ GPT: o1, 4o, 4-turbo
- ✅ Gemini: 2.0 Flash, 1.5 Pro

#### **api.koozhan.com**（排行榜第1，综合94分）
- ✅ Claude: Sonnet 3.5/3.7, Opus 4
- ✅ GPT: o1, o3, 4o
- ✅ Gemini: 2.0 Flash, 1.5 Pro

#### **CUN.ai**（排行榜第2，运行率94.5%）
- ✅ Claude 全系列
- ✅ GPT 全系列
- ✅ Gemini 全系列

#### **Modelflare**（排行榜第3，运行率94.7%）
- ✅ Claude: Sonnet 3.5/3.7
- ✅ GPT: o1, 4o
- ✅ Gemini: 2.0 Flash

---

### 🔹 中型平台（常见模型）

#### **AceDataCloud**
- ✅ Claude: Sonnet 3.5/3.7, Haiku
- ✅ GPT: 4o, 4-turbo, 3.5-turbo
- ✅ Gemini: 1.5 Pro/Flash

#### **GPT-API**
- ✅ GPT 全系列（重点）
- ✅ Claude: Sonnet 3.5, Haiku
- ✅ Gemini: 1.5 Flash

#### **AIchatOS**
- ✅ Claude: Sonnet 3.5/3.7
- ✅ GPT: o1, 4o, 4-turbo
- ✅ Gemini: 2.0 Flash, 1.5 Pro

---

### 🏢 已有服务商（补充建议）

#### **OpenOx**
- ✅ Claude 全系列
- ✅ GPT 全系列
- ✅ Gemini 全系列

#### **H API**
- ✅ Claude 全系列
- ✅ GPT 全系列
- ✅ Gemini 全系列

#### **三头牛**
- ✅ Claude: Sonnet 3.5/3.7, Opus 4
- ✅ GPT: o1, o3, 4o
- ✅ Gemini: 2.0 Flash

---

## 🎨 快速配置模板

### 模板 A：全能型（13+ 模型）
```
Claude: Opus 4, Sonnet 3.7, Sonnet 3.5, Haiku 3.5
GPT: o3, o1, 4o, 4-turbo, 3.5-turbo
Gemini: 2.0 Flash, 1.5 Pro, 1.5 Flash
其他: Llama 3, DeepSeek, Qwen
```

### 模板 B：核心型（6-8 模型）
```
Claude: Sonnet 3.7, Sonnet 3.5
GPT: o1, 4o, 4-turbo
Gemini: 2.0 Flash, 1.5 Pro
```

### 模板 C：轻量型（3-5 模型）
```
Claude: Sonnet 3.5
GPT: 4o, 4-turbo
Gemini: 2.0 Flash
```

---

## ⚠️ 注意事项

1. **优先级排序**：
   - 先配置 DuiAPI、wawapi.top、api-top.com 等高评分的
   - 再配置 API2D、OpenAI-HK 等老牌的
   - 最后配置其他新兴的

2. **模型选择原则**：
   - 最新版本优先（Sonnet 3.7 > 3.5）
   - 热门模型必选（GPT-4o、Claude Sonnet、Gemini Flash）
   - 根据服务商定位选择（OpenAI-HK 侧重 GPT）

3. **验证方式**：
   - 配置完后访问 https://www.apixuan.com/providers
   - 检查每个服务商的"支持模型"标签是否显示

4. **后续调整**：
   - 如果发现某个服务商实际不支持某模型，随时回来调整
   - 新模型发布后，批量更新所有服务商

---

## 🚀 开始配置

访问：http://localhost:3000/admin/provider-models

建议顺序：
1. DuiAPI（优先，排行第1）
2. wawapi.top（满分）
3. api-top.com
4. api.koozhan.com
5. API2D（老牌）
6. OpenAI-HK（老牌）
7. 其余按字母顺序...
