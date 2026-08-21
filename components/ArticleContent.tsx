'use client';

import { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ArticleContentProps {
  content: string;
}

export default function ArticleContent({ content }: ArticleContentProps) {
  return (
    <div className="prose prose-gray max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">{children}</h2>
          ),
          h2: ({ children }) => (
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">{children}</h3>
          ),
          p: ({ children }) => <p className="mb-4 leading-relaxed text-gray-700">{children}</p>,
          ul: ({ children }) => (
            <ul className="list-disc pl-6 mb-4 space-y-2">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-6 mb-4 space-y-2">{children}</ol>
          ),
          li: ({ children }) => <li className="text-gray-700">{children}</li>,
          code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            const isMermaid = match && match[1] === 'mermaid';

            if (isMermaid) {
              return (
                <div className="my-6 p-4 bg-gray-50 border border-gray-200 rounded-lg overflow-x-auto">
                  <div className="mermaid-code" suppressHydrationWarning>
                    {String(children).replace(/\n$/, '')}
                  </div>
                </div>
              );
            }

            return (
              <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-pink-600" {...props}>
                {children}
              </code>
            );
          },
          pre: ({ children }) => {
            // 检查是否是 mermaid 代码块
            const childrenArray = Array.isArray(children) ? children : [children];
            const codeChild = childrenArray.find((child: any) => child?.props?.className?.includes('language-mermaid'));

            if (codeChild) {
              // 直接返回 code 组件，它会处理 mermaid 渲染
              return <>{children}</>;
            }

            return (
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm mb-4 font-mono">
                {children}
              </pre>
            );
          },
          a: ({ href, children }) => {
            const isTrusted = href && (
              href.includes('openai.com') ||
              href.includes('anthropic.com') ||
              href.includes('google.com') ||
              href.includes('deepseek.com') ||
              href.includes('coze.com') ||
              href.includes('github.com')
            );
            return (
              <a
                href={href}
                target="_blank"
                rel={`noopener noreferrer${isTrusted ? '' : ' nofollow'}`}
                className="text-blue-600 hover:underline"
              >
                {children}
              </a>
            );
          },
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-blue-500 pl-4 py-2 my-4 bg-blue-50 text-gray-700 italic">
              {children}
            </blockquote>
          ),
          img: ({ src, alt }) => (
            <img
              src={src}
              alt={alt || ''}
              className="rounded-lg my-6 max-w-full h-auto"
              loading="lazy"
            />
          ),
          em: ({ children }) => (
            <em className="block text-sm text-gray-500 text-center my-2 not-italic">{children}</em>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-6">
              <table className="min-w-full divide-y divide-gray-300 border border-gray-300">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-gray-50">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-gray-200 bg-white">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr>{children}</tr>
          ),
          th: ({ children }) => (
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-r border-gray-300 last:border-r-0">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200 last:border-r-0">
              {children}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
