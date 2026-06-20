/**
 * Role-Skills Data Mapping
 *
 * Maps user roles (founder, investor, mentor, professional, student) to the
 * skills they commonly have. Used by the onboarding skills step to show
 * role-appropriate suggestions and auto-fill combinations.
 *
 * @module lib/data/role-skills
 */

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface RoleSkillEntry {
  name: string
  popularity: number // 0-100, fake "how common" score
}

export interface RoleComboFill {
  common: string[] // Skills common to both roles
  roleA?: string[] // Extra top skills for first role
  roleB?: string[] // Extra top skills for second role
  total: number // Total skills to fill (default 9)
}

// ---------------------------------------------------------------------------
// Role → Common Skills
// ---------------------------------------------------------------------------

export const ROLE_COMMON_SKILLS: Record<string, RoleSkillEntry[]> = {
  founder: [
    { name: 'Leadership', popularity: 98 },
    { name: 'Fundraising', popularity: 95 },
    { name: 'Pitching', popularity: 92 },
    { name: 'Business Strategy', popularity: 90 },
    { name: 'Product Vision', popularity: 88 },
    { name: 'Negotiation', popularity: 85 },
    { name: 'Team Building', popularity: 83 },
    { name: 'Public Speaking', popularity: 80 },
    { name: 'Financial Planning', popularity: 78 },
    { name: 'Sales', popularity: 75 },
    { name: 'Hiring', popularity: 73 },
    { name: 'Marketing', popularity: 70 },
    { name: 'Networking', popularity: 68 },
    { name: 'Resilience', popularity: 65 },
    { name: 'Decision Making', popularity: 63 },
  ],

  investor: [
    { name: 'Financial Analysis', popularity: 97 },
    { name: 'Due Diligence', popularity: 95 },
    { name: 'Portfolio Management', popularity: 92 },
    { name: 'Risk Assessment', popularity: 90 },
    { name: 'Market Research', popularity: 88 },
    { name: 'Valuation', popularity: 85 },
    { name: 'Deal Sourcing', popularity: 82 },
    { name: 'Networking', popularity: 80 },
    { name: 'Negotiation', popularity: 78 },
    { name: 'Business Development', popularity: 75 },
    { name: 'Strategic Planning', popularity: 73 },
    { name: 'Financial Modeling', popularity: 70 },
    { name: 'Legal Compliance', popularity: 68 },
    { name: 'Board Management', popularity: 65 },
    { name: 'Mentorship', popularity: 62 },
  ],

  mentor: [
    { name: 'Mentorship', popularity: 98 },
    { name: 'Coaching', popularity: 95 },
    { name: 'Active Listening', popularity: 92 },
    { name: 'Feedback', popularity: 90 },
    { name: 'Communication', popularity: 88 },
    { name: 'Patience', popularity: 85 },
    { name: 'Teaching', popularity: 83 },
    { name: 'Leadership', popularity: 80 },
    { name: 'Empathy', popularity: 78 },
    { name: 'Public Speaking', popularity: 75 },
    { name: 'Conflict Resolution', popularity: 73 },
    { name: 'Goal Setting', popularity: 70 },
    { name: 'Career Counseling', popularity: 68 },
    { name: 'Knowledge Sharing', popularity: 65 },
    { name: 'Trust Building', popularity: 63 },
  ],

  professional: [
    { name: 'Communication', popularity: 95 },
    { name: 'Teamwork', popularity: 92 },
    { name: 'Project Management', popularity: 88 },
    { name: 'Problem Solving', popularity: 85 },
    { name: 'Time Management', popularity: 83 },
    { name: 'Leadership', popularity: 80 },
    { name: 'Adaptability', popularity: 78 },
    { name: 'Critical Thinking', popularity: 75 },
    { name: 'Collaboration', popularity: 73 },
    { name: 'Technical Writing', popularity: 70 },
  ],

  student: [
    { name: 'Fast Learner', popularity: 95 },
    { name: 'Adaptability', popularity: 90 },
    { name: 'Teamwork', popularity: 88 },
    { name: 'Time Management', popularity: 85 },
    { name: 'Problem Solving', popularity: 83 },
    { name: 'Creativity', popularity: 80 },
    { name: 'Research', popularity: 78 },
    { name: 'Public Speaking', popularity: 75 },
    { name: 'Writing', popularity: 73 },
    { name: 'Critical Thinking', popularity: 70 },
  ],
}

