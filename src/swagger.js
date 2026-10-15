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
