const PORT = process.env.PORT || 3000;

module.exports = {
  openapi: "3.0.0",
  info: {
    title: "Mini Ecommerce Admin API",
    version: "1.0.0",
    description: "API documentation for testing the admin service",
  },
  servers: [{ url: `http://localhost:${PORT}` }],
  paths: {
    "/testing": {
      get: {
        tags: ["Health"],
        summary: "Test that the server is running",
        responses: {
          200: { description: "Server is running" },
        },
      },
    },
    // ================= CATEGORY =================
    "/category": {
      get: {
        tags: ["Category"],
        summary: "List categories (public)",
        responses: {
          200: {
            description: "List of categories",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Get categories successfully" },
                    data: { type: "array", items: { $ref: "#/components/schemas/Category" } },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Category"],
        summary: "Create category (admin token required)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CategoryInput" } } },
        },
        responses: {
          201: { description: "Category created" },
          400: { description: "name and slug are required" },
          401: { description: "Missing or invalid token" },
          403: { description: "Forbidden: insufficient role" },
          409: { description: "Slug already used" },
        },
      },
    },
    "/category/{id}": {
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" }, example: 1 }],
      get: {
        tags: ["Category"],
        summary: "Get one category with its products (public)",
        responses: {
          200: {
            description: "Category",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Get category successfully" },
                    data: { $ref: "#/components/schemas/CategoryDetail" },
                  },
                },
              },
            },
          },
          404: { description: "Category not found" },
        },
      },
      put: {
        tags: ["Category"],
        summary: "Update category (admin token required, send only fields to change)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CategoryInput" } } },
        },
        responses: {
          200: { description: "Category updated" },
          401: { description: "Missing or invalid token" },
          403: { description: "Forbidden: insufficient role" },
          404: { description: "Category not found" },
          409: { description: "Slug already used" },
        },
      },
      delete: {
        tags: ["Category"],
        summary: "Delete category (admin token required; its products become uncategorized)",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Category deleted" },
          401: { description: "Missing or invalid token" },
          403: { description: "Forbidden: insufficient role" },
          404: { description: "Category not found" },
        },
      },
    },

    // ================= PRODUCT =================
    "/product": {
      get: {
        tags: ["Product"],
        summary: "List products with their category (public)",
        parameters: [
          { name: "categoryId", in: "query", required: false, schema: { type: "integer" }, description: "Filter by category" },
        ],
        responses: {
          200: {
            description: "List of products",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Get products successfully" },
                    data: { type: "array", items: { $ref: "#/components/schemas/Product" } },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Product"],
        summary: "Create product (admin token required)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/ProductInput" } } },
        },
        responses: {
          201: { description: "Product created" },
          400: { description: "name and slug are required / invalid base_price / Category not found" },
          401: { description: "Missing or invalid token" },
          403: { description: "Forbidden: insufficient role" },
          409: { description: "Slug already used" },
        },
      },
    },
    "/product/{id}": {
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" }, example: 1 }],
      get: {
        tags: ["Product"],
        summary: "Get one product with its category (public)",
        responses: {
          200: {
            description: "Product",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Get product successfully" },
                    data: { $ref: "#/components/schemas/Product" },
                  },
                },
              },
            },
          },
          404: { description: "Product not found" },
        },
      },
      put: {
        tags: ["Product"],
        summary: "Update product (admin token required, send only fields to change)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/ProductInput" } } },
        },
        responses: {
          200: { description: "Product updated" },
          400: { description: "Invalid base_price / Category not found" },
          401: { description: "Missing or invalid token" },
          403: { description: "Forbidden: insufficient role" },
          404: { description: "Product not found" },
          409: { description: "Slug already used" },
        },
      },
      delete: {
        tags: ["Product"],
        summary: "Delete product (admin token required)",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Product deleted" },
          401: { description: "Missing or invalid token" },
          403: { description: "Forbidden: insufficient role" },
          404: { description: "Product not found" },
        },
      },
    },
    // ================= PRODUCT IMAGE =================
    "/product/{productId}/images": {
      parameters: [{ name: "productId", in: "path", required: true, schema: { type: "integer" }, example: 1 }],
      get: {
        tags: ["Product Image"],
        summary: "List images of a product (public)",
        responses: {
          200: {
            description: "Product with its images",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Product images" },
                    data: { $ref: "#/components/schemas/ProductWithImages" },
                  },
                },
              },
            },
          },
          404: { description: "Product not found" },
        },
      },
      post: {
        tags: ["Product Image"],
        summary: "Add image to product (admin token required; first image becomes primary)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "multipart/form-data": { schema: { $ref: "#/components/schemas/ProductImageUpload" } } },
        },
        responses: {
          201: { description: "Image created" },
          400: { description: "image file is required / not an image / larger than 5MB" },
          401: { description: "Missing or invalid token" },
          403: { description: "Forbidden: insufficient role" },
          404: { description: "Product not found" },
        },
      },
    },
    "/product/{productId}/images/{id}": {
      parameters: [
        { name: "productId", in: "path", required: true, schema: { type: "integer" }, example: 1 },
        { name: "id", in: "path", required: true, schema: { type: "integer" }, example: 1 },
      ],
      get: {
        tags: ["Product Image"],
        summary: "Get one image with its product (public)",
        responses: {
          200: {
            description: "Product image",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Product image" },
                    data: { $ref: "#/components/schemas/ProductImageDetail" },
                  },
                },
              },
            },
          },
          404: { description: "Image not found" },
        },
      },
      put: {
        tags: ["Product Image"],
        summary: "Update image (admin token required; is_primary=true unsets others)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: false,
          content: { "multipart/form-data": { schema: { $ref: "#/components/schemas/ProductImageUploadOptional" } } },
        },
        responses: {
          200: { description: "Image updated (old file removed if replaced)" },
          400: { description: "not an image / larger than 5MB" },
          401: { description: "Missing or invalid token" },
          403: { description: "Forbidden: insufficient role" },
          404: { description: "Image not found" },
        },
      },
      delete: {
        tags: ["Product Image"],
        summary: "Delete image (admin token required; next image promoted if primary removed)",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Image deleted" },
          401: { description: "Missing or invalid token" },
          403: { description: "Forbidden: insufficient role" },
          404: { description: "Image not found" },
        },
      },
    },
    // ================= PRODUCT VARIANT =================
    "/product/{productId}/variants": {
      parameters: [{ name: "productId", in: "path", required: true, schema: { type: "integer" }, example: 1 }],
      get: {
        tags: ["Product Variant"],
        summary: "List variants of a product (public)",
        responses: {
          200: {
            description: "Product with its variants",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Product variants" },
                    data: { $ref: "#/components/schemas/ProductWithVariants" },
                  },
                },
              },
            },
          },
          404: { description: "Product not found" },
        },
      },
      post: {
        tags: ["Product Variant"],
        summary: "Create variant (admin token required)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/ProductVariantInput" } } },
        },
        responses: {
          201: { description: "Variant created" },
          400: { description: "sku is required / invalid price / invalid stock_qty" },
          401: { description: "Missing or invalid token" },
          403: { description: "Forbidden: insufficient role" },
          404: { description: "Product not found" },
          409: { description: "SKU already used, or same color + size already exists" },
        },
      },
    },
    "/product/{productId}/variants/{id}": {
      parameters: [
        { name: "productId", in: "path", required: true, schema: { type: "integer" }, example: 1 },
        { name: "id", in: "path", required: true, schema: { type: "integer" }, example: 1 },
      ],
      get: {
        tags: ["Product Variant"],
        summary: "Get one variant with its product (public)",
        responses: {
          200: {
            description: "Product variant",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Product variant" },
                    data: { $ref: "#/components/schemas/ProductVariantDetail" },
                  },
                },
              },
            },
          },
          404: { description: "Variant not found" },
        },
      },
      put: {
        tags: ["Product Variant"],
        summary: "Update variant (admin token required, send only fields to change)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ProductVariantInput" },
              example: { stock_qty: 25, price: 1049.99 },
            },
          },
        },
        responses: {
          200: { description: "Variant updated" },
          400: { description: "Invalid price / stock_qty / is_active" },
          401: { description: "Missing or invalid token" },
          403: { description: "Forbidden: insufficient role" },
          404: { description: "Variant not found" },
          409: { description: "SKU already used, or same color + size already exists" },
        },
      },
      delete: {
        tags: ["Product Variant"],
        summary: "Delete variant (admin token required)",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Variant deleted" },
          401: { description: "Missing or invalid token" },
          403: { description: "Forbidden: insufficient role" },
          404: { description: "Variant not found" },
        },
      },
    },
    // ================= CART =================
    "/cart": {
      get: {
        tags: ["Cart"],
        summary: "Get my cart (any logged-in token; cart auto-created)",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { $ref: "#/components/responses/CartResponse" },
          401: { description: "Missing or invalid token" },
        },
      },
      delete: {
        tags: ["Cart"],
        summary: "Clear my cart (removes all items)",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { $ref: "#/components/responses/CartResponse" },
          401: { description: "Missing or invalid token" },
        },
      },
    },
    "/cart/items": {
      post: {
        tags: ["Cart"],
        summary: "Add variant to my cart (quantity is added if already in cart)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CartItemInput" } } },
        },
        responses: {
          201: { $ref: "#/components/responses/CartResponse" },
          400: { description: "variantId is required / invalid quantity / Only N left in stock" },
          401: { description: "Missing or invalid token" },
          404: { description: "Variant not found (or inactive)" },
        },
      },
    },
    "/cart/items/{id}": {
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" }, example: 1, description: "CartItem id (not variant id)" }],
      put: {
        tags: ["Cart"],
        summary: "Set quantity of a cart item",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CartItemQuantityInput" } } },
        },
        responses: {
          200: { $ref: "#/components/responses/CartResponse" },
          400: { description: "invalid quantity / Only N left in stock" },
          401: { description: "Missing or invalid token" },
          404: { description: "Cart item not found / Variant not found" },
        },
      },
      delete: {
        tags: ["Cart"],
        summary: "Remove an item from my cart",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { $ref: "#/components/responses/CartResponse" },
          401: { description: "Missing or invalid token" },
          404: { description: "Cart item not found" },
        },
      },
    },
    // ================= USER =================
    "/auth/user/register": {
      post: {
        tags: ["User"],
        summary: "Register a normal user (role: user)",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/RegisterInput" } } },
        },
        responses: {
          201: { description: "User registered" },
          400: { description: "Email and password are required" },
          409: { description: "Email already registered" },
        },
      },
    },
    "/auth/user/login": {
      post: {
        tags: ["User"],
        summary: "User login: returns token",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/LoginInput" } } },
        },
        responses: {
          200: { $ref: "#/components/responses/LoginSuccess" },
          401: { description: "Invalid password" },
          404: { description: "Email user not found" },
        },
      },
    },
    "/auth/me": {
      get: {
        tags: ["User"],
        summary: "My profile (any logged-in token: user or admin)",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Decoded token payload" },
          401: { description: "Missing or invalid token" },
        },
      },
    },

    // ================= PROFILE =================
    "/auth/profile": {
      get: {
        tags: ["Profile"],
        summary: "Get my account + profile (any logged-in token)",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "User with profile (profile is null if not created yet)",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Profile" },
                    data: { $ref: "#/components/schemas/UserWithProfile" },
                  },
                },
              },
            },
          },
          401: { description: "Missing or invalid token" },
          404: { description: "User not found" },
        },
      },
      post: {
        tags: ["Profile"],
        summary: "Create my profile (only once; all fields optional)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/ProfileInput" } } },
        },
        responses: {
          201: { description: "Profile created" },
          400: { description: "Invalid phone or date_of_birth" },
          401: { description: "Missing or invalid token" },
          409: { description: "Profile already exists, use PUT to update" },
        },
      },
      put: {
        tags: ["Profile"],
        summary: "Update my existing profile (send only fields to change)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/ProfileInput" } } },
        },
        responses: {
          200: { description: "Profile updated" },
          400: { description: "Invalid phone or date_of_birth" },
          401: { description: "Missing or invalid token" },
          404: { description: "Profile not found, use POST to create" },
        },
      },
    },
    "/auth/profile/{userId}": {
      get: {
        tags: ["Profile"],
        summary: "Get any user's profile (admin token required)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "userId", in: "path", required: true, schema: { type: "integer" }, example: 5 },
        ],
        responses: {
          200: { description: "User with profile" },
          401: { description: "Missing or invalid token" },
          403: { description: "Forbidden: insufficient role" },
          404: { description: "User not found" },
        },
      },
    },

    // ================= ADMIN =================
    "/auth/admin/login": {
      post: {
        tags: ["Admin"],
        summary: "Admin login: only accounts with role admin",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginInput" },
              example: { email: "admin@gmail.com", password: "admin123" },
            },
          },
        },
        responses: {
          200: { $ref: "#/components/responses/LoginSuccess" },
          401: { description: "Invalid password" },
          403: { description: "This account is not admin" },
          404: { description: "Email user not found" },
        },
      },
    },
    "/auth/admin/register": {
      post: {
        tags: ["Admin"],
        summary: "Create a new admin (SUPERADMIN token required)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/AdminRegisterInput" } } },
        },
        responses: {
          201: { description: "Admin registered (roles from body, default: admin, user)" },
          400: { description: "Invalid role(s) or missing email/password" },
          401: { description: "Missing or invalid token" },
          403: { description: "Forbidden: insufficient role" },
          409: { description: "Email already registered" },
        },
      },
    },
    "/auth/getData": {
      get: {
        tags: ["Admin"],
        summary: "List all users with roles (admin token required)",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "List of users" },
          401: { description: "Missing or invalid token" },
          403: { description: "Forbidden: insufficient role" },
        },
      },
    },
  },
  components: {
    responses: {
      LoginSuccess: {
        description: "Login successful",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                message: { type: "string", example: "Login successful" },
                token: { type: "string", example: "eyJhbGciOiJIUzI1NiIs..." },
                roles: { type: "array", items: { type: "string" }, example: ["user"] },
              },
            },
          },
        },
      },
      CartResponse: {
        description: "Full cart after the operation",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                message: { type: "string", example: "Cart" },
                data: { $ref: "#/components/schemas/Cart" },
              },
            },
          },
        },
      },
    },
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
      ProfileInput: {
        type: "object",
        properties: {
          firstName: { type: "string", example: "Sala" },
          lastName: { type: "string", example: "User" },
          avatar: { type: "string", example: "https://example.com/avatar.png" },
          bio: { type: "string", example: "I love shopping" },
          phone: { type: "string", example: "012345678", description: "6-15 digits, optional leading +" },
          date_of_birth: { type: "string", format: "date", example: "2000-01-31" },
        },
      },
      UserProfile: {
        type: "object",
        nullable: true,
        properties: {
          id: { type: "integer", example: 1 },
          avatar: { type: "string", example: "https://example.com/avatar.png" },
          bio: { type: "string", example: "I love shopping" },
          phone: { type: "string", example: "012345678" },
          date_of_birth: { type: "string", format: "date-time" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      UserWithProfile: {
        type: "object",
        properties: {
          id: { type: "integer", example: 5 },
          firstName: { type: "string", example: "admin2" },
          lastName: { type: "string", example: "admin2" },
          email: { type: "string", example: "admin2@gmail.com" },
          status: { type: "boolean", example: true },
          profile: { $ref: "#/components/schemas/UserProfile" },
          Roles: {
            type: "array",
            items: {
              type: "object",
              properties: { code: { type: "string", example: "admin" }, name: { type: "string", example: "Admin" } },
            },
          },
        },
      },
      RegisterInput: {
        type: "object",
        required: ["email", "password"],
        properties: {
          firstName: { type: "string", example: "Sala" },
          lastName: { type: "string", example: "User" },
          email: { type: "string", example: "user@gmail.com" },
          password: { type: "string", example: "123456" },
          status: { type: "boolean", example: true },
        },
      },
      AdminRegisterInput: {
        type: "object",
        required: ["email", "password"],
        properties: {
          firstName: { type: "string", example: "admin2" },
          lastName: { type: "string", example: "admin2" },
          email: { type: "string", example: "admin2@gmail.com" },
          password: { type: "string", example: "123456789" },
          status: { type: "boolean", example: true },
          roles: {
            type: "array",
            items: { type: "string" },
            description: "Role codes to assign (optional, default: admin, user)",
            example: ["admin", "user"],
          },
        },
      },
      LoginInput: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", example: "admin@gmail.com" },
          password: { type: "string", example: "123456" },
        },
      },
      CategoryInput: {
        type: "object",
        required: ["name", "slug"],
        properties: {
          name: { type: "string", example: "Phones" },
          slug: { type: "string", example: "phones", description: "Unique, used in URLs" },
          is_active: { type: "boolean", example: true },
        },
      },
      CategorySummary: {
        type: "object",
        nullable: true,
        properties: {
          id: { type: "integer", example: 1 },
          name: { type: "string", example: "Phones" },
          slug: { type: "string", example: "phones" },
        },
      },
      Category: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          name: { type: "string", example: "Electronics" },
          slug: { type: "string", example: "electronics" },
          is_active: { type: "boolean", example: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      CategoryDetail: {
        allOf: [
          { $ref: "#/components/schemas/Category" },
          {
            type: "object",
            properties: {
              products: { type: "array", items: { $ref: "#/components/schemas/Product" } },
            },
          },
        ],
      },
      ProductInput: {
        type: "object",
        required: ["name", "slug"],
        properties: {
          categoryId: { type: "integer", nullable: true, example: 1 },
          name: { type: "string", example: "iPhone 15" },
          slug: { type: "string", example: "iphone-15", description: "Unique, used in URLs" },
          description: { type: "string", example: "Apple smartphone 128GB" },
          base_price: { type: "number", format: "decimal", example: 999.99 },
          is_active: { type: "boolean", example: true },
        },
      },
      Product: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          categoryId: { type: "integer", nullable: true, example: 1 },
          name: { type: "string", example: "iPhone 15" },
          slug: { type: "string", example: "iphone-15" },
          description: { type: "string", example: "Apple smartphone 128GB" },
          base_price: { type: "string", example: "999.99", description: "Postgres DECIMAL is returned as a string" },
          is_active: { type: "boolean", example: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
          category: { $ref: "#/components/schemas/CategorySummary" },
        },
      },
      ProductImageUpload: {
        type: "object",
        required: ["image"],
        properties: {
          image: { type: "string", format: "binary", description: "jpeg/png/webp/gif, max 5MB" },
          is_primary: { type: "boolean", example: false },
        },
      },
      ProductImageUploadOptional: {
        type: "object",
        properties: {
          image: { type: "string", format: "binary", description: "Optional new file, replaces the old one" },
          is_primary: { type: "boolean", example: false },
        },
      },
      ProductImage: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          productId: { type: "integer", example: 1 },
          url: { type: "string", example: "/uploads/products/product-1760514000000-123456789.png", description: "Open at http://localhost:3000 + url" },
          is_primary: { type: "boolean", example: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      ProductSummary: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          name: { type: "string", example: "iPhone 15" },
          slug: { type: "string", example: "iphone-15" },
        },
      },
      ProductWithImages: {
        allOf: [
          { $ref: "#/components/schemas/ProductSummary" },
          {
            type: "object",
            properties: {
              images: { type: "array", items: { $ref: "#/components/schemas/ProductImage" } },
            },
          },
        ],
      },
      ProductImageDetail: {
        allOf: [
          { $ref: "#/components/schemas/ProductImage" },
          { type: "object", properties: { product: { $ref: "#/components/schemas/ProductSummary" } } },
        ],
      },
      ProductVariantInput: {
        type: "object",
        required: ["sku"],
        properties: {
          sku: { type: "string", example: "IP15-BLK-128", description: "Unique across all variants" },
          color: { type: "string", example: "Black" },
          size: { type: "string", example: "128GB" },
          price: { type: "number", nullable: true, example: 999.99, description: "null = use product base_price" },
          stock_qty: { type: "integer", example: 10, description: "default 0" },
          is_active: { type: "boolean", example: true },
        },
      },
      ProductVariant: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          sku: { type: "string", example: "IP15-BLK-128" },
          color: { type: "string", nullable: true, example: "Black" },
          size: { type: "string", nullable: true, example: "128GB" },
          price: { type: "string", nullable: true, example: "999.99" },
          final_price: { type: "string", example: "999.99", description: "price, or product base_price when price is null" },
          stock_qty: { type: "integer", example: 10 },
          is_active: { type: "boolean", example: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      ProductWithVariants: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          name: { type: "string", example: "iPhone 15" },
          slug: { type: "string", example: "iphone-15" },
          base_price: { type: "string", example: "999.99" },
          variants: { type: "array", items: { $ref: "#/components/schemas/ProductVariant" } },
        },
      },
      ProductVariantDetail: {
        allOf: [
          { $ref: "#/components/schemas/ProductVariant" },
          { type: "object", properties: { product: { $ref: "#/components/schemas/ProductSummary" } } },
        ],
      },
      CartItemInput: {
        type: "object",
        required: ["variantId"],
        properties: {
          variantId: { type: "integer", example: 1 },
          quantity: { type: "integer", example: 2, description: "default 1, must be >= 1" },
        },
      },
      CartItemQuantityInput: {
        type: "object",
        required: ["quantity"],
        properties: {
          quantity: { type: "integer", example: 3, description: "must be >= 1 and <= stock_qty" },
        },
      },
      CartItem: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          cartId: { type: "integer", example: 1 },
          variantId: { type: "integer", example: 1 },
          quantity: { type: "integer", example: 2 },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
          variant: {
            type: "object",
            properties: {
              id: { type: "integer", example: 1 },
              sku: { type: "string", example: "IP15-BLK-128" },
              color: { type: "string", nullable: true, example: "Black" },
              size: { type: "string", nullable: true, example: "128GB" },
              price: { type: "string", nullable: true, example: "999.99" },
              stock_qty: { type: "integer", example: 10 },
              is_active: { type: "boolean", example: true },
              product: {
                type: "object",
                properties: {
                  id: { type: "integer", example: 1 },
                  name: { type: "string", example: "iPhone 15" },
                  slug: { type: "string", example: "iphone-15" },
                  base_price: { type: "string", example: "999.99" },
                },
              },
            },
          },
          unit_price: { type: "number", example: 999.99, description: "variant price, or product base_price when null" },
          line_total: { type: "number", example: 1999.98 },
        },
      },
      Cart: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          userId: { type: "integer", example: 5 },
          items: { type: "array", items: { $ref: "#/components/schemas/CartItem" } },
          total_qty: { type: "integer", example: 2 },
          total_price: { type: "number", example: 1999.98 },
        },
      },
    },
  },
};
