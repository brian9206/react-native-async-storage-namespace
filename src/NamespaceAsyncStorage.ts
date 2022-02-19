import AsyncStorage from '@react-native-async-storage/async-storage'
import { EventTarget, Event } from 'event-target-shim'
import { StorageEvent, StorageEventListener, StorageEventTypes } from './events'
import {
  Callback,
  CallbackWithResult,
  KeyValuePair,
  MultiCallback,
  MultiGetCallback,
  AsyncStorageStatic,
} from '@react-native-async-storage/async-storage/lib/typescript/types'
import { AsyncStorageHook } from '@react-native-async-storage/async-storage/src/types'

/**
 * Async storage with namespace. API is fully compatible with `react-native-async-storage` after instantiate.
 * @see https://react-native-async-storage.github.io/async-storage/docs/api
 */
export class NamespaceAsyncStorage implements AsyncStorageStatic {
  private readonly _namespace: string
  private readonly _eventTarget: EventTarget

  /**
   * Create an async storage with namespace
   * @param namespace
   */
  constructor(namespace: string) {
    this._namespace = namespace
    this._eventTarget = new EventTarget()
  }

  private _key(key: string) {
    return this._namespace + '.' + key
  }

  private _stripNamespacePrefix(key: string) {
    if (this._isInNamespace(key))
      return key.substring(this._namespace.length + 1)
    return key
  }

  private _isInNamespace(key: string) {
    return key.startsWith(this._namespace + '.')
  }

  // replicate AsyncStorage API

  public async getItem(
    key: string,
    callback?: CallbackWithResult<string>
  ): Promise<string | null> {
    return await AsyncStorage.getItem(this._key(key), callback)
  }

  public async setItem(
    key: string,
    value: string,
    callback?: Callback
  ): Promise<void> {
    await AsyncStorage.setItem(this._key(key), value, callback)

    const evt = new Event('set') as StorageEvent
    evt.key = key
    evt.value = value
    this._eventTarget.dispatchEvent(evt)
  }

  public async mergeItem(
    key: string,
    value: string,
    callback?: Callback
  ): Promise<void> {
    await AsyncStorage.mergeItem(this._key(key), value, callback)

    const evt = new Event('merge') as StorageEvent
    evt.key = key
    evt.value = value
    this._eventTarget.dispatchEvent(evt)
  }

  public async removeItem(key: string, callback?: Callback): Promise<void> {
    await AsyncStorage.removeItem(this._key(key), callback)

    const evt = new Event('remove') as StorageEvent
    evt.key = key
    this._eventTarget.dispatchEvent(evt)
  }

  public async getAllKeys(
    callback?: CallbackWithResult<readonly string[]>
  ): Promise<string[]> {
    const keys = await AsyncStorage.getAllKeys((error, result) => {
      if (!callback) return
      callback(
        error,
        result
          ? result
              .filter((key) => this._isInNamespace(key))
              .map((key) => this._stripNamespacePrefix(key))
          : null
      )
    })
    return keys
      .filter((key) => this._isInNamespace(key))
      .map((key) => this._stripNamespacePrefix(key))
  }

  public async multiGet(
    keys: string[],
    callback?: MultiGetCallback
  ): Promise<[string, string | null][]> {
    const values = (await AsyncStorage.multiGet(
      keys.map(this._key),
      (error, result) => {
        if (!callback) return
        callback(
          error,
          result
            ? result.map(([key, value]) => [
                this._stripNamespacePrefix(key),
                value,
              ])
            : null
        )
      }
    )) as KeyValuePair[]
    return values.map(([key, value]) => [
      this._stripNamespacePrefix(key),
      value,
    ])
  }

  public async multiSet(
    keyValuePairs: KeyValuePair[],
    callback?: MultiCallback
  ): Promise<void> {
    const kvp = keyValuePairs.map(
      ([key, value]) => [this._key(key), value] as KeyValuePair
    )
    await AsyncStorage.multiSet(kvp, callback)

    for (const [key, value] of kvp) {
      const evt = new Event('set') as StorageEvent
      evt.key = key
      evt.value = value
      this._eventTarget.dispatchEvent(evt)
    }
  }

  public async multiMerge(
    keyValuePairs: KeyValuePair[],
    callback?: MultiCallback
  ): Promise<void> {
    const kvp = keyValuePairs.map(
      ([key, value]) => [this._key(key), value] as KeyValuePair
    )
    await AsyncStorage.multiMerge(kvp, callback)

    for (const [key, value] of kvp) {
      const evt = new Event('merge') as StorageEvent
      evt.key = key
      evt.value = value
      this._eventTarget.dispatchEvent(evt)
    }
  }

  public async multiRemove(
    keys: string[],
    callback?: MultiCallback
  ): Promise<void> {
    const _keys = keys.map(this._key)
    await AsyncStorage.multiRemove(_keys, callback)

    for (const key of _keys) {
      const evt = new Event('remove') as StorageEvent
      evt.key = key
      this._eventTarget.dispatchEvent(evt)
    }
  }

  public async clear(callback?: Callback): Promise<void> {
    let error: any = null

    try {
      const keys = await this.getAllKeys()
      await AsyncStorage.multiRemove(keys.map(this._key))
      this._eventTarget.dispatchEvent(new Event('clear'))
    } catch (err) {
      error = err
    }

    if (callback) callback(error)
  }

  public flushGetRequests() {
    AsyncStorage.flushGetRequests()
  }

  // react hook

  /**
   * @see https://react-native-async-storage.github.io/async-storage/docs/api#useasyncstorage
   */
  public useAsyncStorage(key: string): AsyncStorageHook {
    return {
      getItem: this.getItem.bind(this, key),
      setItem: this.setItem.bind(this, key),
      mergeItem: this.mergeItem.bind(this, key),
      removeItem: this.removeItem.bind(this, key),
    }
  }

  // storage event listener

  /**
   * Subscribe storage event.
   * @return a `EventSubscription` like object contains `remove()` for `useEffect` hooks.
   */
  public addEventListener(
    type: StorageEventTypes,
    listener: StorageEventListener
  ) {
    this._eventTarget.addEventListener(type, listener as EventListener)
    return {
      remove: () => this.removeEventListener(type, listener),
    }
  }

  /**
   * Unsubscribe storage event.
   */
  public removeEventListener(
    type: StorageEventTypes,
    listener: StorageEventListener
  ) {
    this._eventTarget.removeEventListener(type, listener as EventListener)
  }
}
