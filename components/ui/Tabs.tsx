'use client'

import { ReactNode } from 'react'

export interface Tab {
  id: string
  label: string
  content: ReactNode
  disabled?: boolean
}

export interface TabsProps {
  tabs: Tab[]
  activeTab: string
  onChange: (tabId: string) => void
  className?: string
}

export function Tabs({ tabs, activeTab, onChange, className = '' }: TabsProps) {
  return (
    <div className={className}>
      {/* Tab 头部 */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="标签页">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab
            const isDisabled = tab.disabled

            return (
              <button
                key={tab.id}
                onClick={() => !isDisabled && onChange(tab.id)}
                disabled={isDisabled}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                  transition-colors
                  ${
                    isActive
                      ? 'border-blue-500 text-blue-600'
                      : isDisabled
                      ? 'border-transparent text-gray-400 cursor-not-allowed'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
                aria-current={isActive ? 'page' : undefined}
              >
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab 内容 */}
      <div className="mt-4">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={tab.id === activeTab ? 'block' : 'hidden'}
            role="tabpanel"
            aria-labelledby={`tab-${tab.id}`}
          >
            {tab.content}
          </div>
        ))}
      </div>
    </div>
  )
}
