# Ultimate POS Mobile

This is an [Expo](https://expo.dev) React Native mobile application for the Ultimate POS system.

## Project Structure

The project follows a modular structure to keep the codebase clean and maintainable. Most of the application code resides in the `src/` directory.

- `src/app/`: Contains the screens and routing logic using **Expo Router**. Every file here represents a screen, and `_layout.tsx` files define navigators.
- `src/components/`: Contains reusable UI components used across the application.
  - `src/components/ui/`: Contains primitive and generic UI components.
- `src/api/`: Handles all network requests and API configurations.
- `src/store/`: Contains the global state management logic using Zustand.
- `src/hooks/`: Custom React hooks for reusable logic.
- `src/constants/`: Constants used throughout the app (colors, layout metrics, configuration).
- `src/utils/`: Helper functions and utilities.

## Reusable Components Usage

We promote the use of reusable components to maintain consistency and reduce code duplication.

- **UI Components:** Basic building blocks like buttons, inputs, and text are found in `src/components/ui/` or `src/components/` (e.g., `<ThemedText />`, `<ThemedView />`). Import and use them instead of raw React Native components whenever possible to ensure styling consistency.
- **Complex Components:** Domain-specific reusable components like `<ProductCard />` and `<ProductFilterDrawer />` are located in `src/components/`.

Example:
```tsx
import { ThemedText } from '@/components/themed-text';
import { ProductCard } from '@/components/ProductCard';

// Inside your component
<ProductCard product={item} onPress={() => handlePress(item)} />
```

## Storing (State Management)

For global state management, the project uses **[Zustand](https://github.com/pmndrs/zustand)**.

- **Store Definitions:** Stores are located in the `src/store/` directory (e.g., `authStore.ts`).
- **Usage:** You can access the state and actions anywhere in your components using the custom hooks provided by Zustand.

Example:
```tsx
import { useAuthStore } from '@/store/authStore';

const { user, login } = useAuthStore();
```

For persistent secure storage (like auth tokens), we use `expo-secure-store`.

## API Handling

API communication is managed using **[Axios](https://axios-http.com/)**.

- **Client Configuration:** The base Axios instance is configured in `src/api/client.ts`. It includes base URLs, timeout settings, and interceptors for adding auth tokens to headers or handling global errors.
- **API Modules:** Endpoints are grouped by feature in the `src/api/` directory (e.g., `auth.ts`, `product.ts`, `dashboard.ts`).

Example:
```ts
// src/api/product.ts
import apiClient from './client';

export const getProducts = async () => {
  const response = await apiClient.get('/products');
  return response.data;
};
```

## Running the Project

1. **Install dependencies:**
   ```bash
   npm install
   ```
   *(Note: Use `npx expo install <package>` when adding new Expo-compatible packages to resolve compatible versions).*

2. **Start the development server:**
   ```bash
   npx expo start
   ```
   This will start the Expo Metro bundler. You can press `a` to open the Android emulator, `i` to open the iOS simulator, or scan the QR code with the Expo Go app.

3. **Run on specific platforms:**
   ```bash
   npm run android  # Runs on Android emulator/device
   npm run ios      # Runs on iOS simulator/device
   ```

## Building the Project

We recommend using **[EAS Build](https://docs.expo.dev/eas/)** for cloud builds.

### Building via EAS (Cloud)
```bash
eas build -p android --profile production
```

### Building the APK locally using Gradle

If you need to build the `.apk` file locally (without EAS), you can use the standard Android build tools via Gradle since the `android/` directory is generated.

1. **Generate the native `android` folder** (if not already present):
   ```bash
   npx expo prebuild -p android
   ```
2. **Navigate to the android directory and build:**
   ```bash
   cd android
   ./gradlew assembleRelease
   ```
   The built APK will be located in `android/app/build/outputs/apk/release/app-release.apk`.
