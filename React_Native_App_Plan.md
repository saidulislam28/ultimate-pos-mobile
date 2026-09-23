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
Create a utility function `hasPermission(permissionName)` that checks if the requested permission exists in the user's permission array (stored in global state).

### 2. Conditional UI Rendering
Wrap sensitive UI components or navigation links based on permissions.
```tsx
{hasPermission('product.view') && (
  <Button title="View Products" onPress={() => router.push('/products')} />
)}
```
If a user lacks permission, simply hide the button or display an "Access Denied" fallback.

---

## Phase 5: Implementing Basic Features

With the foundation built, we can connect the specific POS features using the Connector module.

### 1. Dashboard (Reports)
- **Endpoint:** GET `/connector/api/business-details` and GET `/connector/api/profit-loss-report`.
- **Implementation:** Create widgets on the Home screen to display total sales, expenses, and profit for the day/month using the data from these endpoints.

### 2. Product Catalog
- **Endpoint:** GET `/connector/api/product`
- **Query Parameters (Filtering & Searching):**
  - `name`: String to search for in the product name.
  - `sku`: String to search for in the product SKU.
  - `category_id`: Comma-separated category IDs to filter by (e.g., `1,2`).
  - `sub_category_id`: Comma-separated sub-category IDs to filter by.
  - `brand_id`: Comma-separated brand IDs to filter by (e.g., `3,4`).
  - `location_id`: Integer ID to filter products available at a specific location.
  - `order_by`: Field to sort by (e.g., `product_name`, `newest`).
  - `order_direction`: Sort direction (`asc` or `desc`).
  - `per_page`: Number of records per page (default is usually 10, use `-1` for no pagination).
- **Implementation:** Build a `ProductList` screen using React Native's `FlatList`. Implement pagination (handling the `meta.current_page` and `meta.last_page` from the API). Add a search bar that passes the `name` search query parameter to the API, and a filter modal that can pass `brand_id` and `category_id`.
### 3. Categories & Brands
- **Endpoints:** GET `/connector/api/taxonomy` (Categories) and GET `/connector/api/brand`.
- **Implementation:** These can be used as filter dropdowns on the Product list page, allowing users to browse products by specific brands or categories.

---

## Verification & Next Steps
Once this plan is approved, you can take these steps to your new separate project folder and begin executing Phase 1. As you progress, you will map out the specific data types required for your state and UI components based directly on the JSON responses you observe from your Laravel backend.

---

## Phase 6: Connector API Reference Documentation

Below is a comprehensive list of the available endpoints in the Connector API (`/connector/api/*`) based on the `api.php` routes. All endpoints require the `Authorization: Bearer <token>` header unless otherwise specified.

### 1. Core & Business Resources

| Endpoint | Method | Description | Parameters (Query/Body) |
|----------|--------|-------------|-------------------------|
| `/business-location` | GET | List business locations. | `per_page` (int) |
| `/business-location/{id}` | GET | Get a specific location. | `id` (path parameter) |
| `/unit` | GET | List all units. | `per_page` (int) |
| `/unit/{id}` | GET | Get a specific unit. | `id` (path param) |
| `/taxonomy` | GET | List categories. | `type` (string - e.g., 'product'), `per_page` (int) |
| `/taxonomy/{id}` | GET | Get a specific category. | `id` (path param) |
| `/brand` | GET | List brands. | `per_page` (int) |
| `/brand/{id}` | GET | Get a specific brand. | `id` (path param) |
| `/tax` | GET | List tax rates. | `per_page` (int) |
| `/tax/{id}` | GET | Get a specific tax rate. | `id` (path param) |
| `/table` | GET | List restaurant tables. | `location_id` (int), `per_page` (int) |
| `/types-of-service` | GET | List types of service. | `location_id` (int), `per_page` (int) |
| `/business-details` | GET | Get general business details. | None |
| `/get-location` | GET | Get a specific location based on context. | None |

### 2. Contacts (Customers & Suppliers)

| Endpoint | Method | Description | Parameters (Query/Body) |
|----------|--------|-------------|-------------------------|
| `/contactapi` | GET | List contacts. | `type` ('customer', 'supplier'), `name` (string), `per_page` (int) |
| `/contactapi/{id}` | GET | Get a specific contact. | `id` (path param) |
| `/contactapi` | POST | Create a new contact. | `type`, `name`, `mobile`, `email`, `city`, `state`, etc. |
| `/contactapi/{id}` | PUT | Update an existing contact. | `id` (path param), `name`, `mobile`, etc. |
| `/contactapi-payment` | POST | Make a payment for a contact. | `contact_id`, `amount`, `payment_method`, etc. |
| `/new_contactapi` | GET | Get required data to create a contact. | None |

### 3. Products & Stock

| Endpoint | Method | Description | Parameters (Query/Body) |
|----------|--------|-------------|-------------------------|
| `/product` | GET | List products. | `name`, `category_id`, `brand_id`, `location_id`, `per_page` |
| `/product/{id}` | GET | Get a specific product. | `id` (path param) |
| `/selling-price-group` | GET | List selling price groups. | None |
| `/variation/{id?}` | GET | List variations for a product. | `id` (path param - product id) |
| `/product-stock-report` | GET | Get product stock report. | `location_id`, `category_id`, `brand_id` |
| `/new_product` | GET | Get necessary data to create a product. | None |

