# React Native Async Storage Namespace

Just a simple wrapper to add namespace and event subscription functionality to `react-native-async-storage/async-storage`.

Useful when you are working with multiple projects in Expo Go.


## Documentation

### Namespace

```bash
expo install @react-native-async-storage/async-storage
npm i react-native-async-storage-namespace
```

--

`utils/asyncStorage.js`
```js
import { NamespaceAsyncStorage } from 'react-native-async-storage-namespace'

export default new NamespaceAsyncStorage('@myapp')
```

`components/Something.jsx`
```js
// ...your imports

import AsyncStorage from '../utils/asyncStorage'

async function test() {
  await AsyncStorage.setItem('stuff', 'good stuff')
  // stored as @myapp.stuff inside AsyncStorage
  
  const value = await AsyncStorage.getItem('stuff')
  // value = 'good stuff'
    
  const keys = await AsyncStorage.getAllKeys()
  // keys = ['stuff']
}

// your component code...
```

The API is fully compatible with version `@react-native-async-storage/async-storage@1.16.1` as of writing. See [react-native-async-storage API documentation](https://react-native-async-storage.github.io/async-storage/docs/api).

### Event Subscription

Useful if you want to watch for storage changes (e.g. syncing user preference to cloud).

```js
// ...your React imports
import AsyncStorage from '../utils/asyncStorage'

export default function UsefulComponent() {
  useEffect(() => {
    const subscription = AsyncStorage.addEventListener('set', evt => {
      console.log(`${evt.key} has set to ${evt.value}`)
    })
    
    return () => subscription.remove()
  }, [])
  
  const handleClick = async () => {
    await AsyncStorage.setItem('stuff', 'good stuff')
    // console prints: stuff has set to good stuff
  }
  
  return ...
}
```

## License

MIT