import { ENTITY_KEYS, isEntityKey } from '../config.js';
import {
  createRecord,
  deleteRecord,
  getActivities,
  getAllEntities,
  getEntity,
  getMessages,
  markMessageRead,
  updateRecord,
} from '../db.js';
import type { EntityRecord } from '../types.js';
import type { ToolDefinition } from './llm.js';

export const ASSISTANT_TOOLS: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'get_portal_summary',
      description: 'Get counts and high-level stats for all portal entities.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_records',
      description: 'List records for an entity type. Use for detailed lookups.',
      parameters: {
        type: 'object',
        properties: {
          entity: { type: 'string', enum: [...ENTITY_KEYS], description: 'Entity type' },
          limit: { type: 'number', description: 'Max records to return (default 20)' },
        },
        required: ['entity'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_record',
      description: 'Create a new record in an entity collection.',
      parameters: {
        type: 'object',
        properties: {
          entity: { type: 'string', enum: [...ENTITY_KEYS] },
          data: {
            type: 'object',
            description: 'Field values for the new record (do not include id)',
            additionalProperties: true,
          },
        },
        required: ['entity', 'data'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_record',
      description: 'Update fields on an existing record by id.',
      parameters: {
        type: 'object',
        properties: {
          entity: { type: 'string', enum: [...ENTITY_KEYS] },
          id: { type: 'number' },
          patch: { type: 'object', additionalProperties: true },
        },
        required: ['entity', 'id', 'patch'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_record',
      description: 'Delete a record by id.',
      parameters: {
        type: 'object',
        properties: {
          entity: { type: 'string', enum: [...ENTITY_KEYS] },
          id: { type: 'number' },
        },
        required: ['entity', 'id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_activities',
      description: 'Get recent activity feed items.',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Max items (default 10)' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_messages',
      description: 'Get inbox messages.',
      parameters: {
        type: 'object',
        properties: {
          unread_only: { type: 'boolean', description: 'Only unread messages' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'mark_message_read',
      description: 'Mark a message as read by id.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'number' },
        },
        required: ['id'],
      },
    },
  },
];

export interface ToolAction {
  tool: string;
  args: Record<string, unknown>;
  ok: boolean;
  result?: unknown;
  error?: string;
}

function parseArgs(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}

async function portalSummary() {
  const entities = await getAllEntities();
  const courses = entities.courses ?? [];
  const students = entities.students ?? [];
  const enrolled = courses.reduce((s, c) => s + Number(c.students || 0), 0);
  const atRisk = students.filter((s) => Number(s.progress) < 55);

  return {
    counts: Object.fromEntries(
      ENTITY_KEYS.map((key) => [key, (entities[key] ?? []).length]),
    ),
    totalEnrolments: enrolled,
    atRiskStudents: atRisk.map((s) => ({ id: s.id, name: s.name, progress: s.progress })),
    topCourse: [...courses].sort((a, b) => Number(b.students) - Number(a.students))[0] ?? null,
  };
}

export async function executeTool(name: string, argsRaw: string): Promise<ToolAction> {
  const args = parseArgs(argsRaw);

  try {
    switch (name) {
      case 'get_portal_summary':
        return { tool: name, args, ok: true, result: await portalSummary() };

      case 'list_records': {
        const entity = String(args.entity ?? '');
        if (!isEntityKey(entity)) throw new Error(`Unknown entity: ${entity}`);
        const limit = Math.min(Number(args.limit) || 20, 50);
        const rows = (await getEntity(entity)).slice(0, limit);
        return { tool: name, args, ok: true, result: { entity, count: rows.length, records: rows } };
      }

      case 'create_record': {
        const entity = String(args.entity ?? '');
        if (!isEntityKey(entity)) throw new Error(`Unknown entity: ${entity}`);
        const data = args.data as Omit<EntityRecord, 'id'>;
        if (!data || typeof data !== 'object') throw new Error('data object is required');
        const created = await createRecord(entity, data);
        return { tool: name, args, ok: true, result: created };
      }

      case 'update_record': {
        const entity = String(args.entity ?? '');
        const id = Number(args.id);
        if (!isEntityKey(entity) || Number.isNaN(id)) throw new Error('Invalid entity or id');
        const patch = args.patch as Partial<EntityRecord>;
        const updated = await updateRecord(entity, id, patch);
        if (!updated) throw new Error('Record not found');
        return { tool: name, args, ok: true, result: updated };
      }

      case 'delete_record': {
        const entity = String(args.entity ?? '');
        const id = Number(args.id);
        if (!isEntityKey(entity) || Number.isNaN(id)) throw new Error('Invalid entity or id');
        const ok = await deleteRecord(entity, id);
        if (!ok) throw new Error('Record not found');
        return { tool: name, args, ok: true, result: { deleted: true, entity, id } };
      }

      case 'list_activities': {
        const limit = Math.min(Number(args.limit) || 10, 30);
        const items = (await getActivities()).slice(0, limit);
        return { tool: name, args, ok: true, result: items };
      }

      case 'list_messages': {
        let items = await getMessages();
        if (args.unread_only) items = items.filter((m) => m.unread);
        return { tool: name, args, ok: true, result: items };
      }

      case 'mark_message_read': {
        const id = Number(args.id);
        if (Number.isNaN(id)) throw new Error('Invalid message id');
        const ok = await markMessageRead(id);
        if (!ok) throw new Error('Message not found');
        return { tool: name, args, ok: true, result: { markedRead: id } };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (err) {
    return {
      tool: name,
      args,
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
