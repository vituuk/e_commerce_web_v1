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
  },
  components: {
    schemas: {
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
