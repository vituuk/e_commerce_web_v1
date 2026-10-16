# Cart Module

Shopping cart for logged-in users. Each user has **one cart**, and the cart holds many **items**. Each item is a product variant plus a quantity.

---

## 1. Why two tables (`Cart` + `CartItem`)

A cart holds many products, and each product has its own quantity. The data is split by what it describes:

| Table | One row per | Holds |
|---|---|---|
| `Carts` | user | data about the **whole cart** (owner; later: coupon, status…) |
| `CartItems` | product variant in a cart | data about **one line** (variant, quantity) |

```
Carts                     CartItems
id | userId               id | cartId | variantId | quantity
1  |   5        1 ──<     1  |   1    |    10     |    2
                          2  |   1    |    12     |    1
```

Benefits:
- **No duplicated data.** Cart-level fields are stored once, not repeated on every product row.
- **Easy to extend.** Fields like `coupon_code` or `status` can be added to `Carts` without touching items.
- **Matches checkout.** `Cart` + `CartItem` maps directly to `Order` + `OrderItem`.
- **Integrity.** The unique index `(cartId, variantId)` means the same variant can't appear twice in a cart.

This is the same pattern as `Product` → `ProductVariant`.

---

## 2. Database schema

### `Carts`
| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK | auto increment |
| userId | INTEGER | **unique**, FK → `Users.id`, `ON DELETE CASCADE` |
| createdAt / updatedAt | DATE | |

### `CartItems`
| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK | auto increment |
| cartId | INTEGER | FK → `Carts.id`, `ON DELETE CASCADE` |
| variantId | INTEGER | FK → `ProductVariants.id`, `ON DELETE CASCADE` |
| quantity | INTEGER | default `1`, must be ≥ 1 |
| createdAt / updatedAt | DATE | |

Unique index: `cart_items_cart_variant_unique (cartId, variantId)`

### Associations
```
User         1 ── 1  Cart
Cart         1 ── N  CartItem   (as "items")
CartItem     N ── 1  ProductVariant (as "variant")
ProductVariant N ── 1 Product   (as "product")
```

---

## 3. Files

| Layer | File |
|---|---|
| Model | `models/cart.js`, `models/cartitem.js` |
| Migration | `migrations/20261016013833-create-cart.js`, `migrations/20261016014000-create-cart-item.js` |
| Service | `src/services/cart.service.js` |
| Controller | `src/controllers/cart.controller.js` |
| Route | `src/routes/cart.js` (mounted at `/cart` in `index.js`) |

Flow: **Route → Controller → Service → Model**
- **Route**: applies `authenticate` to every cart endpoint.
- **Controller**: reads `req.user.id`, `req.params` and `req.body`, then sends the response. Errors go through `handleError`.
- **Service**: business rules. Throws `AppError(status, message)` on failure.

---

## 4. Business rules

1. **Cart is created automatically.** The first time a user calls any cart endpoint, a cart is created for them (`findOrCreate`).
2. **The owner comes from the JWT** (`req.user.id`), never from the body. A user can only see and change their own cart.
3. **Adding an existing variant** increases its quantity instead of adding a new row.
4. **Stock check.** The requested total quantity can't be more than `variant.stock_qty`.
5. **Inactive variants** (`is_active = false`) can't be added. The API returns 404.
6. **Price.** `unit_price` is `variant.price`, or `product.base_price` if the variant price is `null`.
   - `line_total = unit_price × quantity`
   - `total_price = sum of line_total`
7. **Clearing the cart** deletes all its items. The cart row itself is kept.

---

## 5. API

All endpoints need this header:
```
Authorization: Bearer <token>
```

### GET `/cart`
Get the current user's cart.

**200**
```json
{
  "message": "Cart",
  "data": {
    "id": 1,
    "userId": 5,
    "items": [
      {
        "id": 1,
        "cartId": 1,
        "variantId": 10,
        "quantity": 2,
        "variant": {
          "id": 10, "sku": "TS-RED-M", "color": "red", "size": "M",
          "price": null, "stock_qty": 20, "is_active": true,
          "product": { "id": 1, "name": "T-Shirt", "slug": "t-shirt", "base_price": "15.00" }
        },
        "unit_price": 15,
        "line_total": 30
      }
    ],
    "total_qty": 2,
    "total_price": 30
  }
}
```

### POST `/cart/items`
Add a variant to the cart. If it's already in the cart, its quantity goes up.

**Body**
```json
{ "variantId": 10, "quantity": 2 }
```
`quantity` is optional (default `1`).

**201** `{ "message": "Item added to cart", "data": <cart> }`

### PUT `/cart/items/:id`
Set the quantity of one cart item. `:id` is the **CartItem id**, not the variant id.

**Body**
```json
{ "quantity": 3 }
```
**200** `{ "message": "Cart item updated", "data": <cart> }`

### DELETE `/cart/items/:id`
Remove one item from the cart.

**200** `{ "message": "Cart item removed", "data": <cart> }`

### DELETE `/cart`
Remove all items from the cart.

**200** `{ "message": "Cart cleared", "data": <cart> }`

> Every write endpoint returns the **full updated cart**, so the frontend doesn't need a separate GET.

---

## 6. Errors

| Status | Message | When |
|---|---|---|
| 400 | `variantId is required` | POST without `variantId` |
| 400 | `quantity must be an integer >= 1` | quantity is 0, negative or not an integer |
| 400 | `Only N left in stock` | requested quantity > `stock_qty` |
| 401 | `Unauthorized` | missing or invalid token |
| 404 | `Variant not found` | variant doesn't exist or is inactive |
| 404 | `Cart item not found` | item id doesn't exist or belongs to another user's cart |
| 500 | `<Action> failed` | unexpected error (logged on the server) |

---

## 7. Setup

```bash
npx.cmd sequelize-cli db:migrate
npm start
```

## 8. Quick test (curl)

```bash
# add
curl -X POST http://localhost:3000/cart/items -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" -d "{\"variantId\":1,\"quantity\":2}"
# view
curl http://localhost:3000/cart -H "Authorization: Bearer TOKEN"
# update qty
curl -X PUT http://localhost:3000/cart/items/1 -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" -d "{\"quantity\":5}"
# remove item
curl -X DELETE http://localhost:3000/cart/items/1 -H "Authorization: Bearer TOKEN"
# clear
curl -X DELETE http://localhost:3000/cart -H "Authorization: Bearer TOKEN"
```

---

## 9. Possible next steps
- Checkout: turn `Cart` + `CartItems` into `Order` + `OrderItems`, reduce stock, then clear the cart.
- Add the cart endpoints to `src/swagger.js`.
- Guest carts (stored on the client, merged into the user's cart at login).
