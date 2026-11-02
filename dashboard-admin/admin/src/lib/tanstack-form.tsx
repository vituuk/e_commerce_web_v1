import React, { useState } from 'react'

export interface FieldState<TValue> {
  value: TValue
  meta: {
    errors: string[]
    isTouched: boolean
  }
}

export interface FieldApi<TValue> {
  name: string
  state: FieldState<TValue>
  handleChange: (value: TValue) => void
  handleBlur: () => void
}

export interface ValidatorSchema<TValues> {
  safeParse?: (values: TValues) => {
    success: boolean
    error?: { issues: Array<{ path: (string | number)[]; message: string }> }
  }
}

export interface UseFormOptions<TValues extends Record<string, any>> {
  defaultValues: TValues
  validators?: {
    onSubmit?: ValidatorSchema<TValues>
    onChange?: ValidatorSchema<TValues>
  }
  onSubmit: (props: { value: TValues }) => void | Promise<void>
}

export function useForm<TValues extends Record<string, any>>(
  options: UseFormOptions<TValues>,
) {
  const [values, setValues] = useState<TValues>(options.defaultValues)
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validate = (nextValues: TValues, schema?: ValidatorSchema<TValues>): boolean => {
    if (!schema?.safeParse) return true
    const result = schema.safeParse(nextValues)
    if (result.success) {
      setErrors({})
      return true
    }
    const nextErrors: Record<string, string[]> = {}
    for (const issue of result.error?.issues || []) {
      const key = String(issue.path[0] || '')
      if (!nextErrors[key]) nextErrors[key] = []
      nextErrors[key].push(issue.message)
    }
    setErrors(nextErrors)
    return false
  }

  const handleSubmit = async () => {
    const schema = options.validators?.onSubmit || options.validators?.onChange
    if (!validate(values, schema)) return
    setIsSubmitting(true)
    try {
      await options.onSubmit({ value: values })
    } finally {
      setIsSubmitting(false)
    }
  }

  function Field<K extends keyof TValues & string>({
    name,
    children,
  }: {
    name: K
    children: (field: FieldApi<TValues[K]>) => React.ReactNode
  }) {
    const fieldApi: FieldApi<TValues[K]> = {
      name,
      state: {
        value: values[name],
        meta: {
          errors: errors[name] || [],
          isTouched: Boolean(touched[name]),
        },
      },
      handleChange: (nextVal: TValues[K]) => {
        const nextValues = { ...values, [name]: nextVal }
        setValues(nextValues)
        if (options.validators?.onChange) {
          validate(nextValues, options.validators.onChange)
        }
      },
      handleBlur: () => {
        setTouched((prev) => ({ ...prev, [name]: true }))
      },
    }
    return <>{children(fieldApi)}</>
  }

  return {
    state: {
      values,
      errors,
      isSubmitting,
    },
    Field,
    handleSubmit,
    reset: () => {
      setValues(options.defaultValues)
      setErrors({})
      setTouched({})
    },
    setFieldValue: <K extends keyof TValues & string>(key: K, val: TValues[K]) => {
      setValues((prev) => ({ ...prev, [key]: val }))
    },
  }
}

