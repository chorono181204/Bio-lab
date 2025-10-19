export type WestgardRuleKey = '1_2s' | '1_3s' | '2_2s' | 'R_4s' | '4_1s' | '10x'

export type RuleHit = {
  rule: WestgardRuleKey
  index: number // run index in insertion order
}

export type SeriesEvaluation = {
  zScores: number[]
  hits: RuleHit[]
}

export type LimitSpec = {
  mean: number
  sd: number
}

export function computeZScore(value: number, mean: number, sd: number): number {
  if (!isFinite(sd) || sd === 0) return 0
  return (value - mean) / sd
}

export type WgRuleParams = {
  type: string
  window_size?: number | null
  threshold_sd?: number | null
  consecutive_points?: number | null
  same_side?: number | null
  opposite_sides?: number | null
  sum_abs_z_gt?: number | null
  expression?: string | null
}

export type EvalResult = {
  level: 'pass' | 'warning' | 'error' | 'critical'
  violated: string[]
}

export function evaluateWithRules(values: number[], mean: number, sd: number, rules: Array<{ code: string; severity: 'warning'|'error'|'critical'; params: WgRuleParams }>): EvalResult {
  console.log('=== EVALUATE WITH RULES DEBUG ===')
  console.log('values:', values)
  console.log('mean:', mean, 'sd:', sd)
  console.log('rules:', rules)
  
  if (!sd || sd === 0) return { level: 'critical', violated: ['invalid_sd'] }
  const latest = values[values.length - 1]
  const z = (latest - mean) / sd
  console.log('latest value:', latest, 'z-score:', z)

  // Rule priority hierarchy (same as backend - higher number = higher priority)
  const rulePriority: Record<string, number> = {
    '1-3s': 6,    // Highest priority - Critical
    '2-2s': 5,    // Critical
    'R-4s': 4,    // Critical
    '1-2s': 3,    // Warning
    '2-3s': 2,    // Warning
    '4-1s': 1,    // Warning
    '10x': 0      // Lowest priority - Warning
  }

  // Evaluate all rules and collect violations
  const ruleViolations: Array<{ rule: any; code: string; severity: 'warning'|'error'|'critical'; priority: number }> = []

  for (const r of rules) {
    console.log(`Evaluating rule: ${r.code} (${r.params.type})`)
    const p = r.params
    const w = Math.max(1, p.window_size || 1)
    const win = values.slice(-w)
    const zArr = win.map(v => (v - mean) / sd)
    const signs = zArr.map(v => Math.sign(v))
    const abs = zArr.map(v => Math.abs(v))
    
    console.log(`Rule ${r.code}: window=${w}, win=${win}, zArr=${zArr}, threshold=${p.threshold_sd || 3}`)

    // Dynamic rule evaluation based on rule type
    const ruleType = r.params.type
    let triggered = false

    // Single point rules (1-2s, 1-3s, etc.)
    if (ruleType.startsWith('1-')) {
      const threshold = p.threshold_sd || (ruleType.includes('3') ? 3 : 2)
      const absZ = Math.abs(z)
      triggered = absZ >= threshold
      console.log(`${ruleType} check: |z|=${absZ}, threshold=${threshold}, triggered=${triggered}`)
    }
    
    // Two consecutive points rules (2-2s, 2-3s, etc.)
    else if (ruleType.startsWith('2-')) {
      if (win.length >= 2) {
        const threshold = p.threshold_sd || (ruleType.includes('3') ? 3 : 2)
        const sameSide = signs.every(s => s > 0) || signs.every(s => s < 0)
        triggered = sameSide && abs.every(a => a >= threshold)
        console.log(`${ruleType} check: sameSide=${sameSide}, allAboveThreshold=${abs.every(a => a >= threshold)}, triggered=${triggered}`)
      }
    }
    
    // Range rule (R-4s)
    else if (ruleType.startsWith('R-')) {
      if (win.length >= 2) {
        const threshold = p.sum_abs_z_gt || 4
        const opposite = signs[0] * signs[1] < 0
        triggered = opposite && (abs[0] + abs[1]) > threshold
        console.log(`${ruleType} check: opposite=${opposite}, sum=${abs[0] + abs[1]}, threshold=${threshold}, triggered=${triggered}`)
      }
    }
    
    // Multiple consecutive points rules (4-1s, 10x, etc.)
    else if (ruleType.startsWith('4-') || ruleType === '10x') {
      const requiredLength = ruleType === '10x' ? 10 : 4
      const threshold = ruleType === '10x' ? 0 : (p.threshold_sd || 1)
      
      if (win.length >= requiredLength) {
        if (ruleType === '10x') {
          // 10x: ten consecutive on same side of mean
          const sameSide = signs.every(s => s > 0) || signs.every(s => s <= 0)
          triggered = sameSide
        } else {
          // 4-1s: four consecutive on same side >= 1 SD
          const sameSide = signs.every(s => s > 0) || signs.every(s => s < 0)
          triggered = sameSide && abs.every(a => a >= threshold)
        }
        console.log(`${ruleType} check: length=${win.length}, required=${requiredLength}, triggered=${triggered}`)
      }
    }
    
    // Custom rules (4-1s-2s, etc.)
    else if (ruleType.includes('-')) {
      // Handle custom combinations
      const parts = ruleType.split('-')
      if (parts.length >= 3) {
        // Custom rule like 4-1s-2s
        const requiredLength = parseInt(parts[0]) || 4
        const threshold = p.threshold_sd || 1
        
        if (win.length >= requiredLength) {
          const sameSide = signs.every(s => s > 0) || signs.every(s => s < 0)
          triggered = sameSide && abs.every(a => a >= threshold)
          console.log(`Custom rule ${ruleType} check: length=${win.length}, required=${requiredLength}, triggered=${triggered}`)
        }
      }
    }
    
    // Expression-based rules (future)
    else if (p.expression) {
      // TODO: Implement expression evaluation
      console.log(`Expression rule ${ruleType} not yet implemented`)
    }
    
    // Unknown rule type
    else {
      console.log(`Unknown rule type: ${ruleType}`)
    }

    if (triggered) {
      console.log(`${ruleType} TRIGGERED!`)
      const priority = rulePriority[ruleType] || 0
      ruleViolations.push({
        rule: r,
        code: ruleType,
        severity: r.severity,
        priority
      })
    }
  }

  // Only return the highest priority violation (same as backend)
  if (ruleViolations.length > 0) {
    // Sort by priority (highest first)
    ruleViolations.sort((a, b) => b.priority - a.priority)
    const highestPriorityViolation = ruleViolations[0]!
    
    console.log(`Selected highest priority violation: ${highestPriorityViolation.code} (priority: ${highestPriorityViolation.priority})`)
    console.log(`Total violations found: ${ruleViolations.length}, returning: 1`)
    
    return { 
      level: highestPriorityViolation.severity, 
      violated: [highestPriorityViolation.code] 
    }
  }

  return { level: 'pass', violated: [] }
}
