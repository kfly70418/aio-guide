import { InputHTMLAttributes, forwardRef } from 'react'

export interface RadioOption {
  value: string
  label: string
  disabled?: boolean
}

export interface RadioGroupProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  error?: string
  helperText?: string
  options: RadioOption[]
  name: string
}

export const RadioGroup = forwardRef<HTMLInputElement, RadioGroupProps>(
  (
    {
      label,
      error,
      helperText,
      options,
      name,
      className = '',
      ...props
    },
    ref
  ) => {
    const groupId = `radio-group-${Math.random().toString(36).substr(2, 9)}`

    return (
      <div>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
          </label>
        )}

        <div className="space-y-2">
          {options.map((option, index) => {
            const radioId = `${groupId}-${option.value}`
            const radioClasses = `
              h-4 w-4 border-gray-300 text-blue-600
              focus:ring-2 focus:ring-blue-500 focus:ring-offset-0
              disabled:cursor-not-allowed disabled:opacity-50
              ${error ? 'border-red-300' : ''}
              ${className}
            `.trim()

            return (
              <div key={option.value} className="flex items-center">
                <input
                  ref={index === 0 ? ref : undefined}
                  id={radioId}
                  type="radio"
                  name={name}
                  value={option.value}
                  disabled={option.disabled}
                  className={radioClasses}
                  aria-invalid={error ? 'true' : 'false'}
                  {...props}
                />
                <label htmlFor={radioId} className="ml-3 text-sm font-medium text-gray-700">
                  {option.label}
                </label>
              </div>
            )
          })}
        </div>

        {error && (
          <p id={`${groupId}-error`} className="mt-1 text-sm text-red-600">
            {error}
          </p>
        )}

        {!error && helperText && (
          <p id={`${groupId}-helper`} className="mt-1 text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

RadioGroup.displayName = 'RadioGroup'
