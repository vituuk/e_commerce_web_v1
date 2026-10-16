# Architecture: Route → Controller → Service

This project splits each feature into **3 layers**. Every layer has one job.

```
HTTP request
   │
   ▼
┌──────────────┐   which URL? who is allowed?
│   ROUTE      │   src/routes/<feature>.js
└──────┬───────┘
       ▼
┌──────────────┐   read req → call service → send res + status
│  CONTROLLER  │   src/controllers/<feature>.controller.js
└──────┬───────┘
       ▼
┌──────────────┐   validation, business rules, database (Sequelize)
│   SERVICE    │   src/services/<feature>.service.js
└──────┬───────┘
       ▼
   models/ (Sequelize) → PostgreSQL
```

## Folder structure

```
admin/
├─ index.js                      mounts routes: app.use("/path", require("./src/routes/..."))
├─ models/                       Sequelize models + associations
├─ migrations/                   DB table changes
└─ src/
   ├─ routes/                    URL + middleware only
   ├─ controllers/               req/res only
   ├─ services/                  logic + DB only
   ├─ middleware/                authenticate, authorize, upload
   └─ util/
      └─ app-error.js            error with HTTP status
```

## Rules for each layer

| Layer | ✅ Does | ❌ Never |
|---|---|---|
| **Route** | Define URL + method, attach middleware (`authenticate`, `authorize("admin")`, `handleUpload`), point to a controller function | Query the DB, contain logic, use `res.json` |
| **Controller** | Read `req.params` / `req.body` / `req.user` / `req.file`, call the service, send `res.status(...).json(...)`, convert errors to responses | Import models, write queries, contain business rules |
| **Service** | Validate input, apply business rules, query models, throw `AppError` | Use `req` / `res`, know about HTTP or Express |

> Simple test: if you could call the service from a script or a cron job (no server running), it is written correctly.

## AppError: how errors travel

`src/util/app-error.js`

```js
class AppError extends Error{
    constructor(status,message){
        super(message);
        this.status=status;
    }
}
```

- **Service** throws it when something is wrong for the user:
  ```js
  if(!product) throw new AppError(404,"Product not found");
  ```
- **Controller** catches it:
  - has `error.status` → send that status + message (400 / 404 / 409 …)
  - no status (real bug, DB down) → log it, send **500** with a generic message

| Status | Use when |
|---|---|
| 400 | Invalid input (validation failed) |
| 401 | No / invalid token (middleware) |
| 403 | Wrong role (middleware) |
| 404 | Record not found |
| 409 | Duplicate (unique constraint) |
| 500 | Unexpected error (never thrown on purpose) |

## Example: Product Variant

### Route: `src/routes/product-variant.js`
```js
const router=express.Router({mergeParams:true}); // gets :productId from index.js mount

router.get("/",controller.list);                                          // public
router.get("/:id",controller.getOne);                                     // public
router.post("/",authenticate,authorize("admin"),controller.create);       // admin
router.put("/:id",authenticate,authorize("admin"),controller.update);     // admin
router.delete("/:id",authenticate,authorize("admin"),controller.remove);  // admin
```

### Controller: `src/controllers/product-variant.controller.js`
```js
const list=async(req,res)=>{
    try{
        const data=await variantService.listByProduct(req.params.productId);
        return res.status(200).json({message:"Product variants",data});
    }
    catch(error){
        return handleError(res,error,"Get product variants");
    }
};
```

### Service: `src/services/product-variant.service.js`
```js
const listByProduct=async(productId)=>{
    const product=await Product.findByPk(productId,{
        attributes:["id","name","slug","base_price"],
        include:[{model:ProductVariant,as:"variants",attributes:{exclude:["productId"]}}],
        order:[[{model:ProductVariant,as:"variants"},"id","ASC"]]
    });
    if(!product) throw new AppError(404,"Product not found");

    const data=product.toJSON();
    data.variants=product.variants.map(v=>withFinalPrice(v,product.base_price));
    return data;
};
```

### Request flow: `GET /product/1/variants`
1. `index.js` matches `/product/:productId/variants` → variant router
2. Route matches `GET /` → `controller.list`
3. Controller reads `req.params.productId = "1"` → `variantService.listByProduct("1")`
4. Service queries DB
   - found → returns data → controller sends **200**
   - not found → throws `AppError(404)` → controller sends **404**

## How to add / convert a feature

Example: converting `category`.

1. **Create the service** `src/services/category.service.js`
   - move all `Category.findAll / create / ...` code here
   - replace `return res.status(404).json(...)` with `throw new AppError(404,"...")`
   - return plain data
2. **Create the controller** `src/controllers/category.controller.js`
   - one function per endpoint: `list, getOne, create, update, remove`
   - each: `try { call service; res.status(...).json(...) } catch { handleError(...) }`
3. **Slim the route** `src/routes/category.js`
   - keep only `router.<method>(path, middleware..., controller.fn)`
4. `index.js` does **not** change (same route file path).
5. Test in Swagger: responses must be identical to before.

## Naming conventions

| Item | Pattern | Example |
|---|---|---|
| Route file | `<feature>.js` | `product-variant.js` |
| Controller file | `<feature>.controller.js` | `product-variant.controller.js` |
| Service file | `<feature>.service.js` | `product-variant.service.js` |
| Controller functions | `list`, `getOne`, `create`, `update`, `remove` | `controller.list` |
| Service functions | describe the action | `listByProduct`, `getOne`, `create` |

> `remove` is used instead of `delete` because `delete` is a reserved word in JavaScript.

## Migration status

| Feature | Layered? |
|---|---|
| product-variant | ✅ |
| product-image | ⬜ |
| product | ⬜ |
| category | ⬜ |
| auth | ⬜ |
| user-profile | ⬜ |
