import { getDb } from './connection'

export interface BiasMethod {
  id: string
  name: string
  description?: string
  created_by?: string
  updated_by?: string
  created_at?: string
  updated_at?: string
}

export interface BiasMethodIn {
  name: string
  description?: string
  created_by?: string
  updated_by?: string
}

export function listBiasMethods(): BiasMethod[] {
  const db = getDb()
  return db.prepare(`SELECT * FROM bias_methods ORDER BY name`).all() as BiasMethod[]
}

export function getBiasMethod(id: string): BiasMethod | null {
  const db = getDb()
  return db.prepare(`SELECT * FROM bias_methods WHERE id = ?`).get(id) as BiasMethod | null
}

export function createBiasMethod(p: BiasMethodIn): BiasMethod {
  const db = getDb()
  const id = String(Date.now()) + '-' + Math.random().toString(36).slice(2,6)
  
  db.prepare(`
    INSERT INTO bias_methods(id, name, description, created_by, updated_by)
    VALUES(?, ?, ?, ?, ?)
  `).run(
    id,
    p.name,
    p.description || null,
    p.created_by || 'admin',
    p.updated_by || 'admin'
  )
  
  return getBiasMethod(id)!
}

export function updateBiasMethod(p: BiasMethodIn & { id: string }): BiasMethod {
  const db = getDb()
  
  db.prepare(`
    UPDATE bias_methods 
    SET name = ?, description = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    p.name,
    p.description || null,
    p.updated_by || 'admin',
    p.id
  )
  
  return getBiasMethod(p.id)!
}

export function deleteBiasMethod(id: string): void {
  const db = getDb()
  
  // Check if bias method is being used in qc_limits
  const usage = db.prepare(`SELECT COUNT(*) as count FROM qc_limits WHERE bias_method = ?`).get(id) as { count: number }
  if (usage.count > 0) {
    throw new Error('Không thể xóa phương pháp BIAS đang được sử dụng trong QC limits')
  }
  
  db.prepare(`DELETE FROM bias_methods WHERE id = ?`).run(id)
}

// Seed default bias methods
export function seedBiasMethods(): void {
  const db = getDb()
  
  const defaultMethods = [
    { name: 'Bias | IQC', description: 'Phương pháp tính BIAS từ dữ liệu IQC' },
    { name: 'Bias | EQA', description: 'Phương pháp tính BIAS từ dữ liệu EQA' },
  ]
  
  for (const method of defaultMethods) {
    const existing = db.prepare(`SELECT id FROM bias_methods WHERE name = ?`).get(method.name)
    if (!existing) {
      createBiasMethod({
        name: method.name,
        description: method.description,
        created_by: 'system'
      })
    }
  }
}