// ---------------------------------------------------------------------------
// Role + Industry → Industry-Specific Skills
// ---------------------------------------------------------------------------

export const ROLE_INDUSTRY_SKILLS: Record<string, Record<string, string[]>> = {
  founder: {
    fintech: ['Financial Analysis', 'Blockchain', 'Payments', 'Compliance', 'Risk Management'],
    healthtech: ['Healthcare Regulations', 'HIPAA', 'Clinical Trials', 'Bioinformatics', 'Medical Terminology'],
    ai_ml: ['Machine Learning', 'Data Science', 'AI Ethics', 'Model Deployment', 'Statistics'],
    edtech: ['Curriculum Design', 'Educational Technology', 'Learning Management', 'Pedagogy'],
    ecommerce: ['Supply Chain', 'Logistics', 'Customer Analytics', 'Inventory Management', 'Payment Gateways'],
    cybersecurity: ['Network Security', 'Penetration Testing', 'Security Architecture', 'Incident Response'],
    blockchain: ['Smart Contracts', 'Solidity', 'Web3', 'Cryptography', 'DeFi'],
    gaming: ['Game Design', 'Unity', '3D Modeling', 'Animation', 'Player Psychology'],
    saas: ['Product Management', 'Subscription Billing', 'Customer Success', 'Churn Analysis', 'SaaS Metrics'],
    biotech: ['Molecular Biology', 'Lab Research', 'FDA Regulations', 'Clinical Research', 'Genomics'],
  },

  investor: {
    fintech: ['Payments Industry Knowledge', 'Banking Regulations', 'Insurance Tech', 'Lending'],
    healthtech: ['Healthcare Economics', 'Drug Development Pipeline', 'Medical Devices', 'Health Policy'],
    ai_ml: ['AI Capability Assessment', 'Data Infrastructure', 'Compute Economics', 'Model Evaluation'],
    blockchain: ['Token Economics', 'DeFi Protocols', 'Web3 Infrastructure', 'Crypto Markets'],
    saas: ['SaaS Metrics', 'ARR Growth', 'Unit Economics', 'Sales Efficiency', 'Churn Analysis'],
    cybersecurity: ['Threat Landscape', 'Security Standards', 'Compliance Frameworks', 'Zero Trust'],
    cleantech: ['Clean Energy', 'Carbon Markets', 'Sustainability Reporting', 'ESG Investing'],
    biotech: ['Drug Development', 'FDA Approval Process', 'IP Strategy', 'Clinical Trial Design'],
  },

  mentor: {
    _default: ['Goal Setting', 'Career Planning', 'Skill Assessment', 'Progress Tracking'],
  },
}

// ---------------------------------------------------------------------------
// Multi-Role Combination Auto-Fill
// ---------------------------------------------------------------------------

export const ROLE_COMBINATION_AUTO_FILL: Record<string, RoleComboFill> = {
  founder_investor: {
    common: ['Leadership', 'Business Strategy', 'Networking'],
    roleA: ['Fundraising', 'Pitching', 'Product Vision'],
    roleB: ['Financial Analysis', 'Due Diligence', 'Portfolio Management'],
    total: 9,
  },
  founder_mentor: {
    common: ['Leadership', 'Communication', 'Public Speaking'],
    roleA: ['Fundraising', 'Pitching', 'Business Strategy'],
    roleB: ['Mentorship', 'Coaching', 'Active Listening'],
    total: 9,
  },
  investor_mentor: {
    common: ['Networking', 'Communication', 'Market Knowledge'],
    roleA: ['Financial Analysis', 'Due Diligence', 'Portfolio Management'],
    roleB: ['Mentorship', 'Coaching', 'Active Listening'],
    total: 9,
  },
  founder_professional: {
    common: ['Leadership', 'Project Management', 'Communication'],
    roleA: ['Fundraising', 'Pitching', 'Business Strategy'],
    roleB: ['Teamwork', 'Technical Skills', 'Problem Solving'],
    total: 9,
  },
  investor_professional: {
    common: ['Business Development', 'Market Research', 'Strategic Planning'],
    roleA: ['Financial Analysis', 'Due Diligence', 'Portfolio Management'],
    roleB: ['Communication', 'Project Management', 'Teamwork'],
    total: 9,
  },
  mentor_professional: {
    common: ['Communication', 'Leadership', 'Knowledge Sharing'],
    roleA: ['Mentorship', 'Coaching', 'Active Listening'],
    roleB: ['Project Management', 'Teamwork', 'Problem Solving'],
    total: 9,
  },
  founder_investor_mentor: {
    common: ['Leadership', 'Communication', 'Networking'],
    roleA: ['Fundraising', 'Pitching', 'Business Strategy'],
    roleB: ['Financial Analysis', 'Due Diligence', 'Portfolio Management'],
    total: 12,
  },
}

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