### 4. Sales & POS

| Endpoint | Method | Description | Parameters (Query/Body) |
|----------|--------|-------------|-------------------------|
| `/sell` | GET | List sales. | `location_id`, `contact_id`, `payment_status`, `start_date`, `end_date` |
| `/sell/{id}` | GET | Get a specific sale details. | `id` (path param) |
| `/sell` | POST | Create a new sale (POS checkout). | `location_id`, `contact_id`, `products` (array), `payments` (array) |
| `/sell/{id}` | PUT | Update a sale. | `id` (path param), sale payload |
| `/sell/{id}` | DELETE | Delete a sale. | `id` (path param) |
| `/sell-return` | POST | Add a sell return. | `transaction_id`, `products` (array with return qty) |
| `/list-sell-return` | GET | List all sell returns. | `location_id`, `start_date`, `end_date` |
| `/update-shipping-status` | POST | Update shipping status of a sale. | `transaction_id`, `shipping_status` |
| `/new_sell` | GET | Get data required for a new sale. | None |

### 5. Expenses

| Endpoint | Method | Description | Parameters (Query/Body) |
|----------|--------|-------------|-------------------------|
| `/expense` | GET | List expenses. | `location_id`, `expense_category_id`, `start_date`, `end_date` |
| `/expense/{id}` | GET | Get a specific expense. | `id` (path param) |
| `/expense` | POST | Create an expense. | `location_id`, `expense_category_id`, `final_total`, `payment` |
| `/expense/{id}` | PUT | Update an expense. | `id` (path param), expense payload |
| `/expense-refund` | GET | List expense refunds. | `location_id`, `start_date`, `end_date` |
| `/expense-categories` | GET | List expense categories. | None |

### 6. Users & Authentication

| Endpoint | Method | Description | Parameters (Query/Body) |
|----------|--------|-------------|-------------------------|
| `/user/loggedin` | GET | Get the logged-in user profile. | None |
| `/user-registration` | POST | Register a new user. | `first_name`, `email`, `password`, etc. |
| `/user` | GET | List users. | `per_page` (int) |
| `/user/{id}` | GET | Get a specific user details. | `id` (path param) |
| `/update-password` | POST | Update user password. | `current_password`, `new_password` |
| `/forget-password` | POST | Request password reset. | `email` |

### 7. Registers & Payments

| Endpoint | Method | Description | Parameters (Query/Body) |
|----------|--------|-------------|-------------------------|
| `/cash-register` | GET | List cash registers. | `status` ('open', 'close') |
| `/cash-register/{id}` | GET | Get cash register details. | `id` (path param) |
| `/cash-register` | POST | Open a cash register. | `amount` (initial float) |
| `/cash-register/{id}` | PUT | Close a cash register. | `id`, `closing_amount`, `closing_note` |
| `/payment-accounts` | GET | List payment accounts. | `location_id` |
| `/payment-methods` | GET | List available payment methods. | None |

### 8. Reports & Dashboard

| Endpoint | Method | Description | Parameters (Query/Body) |
|----------|--------|-------------|-------------------------|
| `/profit-loss-report` | GET | Get profit and loss data. | `location_id`, `start_date`, `end_date` |
| `/notifications` | GET | Get user notifications. | `page` (int) |

### 9. Subscription (Superadmin)

| Endpoint | Method | Description | Parameters (Query/Body) |
|----------|--------|-------------|-------------------------|
| `/active-subscription`| GET | Get active SaaS subscription. | None |
| `/packages` | GET | List available SaaS packages. | None |

### 10. HR & Attendance

| Endpoint | Method | Description | Parameters (Query/Body) |
|----------|--------|-------------|-------------------------|
| `/get-attendance/{user_id}`| GET | Get attendance for a user. | `user_id` (path param), `month`, `year` |
| `/clock-in` | POST | Clock in user. | `ip_address`, `note` |
| `/clock-out` | POST | Clock out user. | `ip_address`, `note` |
| `/holidays` | GET | List company holidays. | `year` |

### 11. CRM (Customer Relationship Management)

| Endpoint | Method | Description | Parameters (Query/Body) |
|----------|--------|-------------|-------------------------|
| `/crm/follow-ups` | GET/POST/PUT | Manage CRM follow-ups. | `contact_id`, `status`, `start_datetime`, `end_datetime` |
| `/crm/follow-up-resources` | GET | Get data to create a follow-up. | None |
| `/crm/leads` | GET | List CRM leads. | `source`, `life_stage` |
| `/crm/call-logs` | POST | Save call logs. | `contact_id`, `call_duration`, `call_type` |

### 12. Field Force

| Endpoint | Method | Description | Parameters (Query/Body) |
|----------|--------|-------------|-------------------------|
| `/field-force` | GET | List field force visits/tasks. | `user_id`, `date` |
| `/field-force/create` | POST | Create a field force task. | `user_id`, `contact_id`, `visit_date`, `reason` |
| `/field-force/update-visit-status/{id}` | POST | Update status of a visit. | `id` (path param), `status`, `note` |
