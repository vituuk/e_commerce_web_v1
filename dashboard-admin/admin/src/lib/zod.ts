export interface ZodIssue {
  path: (string | number)[]
  message: string
}

export interface SafeParseResult<T> {
  success: boolean
  data?: T
  error?: {
    issues: ZodIssue[]
  }
}

class ZodType<T = any> {
  protected checks: Array<(val: any) => string | null> = []
  protected isOptionalFlag = false

  optional(): ZodType<T | undefined> {
    this.isOptionalFlag = true
    return this as unknown as ZodType<T | undefined>
  }

  nullable(): ZodType<T | null> {
    this.isOptionalFlag = true
    return this as unknown as ZodType<T | null>
  }

  validateValue(val: any): string[] {
    if (this.isOptionalFlag && (val === undefined || val === null || val === '')) {
      return []
    }
    const errs: string[] = []
    for (const check of this.checks) {
      const msg = check(val)
      if (msg) errs.push(msg)
    }
    return errs
  }

  safeParse(val: any): SafeParseResult<T> {
    const errs = this.validateValue(val)
    if (errs.length > 0) {
      return {
        success: false,
        error: { issues: errs.map((message) => ({ path: [], message })) },
      }
    }
    return { success: true, data: val as T }
  }
}

class ZodString extends ZodType<string> {
  min(length: number, message = `Must be at least ${length} characters`): this {
    this.checks.push((val) =>
      typeof val === 'string' && val.trim().length >= length ? null : message,
    )
    return this
  }

  max(length: number, message = `Must be at most ${length} characters`): this {
    this.checks.push((val) =>
      typeof val === 'string' && val.length <= length ? null : message,
    )
    return this
  }

  email(message = 'Invalid email address'): this {
    this.checks.push((val) =>
      typeof val === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim())
        ? null
        : message,
    )
    return this
  }
}

class ZodNumber extends ZodType<number> {
  min(minVal: number, message = `Must be >= ${minVal}`): this {
    this.checks.push((val) => (Number(val) >= minVal ? null : message))
    return this
  }

  positive(message = 'Must be greater than 0'): this {
    this.checks.push((val) => (Number(val) > 0 ? null : message))
    return this
  }
}

class ZodBoolean extends ZodType<boolean> {}

class ZodObject<TShape extends Record<string, ZodType<any>>> extends ZodType<{
  [K in keyof TShape]: TShape[K] extends ZodType<infer U> ? U : any
}> {
  private shape: TShape

  constructor(shape: TShape) {
    super()
    this.shape = shape
  }

  override safeParse(
    val: any,
  ): SafeParseResult<{ [K in keyof TShape]: TShape[K] extends ZodType<infer U> ? U : any }> {
    const issues: ZodIssue[] = []
    const obj = val && typeof val === 'object' ? val : {}

    for (const key of Object.keys(this.shape)) {
      const fieldSchema = this.shape[key]
      const fieldErrs = fieldSchema.validateValue(obj[key])
      for (const message of fieldErrs) {
        issues.push({ path: [key], message })
      }
    }

    if (issues.length > 0) {
      return { success: false, error: { issues } }
    }
    return { success: true, data: obj }
  }
}

export const z = {
  string: () => new ZodString(),
  number: () => new ZodNumber(),
  boolean: () => new ZodBoolean(),
  object: <TShape extends Record<string, ZodType<any>>>(shape: TShape) =>
    new ZodObject(shape),
}

export type infer<T extends ZodType<any>> = T extends ZodType<infer U> ? U : never
export default z

