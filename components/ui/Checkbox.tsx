import { InputHTMLAttributes, forwardRef } from 'react'

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  error?: string
  helperText?: string
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      label,
      error,
      helperText,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`

    const checkboxClasses = `
      h-4 w-4 rounded border-gray-300 text-blue-600
      focus:ring-2 focus:ring-blue-500 focus:ring-offset-0
      disabled:cursor-not-allowed disabled:opacity-50
      ${error ? 'border-red-300' : ''}
      ${className}
    `.trim()

    return (
      <div>
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              ref={ref}
              id={checkboxId}
              type="checkbox"
              className={checkboxClasses}
              aria-invalid={error ? 'true' : 'false'}
              aria-describedby={error ? `${checkboxId}-error` : helperText ? `${checkboxId}-helper` : undefined}
              {...props}
            />
          </div>
          {label && (
            <div className="ml-3 text-sm">
              <label htmlFor={checkboxId} className="font-medium text-gray-700">
                {label}
              </label>
            </div>
          )}
        </div>

        {error && (
          <p id={`${checkboxId}-error`} className="mt-1 text-sm text-red-600">
            {error}
          </p>
        )}

        {!error && helperText && (
          <p id={`${checkboxId}-helper`} className="mt-1 text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Checkbox.displayName = 'Checkbox'
