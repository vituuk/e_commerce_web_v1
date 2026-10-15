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
    "/product/product": {
      get: {
        tags: ["Product"],
        summary: "Get all products",
        responses: {
          200: {
            description: "List of products",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "get product successfully" },
                    getall: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Product" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Product"],
        summary: "Create a product",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ProductInput" },
            },
          },
        },
        responses: {
          200: {
            description: "Product created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "create successfuly" },
                    product: { $ref: "#/components/schemas/Product" },
                  },
                },
              },
            },
          },
        },
      },
      put:{
        tags: ["Product"],
        summary: "Update product",
        requestBody: {
          required: true,
          content: {
            "application/json":{
              schema: { $ref: "#/components/schemas/ProductInput"}
            }
          }
        },
        responses: {
          200: {
            description: "Product updated",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "create successfuly" },
                    product: { $ref: "#/components/schemas/Product" },
                  },
                },
              },
            },
          },
        },
      }
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
    },
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
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
      ProductInput: {
        type: "object",
        properties: {
          firstName: { type: "string", example: "vitu" },
          lastName: { type: "string", example: "smos" },
          email: { type: "string", example: "vitu@gmail.com" },
        },
      },
      Product: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          firstName: { type: "string", example: "vitu" },
          lastName: { type: "string", example: "smos" },
          email: { type: "string", example: "vitu@gmail.com" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
    },
  },
};
