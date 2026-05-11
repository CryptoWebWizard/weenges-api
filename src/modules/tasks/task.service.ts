import { query } from '../../config/database';
import { Task, CreateTaskDto, UpdateTaskDto, PaginatedResult, PaginationQuery } from './task.types';

export class TaskService {
  async findAll(pagination: PaginationQuery): Promise<PaginatedResult<Task>> {
    const { page, limit } = pagination;
    const offset = (page - 1) * limit;

    const countResult = await query<{ count: string }>(
      'SELECT COUNT(*) FROM tasks WHERE is_deleted = false',
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const result = await query<Task>(
      `SELECT id, title, description, status, completed_at, deleted_at, is_deleted, created_at, updated_at
       FROM tasks
       WHERE is_deleted = false
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset],
    );

    return {
      data: result.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: number): Promise<Task | null> {
    const result = await query<Task>(
      `SELECT id, title, description, status, completed_at, deleted_at, is_deleted, created_at, updated_at
       FROM tasks
       WHERE id = $1 AND is_deleted = false`,
      [id],
    );
    return result.rows[0] ?? null;
  }

  async create(dto: CreateTaskDto): Promise<Task> {
    const { title, description = null, status = 'pending' } = dto;
    const completedAt = status === 'done' ? new Date() : null;

    const result = await query<Task>(
      `INSERT INTO tasks (title, description, status, completed_at)
       VALUES ($1, $2, $3, $4)
       RETURNING id, title, description, status, completed_at, deleted_at, is_deleted, created_at, updated_at`,
      [title, description, status, completedAt],
    );
    return result.rows[0];
  }

  async update(id: number, dto: UpdateTaskDto): Promise<Task | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const title = dto.title ?? existing.title;
    const description = dto.description !== undefined ? dto.description : existing.description;
    const status = dto.status ?? existing.status;
    const completedAt =
      status === 'done' && existing.status !== 'done'
        ? new Date()
        : status !== 'done'
          ? null
          : existing.completed_at;

    const result = await query<Task>(
      `UPDATE tasks
       SET title = $1, description = $2, status = $3, completed_at = $4
       WHERE id = $5 AND is_deleted = false
       RETURNING id, title, description, status, completed_at, deleted_at, is_deleted, created_at, updated_at`,
      [title, description, status, completedAt, id],
    );
    return result.rows[0] ?? null;
  }

  async softDelete(id: number): Promise<boolean> {
    const result = await query(
      `UPDATE tasks SET deleted_at = NOW(), is_deleted = true WHERE id = $1 AND is_deleted = false`,
      [id],
    );
    return (result.rowCount ?? 0) > 0;
  }
}

export default new TaskService();
