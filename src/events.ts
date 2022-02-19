import { Event } from 'event-target-shim'

export type StorageEventTypes = 'set' | 'merge' | 'remove' | 'clear'

export interface StorageEvent extends Event {
  key?: string
  value?: string
}

export interface StorageEventListener {
  (evt: StorageEvent): void
}
