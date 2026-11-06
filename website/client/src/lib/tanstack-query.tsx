import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'

export type QueryKey = readonly unknown[]

interface CacheEntry<TData = unknown> {
  data?: TData
  error?: unknown
  updatedAt: number
}

type Listener = () => void

export class QueryClient {
  private cache = new Map<string, CacheEntry>()
  private listeners = new Map<string, Set<Listener>>()
  private dataListeners = new Map<string, Set<(data: any) => void>>()

  private serializeKey(key: QueryKey): string {
    return JSON.stringify(key)
  }

  private matchesPrefix(fullKeyStr: string, prefixKey: QueryKey): boolean {
    try {
      const fullKey = JSON.parse(fullKeyStr) as unknown[]
      if (!Array.isArray(fullKey)) return false
      return prefixKey.every((item, idx) => JSON.stringify(fullKey[idx]) === JSON.stringify(item))
    } catch {
      return false
    }
  }

  getQueryData<TData = unknown>(queryKey: QueryKey): TData | undefined {
    const key = this.serializeKey(queryKey)
    return this.cache.get(key)?.data as TData | undefined
  }

  setQueryData<TData = unknown>(
    queryKey: QueryKey,
    updater: TData | ((old: TData | undefined) => TData),
  ): TData {
    const key = this.serializeKey(queryKey)
    const oldData = this.cache.get(key)?.data as TData | undefined
    const nextData =
      typeof updater === 'function'
        ? (updater as (old: TData | undefined) => TData)(oldData)
        : updater
    this.cache.set(key, { data: nextData, updatedAt: Date.now() })
    this.dataListeners.get(key)?.forEach((cb) => cb(nextData))
    return nextData
  }

  subscribeData<TData = unknown>(
    queryKey: QueryKey,
    listener: (data: TData) => void,
  ): () => void {
    const key = this.serializeKey(queryKey)
    if (!this.dataListeners.has(key)) {
      this.dataListeners.set(key, new Set())
    }
    this.dataListeners.get(key)!.add(listener)
    return () => {
      this.dataListeners.get(key)?.delete(listener)
    }
  }

  subscribe(queryKey: QueryKey, listener: Listener): () => void {
    const key = this.serializeKey(queryKey)
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set())
    }
    this.listeners.get(key)!.add(listener)
    return () => {
      this.listeners.get(key)?.delete(listener)
    }
  }

  async invalidateQueries(filters?: { queryKey?: QueryKey }): Promise<void> {
    const prefix = filters?.queryKey
    for (const [keyStr, set] of this.listeners.entries()) {
      if (!prefix || this.matchesPrefix(keyStr, prefix)) {
        set.forEach((listener) => listener())
      }
    }
  }

  clear(): void {
    this.cache.clear()
  }
}

const defaultQueryClient = new QueryClient()
const QueryClientContext = createContext<QueryClient>(defaultQueryClient)

export function QueryClientProvider({
  client,
  children,
}: {
  client?: QueryClient
  children: React.ReactNode
}) {
  return (
    <QueryClientContext.Provider value={client || defaultQueryClient}>
      {children}
    </QueryClientContext.Provider>
  )
}

export function useQueryClient(): QueryClient {
  return useContext(QueryClientContext)
}

export interface UseQueryOptions<TData = unknown> {
  queryKey: QueryKey
  queryFn: () => Promise<TData>
  enabled?: boolean
  initialData?: TData | (() => TData)
}

export interface UseQueryResult<TData = unknown> {
  data: TData | undefined
  isLoading: boolean
  isFetching: boolean
  isError: boolean
  error: unknown
  refetch: () => Promise<TData | undefined>
}

