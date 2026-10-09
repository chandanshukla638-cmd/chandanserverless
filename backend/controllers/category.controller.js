import { db } from '../config/db.js';

const buildTree = (rows, parentId = null) => {
  return rows
    .filter(r => r.parent_id === parentId)
    .map(r => ({
      ...r,
      children: buildTree(rows, r.id),
    }));
};

export const getCategories = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT c.*, 
        (SELECT COUNT(*) FROM qr_codes q WHERE q.category_id = c.id) as qr_count
       FROM categories c ORDER BY c.name`
    );
    const tree = buildTree(result.rows);
    res.json({ flat: result.rows, tree });
  } catch (err) {
    next(err);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const { name, parent_id } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required' });
    }
    if (parent_id) {
      const parentCheck = await db.query('SELECT id FROM categories WHERE id = $1', [parent_id]);
      if (parentCheck.rows.length === 0) {
        return res.status(400).json({ error: 'Parent category not found' });
      }
    }
    const result = await db.query(
      'INSERT INTO categories (name, parent_id, created_by) VALUES ($1, $2, $3) RETURNING *',
      [name.trim(), parent_id || null, req.user?.id || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, parent_id } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required' });
    }
    if (parent_id && Number(parent_id) === Number(id)) {
      return res.status(400).json({ error: 'Category cannot be its own parent' });
    }
    const result = await db.query(
      'UPDATE categories SET name = $1, parent_id = $2 WHERE id = $3 RETURNING *',
      [name.trim(), parent_id || null, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Delete all QR codes in this category first
    await db.query('DELETE FROM qr_codes WHERE category_id = $1', [id]);
    
    const result = await db.query('DELETE FROM categories WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json({ message: 'Category and its QR codes deleted successfully' });
  } catch (err) {
    next(err);
  }
};

export const findOrCreateCategory = async (path, userId) => {
  const parts = path.split('/').map(p => p.trim()).filter(Boolean);
  let parentId = null;
  let currentId = null;

  for (const part of parts) {
    const existing = await db.query(
      'SELECT id FROM categories WHERE name = $1 AND (parent_id = $2 OR (parent_id IS NULL AND $2 IS NULL))',
      [part, parentId]
    );
    if (existing.rows.length > 0) {
      currentId = existing.rows[0].id;
    } else {
      const created = await db.query(
        'INSERT INTO categories (name, parent_id, created_by) VALUES ($1, $2, $3) RETURNING id',
        [part, parentId, userId]
      );
      currentId = created.rows[0].id;
    }
    parentId = currentId;
  }
  return currentId;
};
