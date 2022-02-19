import { NamespaceAsyncStorage } from './NamespaceAsyncStorage'
import { AsyncStorageHook } from '@react-native-async-storage/async-storage/src/types'

/**
 * @see https://react-native-async-storage.github.io/async-storage/docs/api#useasyncstorage
 */
export function useNamespaceAsyncStorage(
  namespaceAsyncStorage: NamespaceAsyncStorage,
  key: string
): AsyncStorageHook {
  return namespaceAsyncStorage.useAsyncStorage(key)
}