export function useQuery<TData = unknown>({
  queryKey,
  queryFn,
  enabled = true,
  initialData,
}: UseQueryOptions<TData>): UseQueryResult<TData> {
  const queryClient = useQueryClient()
  const serializedKey = JSON.stringify(queryKey)
  const queryFnRef = useRef(queryFn)
  queryFnRef.current = queryFn

  const [data, setData] = useState<TData | undefined>(() => {
    const cached = queryClient.getQueryData<TData>(queryKey)
    if (cached !== undefined) return cached
    return typeof initialData === 'function'
      ? (initialData as () => TData)()
      : initialData
  })
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    if (!enabled) return false
    return queryClient.getQueryData<TData>(queryKey) === undefined && initialData === undefined
  })
  const [isFetching, setIsFetching] = useState<boolean>(false)
  const [error, setError] = useState<unknown>(null)

  const executeFetch = useCallback(async (): Promise<TData | undefined> => {
    if (!enabled) return undefined
    setIsFetching(true)
    if (queryClient.getQueryData<TData>(JSON.parse(serializedKey)) === undefined) {
      setIsLoading(true)
    }
    try {
      const result = await queryFnRef.current()
      queryClient.setQueryData(JSON.parse(serializedKey), result)
      setData(result)
      setError(null)
      return result
    } catch (err) {
      setError(err)
      return undefined
    } finally {
      setIsLoading(false)
      setIsFetching(false)
    }
  }, [enabled, queryClient, serializedKey])

  useEffect(() => {
    const parsedKey = JSON.parse(serializedKey) as QueryKey
    void executeFetch()
    const unsubscribeRefetch = queryClient.subscribe(parsedKey, () => {
      void executeFetch()
    })
    const unsubscribeData = queryClient.subscribeData<TData>(parsedKey, (nextData) => {
      setData(nextData)
    })
    return () => {
      unsubscribeRefetch()
      unsubscribeData()
    }
  }, [executeFetch, queryClient, serializedKey])

  return {
    data,
    isLoading,
    isFetching,
    isError: Boolean(error),
    error,
    refetch: executeFetch,
  }
}

export interface MutateOptions<TData = unknown, TVariables = unknown> {
  onSuccess?: (data: TData, variables: TVariables) => void | Promise<unknown>
  onError?: (error: unknown, variables: TVariables) => void | Promise<unknown>
  onSettled?: (
    data: TData | undefined,
    error: unknown,
    variables: TVariables,
  ) => void | Promise<unknown>
}

export interface UseMutationOptions<TData = unknown, TVariables = void>
  extends MutateOptions<TData, TVariables> {
  mutationFn: (variables: TVariables) => Promise<TData>
}

export interface UseMutationResult<TData = unknown, TVariables = void> {
  mutate: (variables: TVariables, options?: MutateOptions<TData, TVariables>) => void
  mutateAsync: (
    variables: TVariables,
    options?: MutateOptions<TData, TVariables>,
  ) => Promise<TData>
  isPending: boolean
  isLoading: boolean
  isError: boolean
  isSuccess: boolean
  error: unknown
  data: TData | undefined
  reset: () => void
}

export function useMutation<TData = unknown, TVariables = void>(
  options: UseMutationOptions<TData, TVariables>,
): UseMutationResult<TData, TVariables> {
  const optionsRef = useRef(options)
  optionsRef.current = options

  const [isPending, setIsPending] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [data, setData] = useState<TData | undefined>(undefined)

  const mutateAsync = useCallback(
    async (
      variables: TVariables,
      callOptions?: MutateOptions<TData, TVariables>,
    ): Promise<TData> => {
      setIsPending(true)
      setError(null)
      setIsSuccess(false)
      try {
        const res = await optionsRef.current.mutationFn(variables)
        setData(res)
        setIsSuccess(true)
        await optionsRef.current.onSuccess?.(res, variables)
        await callOptions?.onSuccess?.(res, variables)
        await optionsRef.current.onSettled?.(res, null, variables)
        await callOptions?.onSettled?.(res, null, variables)
        return res
      } catch (err) {
        setError(err)
        await optionsRef.current.onError?.(err, variables)
        await callOptions?.onError?.(err, variables)
        await optionsRef.current.onSettled?.(undefined, err, variables)
        await callOptions?.onSettled?.(undefined, err, variables)
        throw err
      } finally {
        setIsPending(false)
      }
    },
    [],
  )

  const mutate = useCallback(
    (variables: TVariables, callOptions?: MutateOptions<TData, TVariables>) => {
      mutateAsync(variables, callOptions).catch(() => {
        // Handled by onError callbacks
      })
    },
    [mutateAsync],
  )

  const reset = useCallback(() => {
    setIsPending(false)
    setIsSuccess(false)
    setError(null)
    setData(undefined)
  }, [])

  return {
    mutate,
    mutateAsync,
    isPending,
    isLoading: isPending,
    isError: Boolean(error),
    isSuccess,
    error,
    data,
    reset,
  }
}

