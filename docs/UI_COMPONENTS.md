# UI 组件库文档

阶段 3 已完成基础 UI 组件库的创建。

## 📦 已完成的组件

### 表单组件
- ✅ **Button** - 按钮组件
  - 支持 4 种变体：primary, secondary, danger, ghost
  - 支持 3 种尺寸：sm, md, lg
  - 支持加载状态和禁用状态
  - 支持全宽模式

- ✅ **Input** - 输入框组件
  - 支持标签、错误提示、帮助文本
  - 支持全宽模式
  - 内置无障碍属性

- ✅ **Textarea** - 文本域组件
  - 支持标签、错误提示、帮助文本
  - 可自定义行数
  - 支持全宽模式

- ✅ **Select** - 下拉选择组件
  - 支持选项数组配置
  - 支持占位符
  - 支持禁用选项

- ✅ **Checkbox** - 复选框组件
  - 支持标签和帮助文本
  - 支持错误状态

- ✅ **RadioGroup** - 单选按钮组组件
  - 支持选项数组配置
  - 支持禁用选项

### 数据展示组件
- ✅ **Table** - 表格组件
  - 支持自定义列配置
  - 支持加载状态和空状态
  - 支持悬停效果和斑马纹
  - 支持列对齐方式

- ✅ **Card** - 卡片组件
  - 支持标题、副标题、底部区域
  - 支持 4 种内边距：none, sm, md, lg
  - 支持悬停效果

- ✅ **Badge** - 徽章组件
  - 支持 5 种颜色变体
  - 支持 3 种尺寸

- ✅ **Tag** - 标签组件
  - 支持多种颜色
  - 支持删除功能

- ✅ **Pagination** - 分页组件
  - 支持首页/末页按钮
  - 支持省略号显示
  - 智能显示页码

### 反馈组件
- ✅ **Toast** - 提示消息组件
  - 支持 4 种类型：success, error, warning, info
  - 自动消失（3秒）
  - 支持手动关闭
  - 带滑入动画

- ✅ **Modal** - 模态框组件
  - 支持 4 种尺寸：sm, md, lg, xl
  - 支持标题、内容、底部区域
  - 支持 ESC 键关闭
  - 支持背景点击关闭

- ✅ **ConfirmDialog** - 确认对话框组件
  - 基于 Modal 构建
  - 支持加载状态
  - 支持 danger 和 primary 变体

- ✅ **Loading** - 加载组件
  - 支持 3 种尺寸
  - 支持全屏遮罩模式
  - 支持自定义文本

### 导航组件
- ✅ **Breadcrumb** - 面包屑组件
  - 支持链接和纯文本项
  - 自动添加分隔符

- ✅ **Tabs** - 标签页组件
  - 支持禁用状态
  - 支持受控模式

## 📖 使用示例

### Button 示例
```tsx
import { Button } from '@/components/ui'

// 基础用法
<Button>默认按钮</Button>

// 不同变体
<Button variant="primary">主要按钮</Button>
<Button variant="secondary">次要按钮</Button>
<Button variant="danger">危险按钮</Button>
<Button variant="ghost">幽灵按钮</Button>

// 不同尺寸
<Button size="sm">小按钮</Button>
<Button size="md">中按钮</Button>
<Button size="lg">大按钮</Button>

// 加载状态
<Button loading>加载中...</Button>

// 全宽
<Button fullWidth>全宽按钮</Button>
```

### Input 示例
```tsx
import { Input } from '@/components/ui'

<Input
  label="邮箱地址"
  type="email"
  placeholder="输入邮箱"
  required
  helperText="我们不会分享您的邮箱"
/>

// 带错误提示
<Input
  label="密码"
  type="password"
  error="密码长度至少 6 位"
/>
```

### Table 示例
```tsx
import { Table } from '@/components/ui'

const columns = [
  { key: 'name', header: '姓名' },
  { key: 'email', header: '邮箱' },
  {
    key: 'status',
    header: '状态',
    render: (row) => (
      <Badge variant={row.status === 'active' ? 'success' : 'default'}>
        {row.status}
      </Badge>
    ),
  },
]

const data = [
  { id: 1, name: '张三', email: 'zhang@example.com', status: 'active' },
  { id: 2, name: '李四', email: 'li@example.com', status: 'inactive' },
]

<Table
  columns={columns}
  data={data}
  keyExtractor={(row) => row.id.toString()}
  hover
  striped
/>
```

### Toast 示例
```tsx
import { ToastProvider, useToast } from '@/components/ui'

// 在根布局中包裹 ToastProvider
<ToastProvider>
  {children}
</ToastProvider>

// 在组件中使用
function MyComponent() {
  const { showToast } = useToast()

  const handleClick = () => {
    showToast('success', '操作成功！')
    showToast('error', '操作失败！')
    showToast('warning', '请注意！')
    showToast('info', '提示信息')
  }

  return <Button onClick={handleClick}>显示提示</Button>
}
```

### Modal 示例
```tsx
import { Modal, Button } from '@/components/ui'
import { useState } from 'react'

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>打开模态框</Button>
      
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="模态框标题"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsOpen(false)}>
              取消
            </Button>
            <Button onClick={() => setIsOpen(false)}>确认</Button>
          </>
        }
      >
        <p>这是模态框的内容</p>
      </Modal>
    </>
  )
}
```

### Pagination 示例
```tsx
import { Pagination } from '@/components/ui'
import { useState } from 'react'

function MyComponent() {
  const [currentPage, setCurrentPage] = useState(1)

  return (
    <Pagination
      currentPage={currentPage}
      totalPages={10}
      onPageChange={setCurrentPage}
      showFirstLast
    />
  )
}
```

### Tabs 示例
```tsx
import { Tabs } from '@/components/ui'
import { useState } from 'react'

function MyComponent() {
  const [activeTab, setActiveTab] = useState('tab1')

  const tabs = [
    { id: 'tab1', label: '标签1', content: <div>内容1</div> },
    { id: 'tab2', label: '标签2', content: <div>内容2</div> },
    { id: 'tab3', label: '标签3', content: <div>内容3</div>, disabled: true },
  ]

  return (
    <Tabs
      tabs={tabs}
      activeTab={activeTab}
      onChange={setActiveTab}
    />
  )
}
```

## 🎨 设计原则

### 一致性
- 所有组件使用统一的颜色系统
- 统一的间距和圆角
- 统一的字体大小和行高

### 无障碍性
- 所有表单组件支持 `aria-*` 属性
- 键盘导航支持
- 语义化 HTML 标签
- 合适的 `role` 和 `aria-label`

### 响应式
- 所有组件在移动端和桌面端都正常显示
- 适当的断点处理

### 性能
- 使用 `forwardRef` 支持 ref 传递
- 客户端组件明确标记 `'use client'`
- 避免不必要的重渲染

## 🔧 技术栈

- **React 19** - 组件库基础
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式系统
- **Next.js 15** - 框架支持

## ✅ 特性

- ✅ 完整的 TypeScript 类型定义
- ✅ 支持受控和非受控模式
- ✅ 统一的错误处理
- ✅ 无障碍性支持
- ✅ 响应式设计
- ✅ 加载和禁用状态
- ✅ 自定义样式扩展

## 📝 后续改进（可选）

- [ ] 添加深色模式支持
- [ ] 添加更多动画效果
- [ ] 添加键盘快捷键
- [ ] Storybook 文档
- [ ] 单元测试
- [ ] 性能优化
