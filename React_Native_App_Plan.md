# React Native Expo POS Mobile App Implementation Plan

This document outlines the step-by-step implementation plan for building a React Native Expo mobile application that interfaces with your Ultimate POS backend via the `Modules\Connector` API.

## User Review Required
> [!IMPORTANT]
> Please review this architectural plan carefully. Once you approve, you can use these steps as a master guide for your new mobile app project.

## Open Questions
> [!NOTE]
> 1. Will you be using **Expo Router** (file-based routing, standard in newer Expo versions) or standard **React Navigation**? Answer: Expo router.
> 2. What state management library do you prefer? Answer: Zustand.*
> 3. Do you have a preferred styling solution? Answer: React native stylesheet.*

---

## Phase 1: Project Initialization & Clean Up
The first step is to bootstrap the application, strip out the boilerplate, and set up a visible, clean starting point.

### 1. Initialize the Expo App
Run the following command in your terminal (in the folder where you want your new project to live):
```bash
npx create-expo-app@latest ultimate-pos-mobile
```
*Note: This uses the latest Expo version and typically defaults to using Expo Router.*

### 2. Clean Up Example Code
- Navigate into your new project: `cd ultimate-pos-mobile`
- If using Expo Router, navigate to the `app/` directory and remove all existing boilerplate files (`index.tsx`, `_layout.tsx`, `(tabs)`, etc.).
- Create a minimal `app/_layout.tsx` and `app/index.tsx`.

### 3. Create a Visible Home Page
Create a simple `index.tsx` to verify the app is running:
```tsx
import { View, Text, StyleSheet } from 'react-native';

export default function Home() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ultimate POS Mobile</Text>
      <Text>Welcome to your new dashboard!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
});
```
Run `npx expo start` to test on an emulator or physical device via Expo Go.

---

## Phase 2: Core Architecture & API Setup

### 1. API Structure & The Connector Module
The `Connector` module provides RESTful endpoints prefixed with `/connector/api`.
- **Base URL:** `https://your-domain.com/connector/api`
- **Standard Response Format:** Most endpoints return a JSON structure containing a `data` array/object, and optionally `meta` and `links` for pagination.
- **Headers Required:** 
  - `Accept: application/json`
  - `Authorization: Bearer <your_token>`

### 2. Configure the API Client
Install Axios for handling HTTP requests: `npm install axios`
Create an Axios instance (`src/api/client.ts`) with interceptors to automatically attach the Auth token to every request and handle 401 (Unauthorized) errors globally by logging the user out.

---

## Phase 3: Authentication System

Authentication in the mobile app must mirror the React/Blade versions, utilizing token-based authentication (Laravel Passport/Sanctum).

### 1. Login Implementation (Oauth Token)
- **Endpoint:** The correct endpoint for logging in is **`/oauth/token`** (NOT `connector/api/login`). The API uses standard Laravel Passport for authentication.
- **Request Payload:** It requires a `POST` request with the following body (JSON or form-data):
  ```json
  {
    "grant_type": "password",
    "client_id": "YOUR_PASSPORT_CLIENT_ID",
    "client_secret": "YOUR_PASSPORT_CLIENT_SECRET",
    "username": "user@example.com",
    "password": "user_password"
  }
  ```
  *(Note: You can generate the Client ID and Secret by running `php artisan passport:install` on your server).*
- **UI:** Create a Login screen (`app/auth/login.tsx`) with Username/Email and Password fields.
- **Storage:** Upon success, extract the `access_token` from the response and store it securely using `expo-secure-store` (never use standard `AsyncStorage` for auth tokens).

### 2. Fetching User Profile & Permissions
Once the token is acquired, make a GET request to `/connector/api/user/loggedin`.
- **Response Handling:** This endpoint returns the authenticated user's details, including their roles and assigned permissions.
- **State Management:** Store this user object and their permissions in your global state (e.g., Zustand).

### 3. Routing Protection
Set up a navigation guard in `app/_layout.tsx`. If the global state does not contain a valid token, redirect the user to the Login screen. If they are authenticated, allow access to the main app dashboard.

---

## Phase 4: Permissions and Access Control

In Ultimate POS, actions and visibility are dictated by permissions (e.g., `product.view`, `sell.create`).

### 1. Permission Utility
Create a utility function `can(permissionName)` that checks if the requested permission exists in the user's permission array (stored in global state).

### 2. Conditional UI Rendering
Wrap sensitive UI components or navigation links based on permissions.
```tsx
{can('product.view') && (
  <Button title="View Products" onPress={() => router.push('/products')} />
)}
```
If a user lacks permission, simply hide the button or display an "Access Denied" fallback.

---@

## Phase 5: Implementing Basic Features

With the foundation built, we can connect the specific POS features using the Connector module.

### 1. Dashboard (Reports)
- **Endpoint:** GET `/connector/api/business-details` and GET `/connector/api/profit-loss-report`.
- **Implementation:** Create widgets on the Home screen to display total sales, expenses, and profit for the day/month using the data from these endpoints.

### 2. Product Catalog
- **Endpoint:** GET `/connector/api/product`
- **Implementation:** Build a `ProductList` screen using React Native's `FlatList`. Implement pagination (handling the `meta.current_page` and `meta.last_page` from the API). Add a search bar that passes a search query parameter to the API.

- **Query Parameters (Filtering & Searching):**
  - `name`: String to search for in the product name.
  - `sku`: String to search for in the product SKU.
  - `category_id`: Comma-separated category IDs to filter by (e.g., `1,2`).
  - `sub_category_id`: Comma-separated sub-category IDs to filter by.
  - `brand_id`: Comma-separated brand IDs to filter by (e.g., `3,4`).
  - `location_id`: Integer ID to filter products available at a specific location.
  - `order_by`: Field to sort by (e.g., `product_name`, `newest`).
  - `


### 3. Categories & Brands
- **Endpoints:** GET `/connector/api/taxonomy` (Categories) and GET `/connector/api/brand`.
- **Implementation:** These can be used as filter dropdowns on the Product list page, allowing users to browse products by specific brands or categories.

---

## Verification & Next Steps
Once this plan is approved, you can take these steps to your new separate project folder and begin executing Phase 1. As you progress, you will map out the specific data types required for your state and UI components based directly on the JSON responses you observe from your Laravel backend.
