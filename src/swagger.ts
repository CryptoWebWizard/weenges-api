import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Weenggs Tasks API',
      version: '1.0.0',
      description: 'Express + TypeScript Tasks API with JWT Authentication',
    },
    servers: [{ url: '/api/v1', description: 'API v1' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        LoginDto: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'admin@test.com' },
            password: { type: 'string', example: 'secret123' },
          },
        },
        CreateTaskDto: {
          type: 'object',
          required: ['title'],
          properties: {
            title: { type: 'string', example: 'Implement auth' },
            description: { type: 'string', example: 'Add JWT authentication' },
            status: {
              type: 'string',
              enum: ['pending', 'in_progress', 'done'],
              default: 'pending',
            },
          },
        },
        UpdateTaskDto: {
          type: 'object',
          properties: {
            title: { type: 'string', example: 'Updated title' },
            description: { type: 'string' },
            status: {
              type: 'string',
              enum: ['pending', 'in_progress', 'done'],
            },
          },
        },
        Task: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            title: { type: 'string' },
            description: { type: 'string', nullable: true },
            status: { type: 'string', enum: ['pending', 'in_progress', 'done'] },
            completed_at: { type: 'string', format: 'date-time', nullable: true },
            deleted_at: { type: 'string', format: 'date-time', nullable: true },
            is_deleted: { type: 'boolean', example: false },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        PaginatedTasks: {
          type: 'object',
          properties: {
            data: { type: 'array', items: { $ref: '#/components/schemas/Task' } },
            total: { type: 'integer' },
            page: { type: 'integer' },
            limit: { type: 'integer' },
            totalPages: { type: 'integer' },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            refreshToken: { type: 'string', example: 'a3f1c2...64-char-hex...' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'integer', example: 1 },
                email: { type: 'string', format: 'email', example: 'admin@test.com' },
                created_at: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
        RefreshDto: {
          type: 'object',
          required: ['refreshToken'],
          properties: {
            refreshToken: { type: 'string', example: 'a3f1c2...64-char-hex...' },
          },
        },
        RefreshResponse: {
          type: 'object',
          properties: {
            token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            refreshToken: { type: 'string', example: 'b7e9d4...new-64-char-hex...' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error message' },
            errors: {
              type: 'array',
              nullable: true,
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string' },
                  msg: { type: 'string' },
                  path: { type: 'string' },
                  location: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: ['./src/modules/**/*.controller.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
