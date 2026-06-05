// Comprehensive Skills Database
export interface Skill {
  id: string
  name: string
  category: SkillCategory
  subcategory?: string
  keywords: string[]
}

export type SkillCategory = 'technical' | 'business' | 'creative' | 'blue-collar' | 'white-collar' | 'yellow-collar' | 'trades' | 'services' | 'healthcare' | 'education' | 'hospitality' | 'odd-jobs'

export const skillsDatabase: Skill[] = [
  // === TECHNICAL ===
  // Programming Languages
  { id: 'javascript', name: 'JavaScript', category: 'technical', subcategory: 'Programming Languages', keywords: ['js', 'ecmascript', 'frontend', 'backend', 'web'] },
  { id: 'typescript', name: 'TypeScript', category: 'technical', subcategory: 'Programming Languages', keywords: ['ts', 'typed', 'javascript', 'frontend'] },
  { id: 'python', name: 'Python', category: 'technical', subcategory: 'Programming Languages', keywords: ['py', 'django', 'flask', 'data', 'scripting', 'ai', 'ml'] },
  { id: 'java', name: 'Java', category: 'technical', subcategory: 'Programming Languages', keywords: ['spring', 'enterprise', 'backend', 'android'] },
  { id: 'csharp', name: 'C#', category: 'technical', subcategory: 'Programming Languages', keywords: ['csharp', 'dotnet', '.net', 'unity', 'backend'] },
  { id: 'cpp', name: 'C++', category: 'technical', subcategory: 'Programming Languages', keywords: ['cpp', 'system', 'performance', 'games'] },
  { id: 'go', name: 'Go', category: 'technical', subcategory: 'Programming Languages', keywords: ['golang', 'backend', 'concurrent', 'system'] },
  { id: 'rust', name: 'Rust', category: 'technical', subcategory: 'Programming Languages', keywords: ['system', 'safe', 'performance', 'webassembly'] },
  { id: 'ruby', name: 'Ruby', category: 'technical', subcategory: 'Programming Languages', keywords: ['rails', 'backend', 'web', 'scripting'] },
  { id: 'php', name: 'PHP', category: 'technical', subcategory: 'Programming Languages', keywords: ['laravel', 'wordpress', 'backend', 'mysql'] },
  { id: 'swift', name: 'Swift', category: 'technical', subcategory: 'Programming Languages', keywords: ['ios', 'apple', 'mobile', 'swiftui'] },
  { id: 'kotlin', name: 'Kotlin', category: 'technical', subcategory: 'Programming Languages', keywords: ['android', 'mobile', 'jvm', 'native'] },
  { id: 'sql', name: 'SQL', category: 'technical', subcategory: 'Programming Languages', keywords: ['database', 'query', 'mysql', 'postgres', 'oracle'] },

  // Frontend Frameworks
  { id: 'react', name: 'React', category: 'technical', subcategory: 'Frontend Frameworks', keywords: ['frontend', 'ui', 'javascript', 'hooks', 'spa'] },
  { id: 'vue', name: 'Vue.js', category: 'technical', subcategory: 'Frontend Frameworks', keywords: ['frontend', 'ui', 'javascript', 'vuex'] },
  { id: 'angular', name: 'Angular', category: 'technical', subcategory: 'Frontend Frameworks', keywords: ['frontend', 'ui', 'typescript', 'rxjs'] },
  { id: 'nextjs', name: 'Next.js', category: 'technical', subcategory: 'Frontend Frameworks', keywords: ['react', 'ssr', 'vercel', 'seo', 'web'] },
  { id: 'svelte', name: 'Svelte', category: 'technical', subcategory: 'Frontend Frameworks', keywords: ['frontend', 'ui', 'sveltekit', 'compiler'] },
  { id: 'html', name: 'HTML5', category: 'technical', subcategory: 'Frontend Frameworks', keywords: ['web', 'markup', 'frontend', 'dom'] },
  { id: 'css', name: 'CSS3', category: 'technical', subcategory: 'Frontend Frameworks', keywords: ['web', 'styling', 'frontend', 'flexbox', 'grid'] },
  { id: 'tailwind', name: 'Tailwind CSS', category: 'technical', subcategory: 'Frontend Frameworks', keywords: ['css', 'utility-first', 'design', 'responsive'] },

  // Backend Frameworks
  { id: 'nodejs', name: 'Node.js', category: 'technical', subcategory: 'Backend Frameworks', keywords: ['backend', 'javascript', 'server', 'npm', 'express'] },
  { id: 'express', name: 'Express.js', category: 'technical', subcategory: 'Backend Frameworks', keywords: ['node', 'backend', 'api', 'rest'] },
  { id: 'django', name: 'Django', category: 'technical', subcategory: 'Backend Frameworks', keywords: ['python', 'orm', 'web', 'admin'] },
  { id: 'flask', name: 'Flask', category: 'technical', subcategory: 'Backend Frameworks', keywords: ['python', 'microframework', 'api'] },
  { id: 'fastapi', name: 'FastAPI', category: 'technical', subcategory: 'Backend Frameworks', keywords: ['python', 'api', 'openapi', 'async'] },
  { id: 'spring-boot', name: 'Spring Boot', category: 'technical', subcategory: 'Backend Frameworks', keywords: ['java', 'enterprise', 'mvc'] },
  { id: 'laravel', name: 'Laravel', category: 'technical', subcategory: 'Backend Frameworks', keywords: ['php', 'web', 'artisan', 'eloquent'] },
  { id: 'rails', name: 'Ruby on Rails', category: 'technical', subcategory: 'Backend Frameworks', keywords: ['ruby', 'mvc', 'web', 'activerecord'] },

  // Database Technologies
  { id: 'postgresql', name: 'PostgreSQL', category: 'technical', subcategory: 'Database Technologies', keywords: ['sql', 'relational', 'database', 'postgres'] },
  { id: 'mysql', name: 'MySQL', category: 'technical', subcategory: 'Database Technologies', keywords: ['sql', 'relational', 'database', 'mariadb'] },
  { id: 'mongodb', name: 'MongoDB', category: 'technical', subcategory: 'Database Technologies', keywords: ['nosql', 'document', 'database', 'bson'] },
  { id: 'redis', name: 'Redis', category: 'technical', subcategory: 'Database Technologies', keywords: ['cache', 'in-memory', 'key-value', 'pubsub'] },
  { id: 'sqlite', name: 'SQLite', category: 'technical', subcategory: 'Database Technologies', keywords: ['sql', 'database', 'file-based', 'embedded'] },

  // DevOps & Cloud
  { id: 'aws', name: 'Amazon Web Services', category: 'technical', subcategory: 'Cloud Platforms', keywords: ['cloud', 'amazon', 'infrastructure', 's3', 'ec2'] },
  { id: 'azure', name: 'Microsoft Azure', category: 'technical', subcategory: 'Cloud Platforms', keywords: ['cloud', 'microsoft', 'enterprise', 'active-directory'] },
  { id: 'gcp', name: 'Google Cloud Platform', category: 'technical', subcategory: 'Cloud Platforms', keywords: ['cloud', 'google', 'kubernetes', 'bigquery'] },
  { id: 'docker', name: 'Docker', category: 'technical', subcategory: 'DevOps & CI/CD', keywords: ['containers', 'virtualization', 'deployment', 'images'] },
  { id: 'kubernetes', name: 'Kubernetes', category: 'technical', subcategory: 'DevOps & CI/CD', keywords: ['k8s', 'orchestration', 'containers', 'helm'] },
  { id: 'terraform', name: 'Terraform', category: 'technical', subcategory: 'DevOps & CI/CD', keywords: ['iac', 'infrastructure-as-code', 'hashicorp'] },
  { id: 'git', name: 'Git', category: 'technical', subcategory: 'Version Control', keywords: ['version-control', 'source-control', 'collaboration', 'merge'] },
  { id: 'github', name: 'GitHub', category: 'technical', subcategory: 'Version Control', keywords: ['git', 'repository', 'collaboration', 'actions'] },

  // AI & Data Science
  { id: 'tensorflow', name: 'TensorFlow', category: 'technical', subcategory: 'AI & Machine Learning', keywords: ['ml', 'deep-learning', 'google', 'neural-networks'] },
  { id: 'pytorch', name: 'PyTorch', category: 'technical', subcategory: 'AI & Machine Learning', keywords: ['ml', 'deep-learning', 'facebook', 'tensors'] },
  { id: 'data-analysis', name: 'Data Analysis', category: 'technical', subcategory: 'Data Science & Analytics', keywords: ['data', 'analytics', 'insights', 'statistics'] },
  { id: 'pandas', name: 'Pandas', category: 'technical', subcategory: 'Data Science & Analytics', keywords: ['python', 'dataframes', 'analysis'] },
  { id: 'numpy', name: 'NumPy', category: 'technical', subcategory: 'Data Science & Analytics', keywords: ['python', 'matrices', 'math'] },

  // === BUSINESS & MANAGEMENT ===
  { id: 'project-management', name: 'Project Management', category: 'business', subcategory: 'Management', keywords: ['management', 'planning', 'execution', 'scrum', 'agile'] },
  { id: 'product-management', name: 'Product Management', category: 'business', subcategory: 'Management', keywords: ['product', 'strategy', 'roadmap', 'features'] },
  { id: 'business-analysis', name: 'Business Analysis', category: 'business', subcategory: 'Analysis', keywords: ['analysis', 'requirements', 'stakeholders', 'flows'] },
  { id: 'financial-analysis', name: 'Financial Analysis', category: 'business', subcategory: 'Finance', keywords: ['finance', 'analysis', 'reporting', 'modeling'] },
  { id: 'accounting', name: 'Accounting', category: 'business', subcategory: 'Finance', keywords: ['finance', 'bookkeeping', 'tax', 'ledgers'] },
  { id: 'strategic-planning', name: 'Strategic Planning', category: 'business', subcategory: 'Strategy', keywords: ['strategy', 'planning', 'vision', 'roadmap'] },
  { id: 'business-development', name: 'Business Development', category: 'business', subcategory: 'Sales', keywords: ['sales', 'growth', 'partnerships', 'bizdev'] },
  { id: 'sales', name: 'Sales', category: 'business', subcategory: 'Sales', keywords: ['selling', 'revenue', 'customers', 'leads', 'deals'] },
  { id: 'negotiation', name: 'Negotiation', category: 'business', subcategory: 'Communication', keywords: ['negotiation', 'deal-making', 'persuasion', 'contracts'] },
  { id: 'leadership', name: 'Leadership', category: 'business', subcategory: 'Management', keywords: ['leadership', 'team', 'management', 'mentoring'] },
  { id: 'marketing', name: 'Marketing', category: 'business', subcategory: 'Marketing', keywords: ['marketing', 'promotion', 'brand', 'advertising'] },
  { id: 'seo', name: 'Search Engine Optimization (SEO)', category: 'business', subcategory: 'Marketing', keywords: ['seo', 'google', 'ranking', 'keywords', 'optimization'] },
  { id: 'supply-chain', name: 'Supply Chain Management', category: 'business', subcategory: 'Operations', keywords: ['supply-chain', 'logistics', 'procurement', 'inventory'] },
  { id: 'human-resources', name: 'Human Resources', category: 'business', subcategory: 'Human Resources', keywords: ['hr', 'recruitment', 'employees', 'benefits'] },
  { id: 'public-speaking', name: 'Public Speaking', category: 'business', subcategory: 'Communication', keywords: ['speaking', 'presentation', 'communication', 'keynote'] },

  // === CREATIVE & DESIGN ===
  { id: 'graphic-design', name: 'Graphic Design', category: 'creative', subcategory: 'Design', keywords: ['design', 'visual', 'graphics', 'layout'] },
  { id: 'ui-design', name: 'UI Design', category: 'creative', subcategory: 'Design', keywords: ['ui', 'interface', 'design', 'visual', 'screens'] },
  { id: 'ux-design', name: 'UX Design', category: 'creative', subcategory: 'Design', keywords: ['ux', 'user-experience', 'design', 'wireframes', 'research'] },
  { id: 'web-design', name: 'Web Design', category: 'creative', subcategory: 'Design', keywords: ['web', 'design', 'responsive', 'landing-pages'] },
  { id: 'logo-design', name: 'Logo Design', category: 'creative', subcategory: 'Design', keywords: ['logo', 'branding', 'identity', 'vectors'] },
  { id: 'illustration', name: 'Illustration', category: 'creative', subcategory: 'Design', keywords: ['illustration', 'drawing', 'art', 'vector', 'digital'] },
  { id: 'video-editing', name: 'Video Editing', category: 'creative', subcategory: 'Video & Animation', keywords: ['video', 'editing', 'post-production', 'premiere', 'final-cut'] },
  { id: 'photography', name: 'Photography', category: 'creative', subcategory: 'Photography', keywords: ['photo', 'camera', 'lighting', 'editing', 'dslr'] },
  { id: 'copywriting', name: 'Copywriting', category: 'creative', subcategory: 'Writing', keywords: ['copy', 'writing', 'advertising', 'slogans', 'marketing'] },
  { id: 'content-writing', name: 'Content Writing', category: 'creative', subcategory: 'Writing', keywords: ['content', 'writing', 'blog', 'seo', 'articles'] },
  { id: 'figma', name: 'Figma', category: 'creative', subcategory: 'Software', keywords: ['figma', 'ui', 'ux', 'design', 'prototyping'] },
  { id: 'photoshop', name: 'Adobe Photoshop', category: 'creative', subcategory: 'Software', keywords: ['photoshop', 'adobe', 'editing', 'raster', 'photos'] },
  { id: 'illustrator', name: 'Adobe Illustrator', category: 'creative', subcategory: 'Software', keywords: ['illustrator', 'adobe', 'vector', 'logos'] },
  { id: 'animation', name: 'Animation', category: 'creative', subcategory: 'Video & Animation', keywords: ['animation', '2d', '3d', 'motion-graphics', 'after-effects'] },
  { id: '3d-modeling', name: '3D Modeling', category: 'creative', subcategory: 'Design', keywords: ['3d', 'modeling', 'blender', 'maya', 'render'] },

  // === BLUE-COLLAR, TRADES & SERVICES ===
  // PLUMBING (Real-World Home Services)
  { id: 'plumbing-general', name: 'Residential Plumbing', category: 'trades', subcategory: 'Plumbing Services', keywords: ['plumbing', 'pipes', 'water', 'repair', 'residential', 'home', 'leak'] },
  { id: 'plumbing-commercial', name: 'Commercial Plumbing', category: 'trades', subcategory: 'Plumbing Services', keywords: ['plumbing', 'commercial', 'office', 'heavy-duty', 'piping', 'systems'] },
  { id: 'drain-cleaning', name: 'Drain Cleaning & Unclogging', category: 'trades', subcategory: 'Plumbing Services', keywords: ['plumbing', 'drain', 'unclog', 'sewer', 'blockage', 'cleaning', 'sink', 'toilet'] },
  { id: 'water-heater', name: 'Water Heater Installation & Repair', category: 'trades', subcategory: 'Plumbing Services', keywords: ['plumbing', 'water-heater', 'boiler', 'hot-water', 'tankless', 'heater', 'repair'] },
  { id: 'leak-detection', name: 'Leak Detection & Piping Repair', category: 'trades', subcategory: 'Plumbing Services', keywords: ['plumbing', 'leak', 'detection', 'pipes', 'pipefitting', 'burst', 'water-damage'] },
  { id: 'faucet-toilet-repair', name: 'Faucet & Toilet Installation/Repair', category: 'trades', subcategory: 'Plumbing Services', keywords: ['plumbing', 'faucet', 'toilet', 'shower', 'sink', 'fixture', 'bathroom', 'valves'] },
  { id: 'sump-pump', name: 'Sump Pump Installation & Maintenance', category: 'trades', subcategory: 'Plumbing Services', keywords: ['plumbing', 'sump-pump', 'basement', 'flooding', 'pump', 'drainage'] },
  { id: 'sewer-line', name: 'Sewer Line Inspection & Repair', category: 'trades', subcategory: 'Plumbing Services', keywords: ['plumbing', 'sewer', 'camera-inspection', 'trenchless', 'clog', 'outdoor'] },
  { id: 'gas-piping', name: 'Gas Line Installation & Piping', category: 'trades', subcategory: 'Plumbing Services', keywords: ['plumbing', 'gas', 'gas-line', 'propane', 'natural-gas', 'safety', 'piping'] },

  // ELECTRICAL SERVICES (Real-World Home Services)
  { id: 'electrical-general', name: 'Home Electrical Wiring', category: 'trades', subcategory: 'Electrical Services', keywords: ['electrical', 'wiring', 'outlets', 'switches', 'residential', 'home', 'light', 'electrician'] },
  { id: 'panel-upgrade', name: 'Breaker Panel Upgrades & Maintenance', category: 'trades', subcategory: 'Electrical Services', keywords: ['electrical', 'panel', 'breaker', 'fuse', 'upgrade', 'service-panel', 'electrician'] },
  { id: 'outlet-fixture-install', name: 'Outlet, Switch & Fixture Installation', category: 'trades', subcategory: 'Electrical Services', keywords: ['electrical', 'outlet', 'switch', 'gfci', 'dimmer', 'light-fixture', 'ceiling-fan'] },
  { id: 'smart-home-wiring', name: 'Smart Home Device Integration', category: 'trades', subcategory: 'Electrical Services', keywords: ['electrical', 'smart-home', 'nest', 'ring', 'doorbell', 'automation', 'wiring'] },
  { id: 'generator-install', name: 'Backup Generator Installation', category: 'trades', subcategory: 'Electrical Services', keywords: ['electrical', 'generator', 'backup-power', 'transfer-switch', 'emergency'] },
  { id: 'surge-protection', name: 'Whole-House Surge Protection', category: 'trades', subcategory: 'Electrical Services', keywords: ['electrical', 'surge', 'protector', 'voltage', 'safety', 'grounding'] },

  // HVAC & CLIMATE CONTROL (Real-World Home Services)
  { id: 'ac-repair', name: 'Air Conditioning Service & Repair', category: 'trades', subcategory: 'HVAC Services', keywords: ['hvac', 'ac', 'cooling', 'air-conditioner', 'refrigerant', 'condenser', 'compressor'] },
  { id: 'furnace-heating', name: 'Furnace & Heating System Repair', category: 'trades', subcategory: 'HVAC Services', keywords: ['hvac', 'heating', 'furnace', 'boiler', 'gas-heater', 'thermostat', 'maintenance'] },
  { id: 'heat-pump', name: 'Heat Pump Installation & Repair', category: 'trades', subcategory: 'HVAC Services', keywords: ['hvac', 'heat-pump', 'hybrid-heating', 'eco-friendly', 'efficiency'] },
  { id: 'ductwork', name: 'Duct Installation, Repair & Cleaning', category: 'trades', subcategory: 'HVAC Services', keywords: ['hvac', 'ductwork', 'ventilation', 'air-flow', 'sheet-metal', 'duct-cleaning'] },
  { id: 'thermostat-install', name: 'Smart Thermostat Setup & Calibration', category: 'trades', subcategory: 'HVAC Services', keywords: ['hvac', 'thermostat', 'ecobee', 'honeywell', 'calibration', 'wifi'] },

  // CARPENTRY & CONSTRUCTION TRADES
  { id: 'carpentry-general', name: 'Framing & Structural Carpentry', category: 'trades', subcategory: 'Carpentry', keywords: ['carpentry', 'wood', 'framing', 'timber', 'house-building', 'studs', 'construction'] },
  { id: 'finish-carpentry', name: 'Trim, Molding & Finish Carpentry', category: 'trades', subcategory: 'Carpentry', keywords: ['carpentry', 'trim', 'molding', 'baseboards', 'crown-molding', 'cabinetry', 'finishing'] },
  { id: 'deck-building', name: 'Deck & Patio Construction', category: 'trades', subcategory: 'Carpentry', keywords: ['carpentry', 'deck', 'patio', 'pergola', 'outdoor', 'woodworking', 'treated-wood'] },
  { id: 'cabinet-making', name: 'Custom Cabinet Making & Install', category: 'trades', subcategory: 'Carpentry', keywords: ['carpentry', 'cabinet', 'shelving', 'custom-woodwork', 'kitchen', 'pantry'] },
  { id: 'drywall-repair', name: 'Drywall Installation & Patching', category: 'trades', subcategory: 'Carpentry', keywords: ['carpentry', 'drywall', 'sheetrock', 'plaster', 'patching', 'taping', 'sanding', 'mudding'] },
  { id: 'flooring-install', name: 'Hardwood & Laminate Flooring Install', category: 'trades', subcategory: 'Carpentry', keywords: ['carpentry', 'flooring', 'hardwood', 'laminate', 'vinyl-plank', 'subfloor'] },

  // MASONRY, ROOFING & WELDING
  { id: 'bricklaying-masonry', name: 'Bricklaying & Stone Masonry', category: 'trades', subcategory: 'Construction Trades', keywords: ['masonry', 'brick', 'stone', 'mortar', 'retaining-wall', 'patio', 'fireplace'] },
  { id: 'concrete-work', name: 'Concrete Pouring & Finishing', category: 'trades', subcategory: 'Construction Trades', keywords: ['masonry', 'concrete', 'cement', 'driveway', 'sidewalk', 'slab', 'pouring', 'finishing'] },
  { id: 'roofing-repair', name: 'Roof Shingle Repair & Replacement', category: 'trades', subcategory: 'Construction Trades', keywords: ['roofing', 'shingles', 'tiles', 'roof', 'leak', 'tar', 'roof-inspection'] },
  { id: 'gutter-install', name: 'Gutter & Downspout Service', category: 'trades', subcategory: 'Construction Trades', keywords: ['roofing', 'gutters', 'downspouts', 'cleaning', 'guards', 'drainage'] },
  { id: 'mig-tig-welding', name: 'MIG & TIG Metal Welding', category: 'trades', subcategory: 'Construction Trades', keywords: ['welding', 'mig', 'tig', 'arc', 'metal-fabrication', 'soldering', 'steel', 'aluminum'] },
  { id: 'locksmith-service', name: 'Locksmithing & Rekeying', category: 'trades', subcategory: 'Security Services', keywords: ['locksmith', 'locks', 'keys', 'deadbolt', 'rekeying', 'emergency-lockout', 'smart-lock'] },

  // AUTOMOTIVE MAINTENANCE & SERVICES
  { id: 'oil-change', name: 'Oil & Filter Change Service', category: 'services', subcategory: 'Automotive Services', keywords: ['auto', 'car', 'oil-change', 'filter', 'fluids', 'maintenance', 'lube'] },
  { id: 'brake-repair', name: 'Brake Pad & Rotor Replacement', category: 'services', subcategory: 'Automotive Services', keywords: ['auto', 'car', 'brakes', 'brake-pads', 'rotors', 'calipers', 'mechanic', 'repair'] },
  { id: 'tire-service', name: 'Tire Installation, Rotation & Balance', category: 'services', subcategory: 'Automotive Services', keywords: ['auto', 'car', 'tires', 'alignment', 'balancing', 'rotation', 'puncture-repair'] },
  { id: 'engine-diagnostics', name: 'Engine Diagnostic Scanning (OBD-II)', category: 'services', subcategory: 'Automotive Services', keywords: ['auto', 'car', 'diagnostics', 'engine-light', 'obd2', 'scanner', 'mechanic', 'troubleshooting'] },
  { id: 'car-detailing', name: 'Professional Auto Detailing', category: 'services', subcategory: 'Automotive Services', keywords: ['auto', 'car', 'detailing', 'washing', 'waxing', 'polishing', 'interior-cleaning'] },
  { id: 'auto-electrical', name: 'Car Battery & Alternator Repair', category: 'services', subcategory: 'Automotive Services', keywords: ['auto', 'car', 'battery', 'alternator', 'starter-motor', 'wiring', 'fuse', 'spark-plug'] },

  // HOME CLEANING, LANDSCAPING & GENERAL REPAIR
  { id: 'house-cleaning', name: 'Residential House Cleaning', category: 'services', subcategory: 'Home Services', keywords: ['cleaning', 'house', 'maid', 'dusting', 'vacuuming', 'janitorial', 'deep-clean'] },
  { id: 'carpet-steam-clean', name: 'Carpet & Upholstery Steam Cleaning', category: 'services', subcategory: 'Home Services', keywords: ['cleaning', 'carpet', 'rug', 'steam-clean', 'shampooing', 'stain-removal'] },
  { id: 'window-washing', name: 'Residential & Commercial Window Washing', category: 'services', subcategory: 'Home Services', keywords: ['cleaning', 'windows', 'glass', 'squeegee', 'exterior'] },
  { id: 'pressure-washing', name: 'Driveway & Siding Pressure Washing', category: 'services', subcategory: 'Home Services', keywords: ['cleaning', 'pressure-washer', 'power-wash', 'deck', 'concrete', 'siding'] },
  { id: 'lawn-mowing', name: 'Lawn Mowing & Edging', category: 'blue-collar', subcategory: 'Landscaping', keywords: ['lawn', 'mowing', 'grass', 'edging', 'trimming', 'yard-work', 'gardening'] },
  { id: 'irrigation-sprinkler', name: 'Sprinkler System Install & Repair', category: 'blue-collar', subcategory: 'Landscaping', keywords: ['lawn', 'sprinklers', 'irrigation', 'valves', 'drip-system', 'leak-repair'] },
  { id: 'tree-trimming', name: 'Tree Pruning & Stumping', category: 'blue-collar', subcategory: 'Landscaping', keywords: ['lawn', 'tree', 'pruning', 'chainsaw', 'shrub-trimming', 'stump-removal'] },
  { id: 'pest-control', name: 'Pest Control & Extermination', category: 'services', subcategory: 'Home Services', keywords: ['pest', 'insects', 'bugs', 'termites', 'exterminator', 'rodents', 'traps'] },

  // GIG ECONOMY & ODD JOBS
  { id: 'furniture-assembly', name: 'Furniture Assembly (IKEA etc.)', category: 'odd-jobs', subcategory: 'Gig Economy', keywords: ['handyman', 'furniture', 'assembly', 'ikea', 'flatpack', 'desk', 'bed'] },
  { id: 'appliance-install', name: 'Home Appliance Installation', category: 'odd-jobs', subcategory: 'Gig Economy', keywords: ['handyman', 'appliance', 'dishwasher', 'microwave', 'fridge', 'washer', 'dryer'] },
  { id: 'tv-mounting', name: 'TV Wall Mounting & Bracket Setup', category: 'odd-jobs', subcategory: 'Gig Economy', keywords: ['handyman', 'tv-mount', 'drywall', 'anchors', 'stud-finder', 'cabling'] },
  { id: 'moving-help', name: 'Packing, Loading & Moving Assistance', category: 'odd-jobs', subcategory: 'Gig Economy', keywords: ['moving', 'packing', 'loading', 'unloading', 'truck', 'heavy-lifting'] },
  { id: 'dog-walking-sitting', name: 'Dog Walking & Pet Sitting', category: 'odd-jobs', subcategory: 'Gig Economy', keywords: ['pet-sitting', 'dog-walking', 'pet-care', 'cat-sitting', 'feeding'] },
  { id: 'snow-removal', name: 'Snow Shoveling & Blow Service', category: 'odd-jobs', subcategory: 'Gig Economy', keywords: ['yard-work', 'snow', 'shoveling', 'snowblower', 'salt-spreading', 'winter'] },

  // HEALTHCARE, WELLNESS & SERVICES
  { id: 'nursing-care', name: 'In-Home Nursing Support', category: 'healthcare', subcategory: 'Care Services', keywords: ['nurse', 'rn', 'lpn', 'medical', 'clinical', 'home-health'] },
  { id: 'elder-caregiving', name: 'Elder Care & Companion Services', category: 'healthcare', subcategory: 'Care Services', keywords: ['elder-care', 'senior-care', 'caregiver', 'mobility', 'hygiene', 'medication-reminder'] },
  { id: 'childcare-nanny', name: 'Nannying & Child Development', category: 'healthcare', subcategory: 'Care Services', keywords: ['childcare', 'babysitter', 'nanny', 'cpr', 'infant', 'toddler'] },
  { id: 'physical-therapy', name: 'Physical Therapy Assistance', category: 'healthcare', subcategory: 'Clinical', keywords: ['pt', 'rehabilitation', 'exercises', 'mobility', 'injury-recovery'] },
  { id: 'massage-therapy', name: 'Massage Therapy (Swedish, Deep Tissue)', category: 'healthcare', subcategory: 'Wellness', keywords: ['massage', 'masseur', 'relaxation', 'deep-tissue', 'swedish', 'sports-massage'] },
  { id: 'personal-trainer', name: 'Personal Training & Fitness Coaching', category: 'healthcare', subcategory: 'Fitness', keywords: ['fitness', 'workout', 'gym', 'coach', 'cardio', 'weight-loss'] },

  // EDUCATION & HOSPITALITY SERVICES
  { id: 'academic-tutoring', name: 'Academic Tutoring (Math, Science, English)', category: 'education', subcategory: 'Teaching', keywords: ['tutor', 'math', 'science', 'sat', 'act', 'test-prep', 'homework-help'] },
  { id: 'language-translation', name: 'Document Translation Services', category: 'education', subcategory: 'Language', keywords: ['translation', 'translator', 'bilingual', 'spanish', 'french', 'german', 'mandarin'] },
  { id: 'cooking-prep', name: 'Line & Prep Cook Skills', category: 'hospitality', subcategory: 'Food Services', keywords: ['cook', 'chef', 'kitchen', 'food-safety', 'knife-skills', 'restaurant'] },
  { id: 'bartending-mixology', name: 'Bartending & Mixology', category: 'hospitality', subcategory: 'Food Services', keywords: ['bartender', 'bar', 'drinks', 'mixology', 'customer-service', 'alcohol-safety'] },
  { id: 'barista-skills', name: 'Barista Espresso Operations', category: 'hospitality', subcategory: 'Food Services', keywords: ['barista', 'coffee', 'espresso', 'latte-art', 'cafe'] },
  { id: 'hotel-front-desk', name: 'Hotel Reception & Front Desk Ops', category: 'hospitality', subcategory: 'Lodging Services', keywords: ['hotel', 'reception', 'guest-relations', 'front-desk', 'booking'] },
  { id: 'event-planning-coordination', name: 'Event Planning & Coordination', category: 'hospitality', subcategory: 'Event Services', keywords: ['event', 'wedding', 'party', 'conference', 'catering', 'logistics'] }
]