/**
 * Get auto-fill suggestions based on selected roles.
 * Returns the top N skills to pre-select in the skills step.
 * Uses the combination auto-fill when multiple roles selected,
 * or falls back to top skills per role when single role.
 */
export function getAutoFillSkills(roles: string[], count: number = 9): string[] {
  // Single role — return top `count` skills for that role
  if (roles.length === 1) {
    return (ROLE_COMMON_SKILLS[roles[0]] || []).slice(0, count).map((s) => s.name)
  }

  // Sort roles alphabetically for consistent key
  const sorted = [...roles].sort()
  const comboKey = sorted.join('_')
  const combo = ROLE_COMBINATION_AUTO_FILL[comboKey]

  if (combo) {
    const result = [...combo.common]
    if (combo.roleA) result.push(...combo.roleA)
    if (combo.roleB) result.push(...combo.roleB)
    return result.slice(0, combo.total || count)
  }

  // Fallback: take top skills from each role, interleaved
  const perRole = Math.ceil(count / roles.length)
  const result: string[] = []
  const seen = new Set<string>()

  for (let i = 0; i < perRole; i++) {
    for (const role of sorted) {
      const skills = ROLE_COMMON_SKILLS[role] || []
      if (i < skills.length && !seen.has(skills[i].name)) {
        seen.add(skills[i].name)
        result.push(skills[i].name)
      }
    }
  }

  return result.slice(0, count)
}

/**
 * Get skill suggestions for a user based on their roles and industries.
 * Returns a flat list of skill names ordered by relevance.
 * Used by the step-skills search/combobox.
 */
export function getRoleSkillSuggestions(roles: string[], industries: string[]): string[] {
  const suggestions = new Set<string>()

  // Add role-common skills
  for (const role of roles) {
    const skills = ROLE_COMMON_SKILLS[role] || []
    for (const s of skills) {
      suggestions.add(s.name)
    }
  }

  // Add industry-specific skills for each role
  for (const role of roles) {
    const industryMap = ROLE_INDUSTRY_SKILLS[role]
    if (industryMap) {
      for (const industry of industries) {
        const normalizedIndustry = industry.toLowerCase().replace(/[^a-z0-9]/g, '')
        // Try exact match first, then partial
        const exactMatch = industryMap[normalizedIndustry]

        if (exactMatch) {
          exactMatch.forEach((s) => suggestions.add(s))
        } else {
          // Try partial match
          for (const [key, skills] of Object.entries(industryMap)) {
            if (normalizedIndustry.includes(key) || key.includes(normalizedIndustry)) {
              skills.forEach((s) => suggestions.add(s))
            }
          }
        }
      }
    }
  }

  return Array.from(suggestions)
}

/**
 * Get skill suggestions for the skills step combobox.
 * Returns a sorted array of { id, label, category } objects
 * that merges role-specific suggestions with the full skills database.
 */
export function getEnhancedSkillOptions(
  roles: string[],
  industries: string[],
  allSkills: { id: string; name: string; category: string }[],
): { id: string; label: string; category: string; isRoleSuggested: boolean }[] {
  const suggestedNames = new Set(getRoleSkillSuggestions(roles, industries))

  return allSkills.map((skill) => ({
    id: skill.id,
    label: skill.name,
    category: skill.category,
    isRoleSuggested: suggestedNames.has(skill.name),
  }))
}
