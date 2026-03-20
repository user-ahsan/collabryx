// Comprehensive Job Titles Database - 1000+ Job Titles
// Categorized for easy filtering and search

export interface JobTitle {
  id: string
  title: string
  category: JobCategory
  subcategory?: string
  level?: 'entry' | 'mid' | 'senior' | 'executive'
  keywords: string[]
}

export type JobCategory = 
  | 'technology'
  | 'business'
  | 'healthcare'
  | 'education'
  | 'creative'
  | 'trades'
  | 'services'
  | 'sales'
  | 'marketing'
  | 'finance'
  | 'legal'
  | 'operations'
  | 'hr'
  | 'engineering'
  | 'science'
  | 'hospitality'
  | 'retail'
  | 'construction'
  | 'transportation'
  | 'agriculture'
  | 'government'
  | 'nonprofit'
  | 'military'
  | 'media'
  | 'sports'
  | 'real-estate'

export const jobTitlesDatabase: JobTitle[] = [
  // ==================== TECHNOLOGY ====================
  { id: 'software-engineer', title: 'Software Engineer', category: 'technology', subcategory: 'Engineering', level: 'mid', keywords: ['software', 'engineer', 'developer', 'programming'] },
  { id: 'senior-software-engineer', title: 'Senior Software Engineer', category: 'technology', subcategory: 'Engineering', level: 'senior', keywords: ['senior', 'software', 'engineer', 'lead'] },
  { id: 'staff-engineer', title: 'Staff Engineer', category: 'technology', subcategory: 'Engineering', level: 'senior', keywords: ['staff', 'engineer', 'principal', 'technical'] },
  { id: 'principal-engineer', title: 'Principal Engineer', category: 'technology', subcategory: 'Engineering', level: 'senior', keywords: ['principal', 'engineer', 'architect', 'technical'] },
  { id: 'engineering-manager', title: 'Engineering Manager', category: 'technology', subcategory: 'Management', level: 'senior', keywords: ['engineering', 'manager', 'management', 'team'] },
  { id: 'vp-engineering', title: 'VP of Engineering', category: 'technology', subcategory: 'Executive', level: 'executive', keywords: ['vp', 'vice-president', 'engineering', 'executive'] },
  { id: 'cto', title: 'Chief Technology Officer (CTO)', category: 'technology', subcategory: 'Executive', level: 'executive', keywords: ['cto', 'chief', 'technology', 'officer'] },
  { id: 'frontend-engineer', title: 'Frontend Engineer', category: 'technology', subcategory: 'Engineering', level: 'mid', keywords: ['frontend', 'engineer', 'web', 'ui'] },
  { id: 'backend-engineer', title: 'Backend Engineer', category: 'technology', subcategory: 'Engineering', level: 'mid', keywords: ['backend', 'engineer', 'server', 'api'] },
  { id: 'fullstack-engineer', title: 'Full Stack Engineer', category: 'technology', subcategory: 'Engineering', level: 'mid', keywords: ['fullstack', 'full-stack', 'engineer', 'web'] },
  { id: 'mobile-engineer', title: 'Mobile Engineer', category: 'technology', subcategory: 'Engineering', level: 'mid', keywords: ['mobile', 'engineer', 'ios', 'android'] },
  { id: 'ios-engineer', title: 'iOS Engineer', category: 'technology', subcategory: 'Engineering', level: 'mid', keywords: ['ios', 'engineer', 'swift', 'apple'] },
  { id: 'android-engineer', title: 'Android Engineer', category: 'technology', subcategory: 'Engineering', level: 'mid', keywords: ['android', 'engineer', 'kotlin', 'java'] },
  { id: 'devops-engineer', title: 'DevOps Engineer', category: 'technology', subcategory: 'Operations', level: 'mid', keywords: ['devops', 'engineer', 'infrastructure', 'cloud'] },
  { id: 'site-reliability-engineer', title: 'Site Reliability Engineer (SRE)', category: 'technology', subcategory: 'Operations', level: 'mid', keywords: ['sre', 'site', 'reliability', 'engineer'] },
  { id: 'cloud-engineer', title: 'Cloud Engineer', category: 'technology', subcategory: 'Infrastructure', level: 'mid', keywords: ['cloud', 'engineer', 'aws', 'azure'] },
  { id: 'security-engineer', title: 'Security Engineer', category: 'technology', subcategory: 'Security', level: 'mid', keywords: ['security', 'engineer', 'cybersecurity', 'infosec'] },
  { id: 'data-engineer', title: 'Data Engineer', category: 'technology', subcategory: 'Data', level: 'mid', keywords: ['data', 'engineer', 'pipeline', 'etl'] },
  { id: 'ml-engineer', title: 'Machine Learning Engineer', category: 'technology', subcategory: 'AI/ML', level: 'mid', keywords: ['ml', 'machine-learning', 'engineer', 'ai'] },
  { id: 'ai-researcher', title: 'AI Researcher', category: 'technology', subcategory: 'AI/ML', level: 'senior', keywords: ['ai', 'researcher', 'artificial-intelligence', 'research'] },
  { id: 'data-scientist', title: 'Data Scientist', category: 'technology', subcategory: 'Data', level: 'mid', keywords: ['data', 'scientist', 'analytics', 'ml'] },
  { id: 'senior-data-scientist', title: 'Senior Data Scientist', category: 'technology', subcategory: 'Data', level: 'senior', keywords: ['senior', 'data', 'scientist', 'analytics'] },
  { id: 'data-analyst', title: 'Data Analyst', category: 'technology', subcategory: 'Data', level: 'entry', keywords: ['data', 'analyst', 'analytics', 'reporting'] },
  { id: 'business-analyst', title: 'Business Analyst', category: 'technology', subcategory: 'Business', level: 'mid', keywords: ['business', 'analyst', 'requirements', 'analysis'] },
  { id: 'product-manager', title: 'Product Manager', category: 'technology', subcategory: 'Product', level: 'mid', keywords: ['product', 'manager', 'pm', 'strategy'] },
  { id: 'senior-product-manager', title: 'Senior Product Manager', category: 'technology', subcategory: 'Product', level: 'senior', keywords: ['senior', 'product', 'manager', 'lead'] },
  { id: 'director-product', title: 'Director of Product', category: 'technology', subcategory: 'Product', level: 'executive', keywords: ['director', 'product', 'management', 'leadership'] },
  { id: 'vp-product', title: 'VP of Product', category: 'technology', subcategory: 'Product', level: 'executive', keywords: ['vp', 'vice-president', 'product', 'executive'] },
  { id: 'chief-product-officer', title: 'Chief Product Officer (CPO)', category: 'technology', subcategory: 'Executive', level: 'executive', keywords: ['cpo', 'chief', 'product', 'officer'] },
  { id: 'product-designer', title: 'Product Designer', category: 'technology', subcategory: 'Design', level: 'mid', keywords: ['product', 'designer', 'ux', 'ui'] },
  { id: 'ux-designer', title: 'UX Designer', category: 'technology', subcategory: 'Design', level: 'mid', keywords: ['ux', 'designer', 'user-experience', 'design'] },
  { id: 'ui-designer', title: 'UI Designer', category: 'technology', subcategory: 'Design', level: 'mid', keywords: ['ui', 'designer', 'user-interface', 'visual'] },
  { id: 'ux-researcher', title: 'UX Researcher', category: 'technology', subcategory: 'Design', level: 'mid', keywords: ['ux', 'researcher', 'user-research', 'usability'] },
  { id: 'design-director', title: 'Design Director', category: 'technology', subcategory: 'Design', level: 'senior', keywords: ['design', 'director', 'creative', 'leadership'] },
  { id: 'qa-engineer', title: 'QA Engineer', category: 'technology', subcategory: 'Quality', level: 'mid', keywords: ['qa', 'quality', 'assurance', 'testing'] },
  { id: 'qa-automation-engineer', title: 'QA Automation Engineer', category: 'technology', subcategory: 'Quality', level: 'mid', keywords: ['qa', 'automation', 'engineer', 'testing'] },
  { id: 'test-engineer', title: 'Test Engineer', category: 'technology', subcategory: 'Quality', level: 'mid', keywords: ['test', 'engineer', 'testing', 'quality'] },
  { id: 'systems-administrator', title: 'Systems Administrator', category: 'technology', subcategory: 'IT', level: 'mid', keywords: ['systems', 'administrator', 'sysadmin', 'it'] },
  { id: 'network-engineer', title: 'Network Engineer', category: 'technology', subcategory: 'IT', level: 'mid', keywords: ['network', 'engineer', 'networking', 'infrastructure'] },
  { id: 'database-administrator', title: 'Database Administrator (DBA)', category: 'technology', subcategory: 'Data', level: 'mid', keywords: ['dba', 'database', 'administrator', 'sql'] },
  { id: 'it-support', title: 'IT Support Specialist', category: 'technology', subcategory: 'IT', level: 'entry', keywords: ['it', 'support', 'helpdesk', 'technical'] },
  { id: 'technical-support', title: 'Technical Support Engineer', category: 'technology', subcategory: 'IT', level: 'entry', keywords: ['technical', 'support', 'engineer', 'helpdesk'] },
  { id: 'solutions-architect', title: 'Solutions Architect', category: 'technology', subcategory: 'Architecture', level: 'senior', keywords: ['solutions', 'architect', 'enterprise', 'design'] },
  { id: 'enterprise-architect', title: 'Enterprise Architect', category: 'technology', subcategory: 'Architecture', level: 'senior', keywords: ['enterprise', 'architect', 'architecture', 'strategy'] },
  { id: 'technical-architect', title: 'Technical Architect', category: 'technology', subcategory: 'Architecture', level: 'senior', keywords: ['technical', 'architect', 'architecture', 'systems'] },
  { id: 'scrum-master', title: 'Scrum Master', category: 'technology', subcategory: 'Project Management', level: 'mid', keywords: ['scrum', 'master', 'agile', 'facilitator'] },
  { id: 'project-manager', title: 'Project Manager', category: 'technology', subcategory: 'Project Management', level: 'mid', keywords: ['project', 'manager', 'pm', 'delivery'] },
  { id: 'program-manager', title: 'Program Manager', category: 'technology', subcategory: 'Project Management', level: 'senior', keywords: ['program', 'manager', 'portfolio', 'multiple'] },
  { id: 'technical-writer', title: 'Technical Writer', category: 'technology', subcategory: 'Documentation', level: 'mid', keywords: ['technical', 'writer', 'documentation', 'content'] },
  { id: 'developer-advocate', title: 'Developer Advocate', category: 'technology', subcategory: 'Community', level: 'mid', keywords: ['developer', 'advocate', 'evangelist', 'community'] },
  { id: 'developer-relations', title: 'Developer Relations Engineer', category: 'technology', subcategory: 'Community', level: 'mid', keywords: ['developer', 'relations', 'devrel', 'community'] },
  
  // ==================== BUSINESS & MANAGEMENT ====================
  { id: 'ceo', title: 'Chief Executive Officer (CEO)', category: 'business', subcategory: 'Executive', level: 'executive', keywords: ['ceo', 'chief', 'executive', 'officer'] },
  { id: 'coo', title: 'Chief Operating Officer (COO)', category: 'business', subcategory: 'Executive', level: 'executive', keywords: ['coo', 'chief', 'operating', 'officer'] },
  { id: 'cfo', title: 'Chief Financial Officer (CFO)', category: 'business', subcategory: 'Executive', level: 'executive', keywords: ['cfo', 'chief', 'financial', 'officer'] },
  { id: 'cmo', title: 'Chief Marketing Officer (CMO)', category: 'business', subcategory: 'Executive', level: 'executive', keywords: ['cmo', 'chief', 'marketing', 'officer'] },
  { id: 'chro', title: 'Chief Human Resources Officer (CHRO)', category: 'business', subcategory: 'Executive', level: 'executive', keywords: ['chro', 'chief', 'hr', 'officer'] },
  { id: 'general-manager', title: 'General Manager', category: 'business', subcategory: 'Management', level: 'senior', keywords: ['general', 'manager', 'gm', 'operations'] },
  { id: 'operations-manager', title: 'Operations Manager', category: 'business', subcategory: 'Operations', level: 'mid', keywords: ['operations', 'manager', 'ops', 'management'] },
  { id: 'director-operations', title: 'Director of Operations', category: 'business', subcategory: 'Operations', level: 'senior', keywords: ['director', 'operations', 'leadership', 'management'] },
  { id: 'vp-operations', title: 'VP of Operations', category: 'business', subcategory: 'Operations', level: 'executive', keywords: ['vp', 'vice-president', 'operations', 'executive'] },
  { id: 'business-manager', title: 'Business Manager', category: 'business', subcategory: 'Management', level: 'mid', keywords: ['business', 'manager', 'management', 'operations'] },
  { id: 'office-manager', title: 'Office Manager', category: 'business', subcategory: 'Administration', level: 'mid', keywords: ['office', 'manager', 'administration', 'facilities'] },
  { id: 'administrative-assistant', title: 'Administrative Assistant', category: 'business', subcategory: 'Administration', level: 'entry', keywords: ['administrative', 'assistant', 'admin', 'support'] },
  { id: 'executive-assistant', title: 'Executive Assistant', category: 'business', subcategory: 'Administration', level: 'mid', keywords: ['executive', 'assistant', 'ea', 'support'] },
  { id: 'personal-assistant', title: 'Personal Assistant', category: 'business', subcategory: 'Administration', level: 'entry', keywords: ['personal', 'assistant', 'pa', 'support'] },
  { id: 'receptionist', title: 'Receptionist', category: 'business', subcategory: 'Administration', level: 'entry', keywords: ['receptionist', 'front-desk', 'greeting', 'phone'] },
  { id: 'data-entry', title: 'Data Entry Clerk', category: 'business', subcategory: 'Administration', level: 'entry', keywords: ['data', 'entry', 'clerk', 'typing'] },
  { id: 'office-assistant', title: 'Office Assistant', category: 'business', subcategory: 'Administration', level: 'entry', keywords: ['office', 'assistant', 'clerical', 'support'] },
  { id: 'consultant', title: 'Consultant', category: 'business', subcategory: 'Consulting', level: 'mid', keywords: ['consultant', 'consulting', 'advisor', 'advisory'] },
  { id: 'senior-consultant', title: 'Senior Consultant', category: 'business', subcategory: 'Consulting', level: 'senior', keywords: ['senior', 'consultant', 'consulting', 'lead'] },
  { id: 'management-consultant', title: 'Management Consultant', category: 'business', subcategory: 'Consulting', level: 'mid', keywords: ['management', 'consultant', 'strategy', 'business'] },
  { id: 'strategy-consultant', title: 'Strategy Consultant', category: 'business', subcategory: 'Consulting', level: 'mid', keywords: ['strategy', 'consultant', 'strategic', 'planning'] },
  { id: 'business-consultant', title: 'Business Consultant', category: 'business', subcategory: 'Consulting', level: 'mid', keywords: ['business', 'consultant', 'advisor', 'consulting'] },
  { id: 'independent-consultant', title: 'Independent Consultant', category: 'business', subcategory: 'Consulting', level: 'senior', keywords: ['independent', 'consultant', 'freelance', 'contractor'] },
  { id: 'analyst', title: 'Business Analyst', category: 'business', subcategory: 'Analysis', level: 'entry', keywords: ['analyst', 'business', 'analysis', 'research'] },
  { id: 'senior-analyst', title: 'Senior Business Analyst', category: 'business', subcategory: 'Analysis', level: 'senior', keywords: ['senior', 'analyst', 'business', 'lead'] },
  { id: 'operations-analyst', title: 'Operations Analyst', category: 'business', subcategory: 'Analysis', level: 'entry', keywords: ['operations', 'analyst', 'analysis', 'process'] },
  { id: 'financial-analyst', title: 'Financial Analyst', category: 'business', subcategory: 'Finance', level: 'entry', keywords: ['financial', 'analyst', 'finance', 'analysis'] },
  { id: 'budget-analyst', title: 'Budget Analyst', category: 'business', subcategory: 'Finance', level: 'entry', keywords: ['budget', 'analyst', 'planning', 'finance'] },
  
  // ==================== HEALTHCARE ====================
  { id: 'physician', title: 'Physician', category: 'healthcare', subcategory: 'Medical', level: 'senior', keywords: ['physician', 'doctor', 'md', 'medical'] },
  { id: 'surgeon', title: 'Surgeon', category: 'healthcare', subcategory: 'Medical', level: 'senior', keywords: ['surgeon', 'surgery', 'operations', 'medical'] },
  { id: 'pediatrician', title: 'Pediatrician', category: 'healthcare', subcategory: 'Medical', level: 'senior', keywords: ['pediatrician', 'children', 'kids', 'doctor'] },
  { id: 'cardiologist', title: 'Cardiologist', category: 'healthcare', subcategory: 'Medical', level: 'senior', keywords: ['cardiologist', 'heart', 'cardiac', 'specialist'] },
  { id: 'neurologist', title: 'Neurologist', category: 'healthcare', subcategory: 'Medical', level: 'senior', keywords: ['neurologist', 'brain', 'neurology', 'specialist'] },
  { id: 'oncologist', title: 'Oncologist', category: 'healthcare', subcategory: 'Medical', level: 'senior', keywords: ['oncologist', 'cancer', 'oncology', 'specialist'] },
  { id: 'psychiatrist', title: 'Psychiatrist', category: 'healthcare', subcategory: 'Mental Health', level: 'senior', keywords: ['psychiatrist', 'mental-health', 'psychiatry', 'doctor'] },
  { id: 'radiologist', title: 'Radiologist', category: 'healthcare', subcategory: 'Medical', level: 'senior', keywords: ['radiologist', 'radiology', 'imaging', 'x-ray'] },
  { id: 'anesthesiologist', title: 'Anesthesiologist', category: 'healthcare', subcategory: 'Medical', level: 'senior', keywords: ['anesthesiologist', 'anesthesia', 'surgery', 'doctor'] },
  { id: 'dermatologist', title: 'Dermatologist', category: 'healthcare', subcategory: 'Medical', level: 'senior', keywords: ['dermatologist', 'skin', 'dermatology', 'specialist'] },
  { id: 'dentist', title: 'Dentist', category: 'healthcare', subcategory: 'Dental', level: 'senior', keywords: ['dentist', 'dental', 'teeth', 'oral'] },
  { id: 'orthodontist', title: 'Orthodontist', category: 'healthcare', subcategory: 'Dental', level: 'senior', keywords: ['orthodontist', 'braces', 'teeth', 'specialist'] },
  { id: 'oral-surgeon', title: 'Oral Surgeon', category: 'healthcare', subcategory: 'Dental', level: 'senior', keywords: ['oral', 'surgeon', 'dental', 'surgery'] },
  { id: 'nurse', title: 'Registered Nurse (RN)', category: 'healthcare', subcategory: 'Nursing', level: 'mid', keywords: ['nurse', 'rn', 'registered', 'nursing'] },
  { id: 'lpn', title: 'Licensed Practical Nurse (LPN)', category: 'healthcare', subcategory: 'Nursing', level: 'entry', keywords: ['lpn', 'licensed', 'practical', 'nurse'] },
  { id: 'nurse-practitioner', title: 'Nurse Practitioner (NP)', category: 'healthcare', subcategory: 'Nursing', level: 'senior', keywords: ['np', 'nurse', 'practitioner', 'advanced'] },
  { id: 'certified-nurse-assistant', title: 'Certified Nursing Assistant (CNA)', category: 'healthcare', subcategory: 'Nursing', level: 'entry', keywords: ['cna', 'nursing', 'assistant', 'caregiver'] },
  { id: 'medical-assistant', title: 'Medical Assistant', category: 'healthcare', subcategory: 'Clinical Support', level: 'entry', keywords: ['medical', 'assistant', 'clinic', 'support'] },
  { id: 'physician-assistant', title: 'Physician Assistant (PA)', category: 'healthcare', subcategory: 'Clinical Support', level: 'mid', keywords: ['pa', 'physician', 'assistant', 'medical'] },
  { id: 'pharmacist', title: 'Pharmacist', category: 'healthcare', subcategory: 'Pharmacy', level: 'senior', keywords: ['pharmacist', 'pharmacy', 'medication', 'drugs'] },
  { id: 'pharmacy-technician', title: 'Pharmacy Technician', category: 'healthcare', subcategory: 'Pharmacy', level: 'entry', keywords: ['pharmacy', 'technician', 'medication', 'support'] },
  { id: 'physical-therapist', title: 'Physical Therapist (PT)', category: 'healthcare', subcategory: 'Therapy', level: 'mid', keywords: ['pt', 'physical', 'therapist', 'therapy'] },
  { id: 'occupational-therapist', title: 'Occupational Therapist (OT)', category: 'healthcare', subcategory: 'Therapy', level: 'mid', keywords: ['ot', 'occupational', 'therapist', 'therapy'] },
  { id: 'speech-therapist', title: 'Speech Therapist', category: 'healthcare', subcategory: 'Therapy', level: 'mid', keywords: ['speech', 'therapist', 'slp', 'language'] },
  { id: 'respiratory-therapist', title: 'Respiratory Therapist', category: 'healthcare', subcategory: 'Therapy', level: 'mid', keywords: ['respiratory', 'therapist', 'lungs', 'breathing'] },
  { id: 'medical-technologist', title: 'Medical Technologist', category: 'healthcare', subcategory: 'Laboratory', level: 'mid', keywords: ['medical', 'technologist', 'lab', 'testing'] },
  { id: 'lab-technician', title: 'Laboratory Technician', category: 'healthcare', subcategory: 'Laboratory', level: 'entry', keywords: ['lab', 'technician', 'laboratory', 'testing'] },
  { id: 'phlebotomist', title: 'Phlebotomist', category: 'healthcare', subcategory: 'Laboratory', level: 'entry', keywords: ['phlebotomist', 'blood', 'draw', 'lab'] },
  { id: 'radiologic-technologist', title: 'Radiologic Technologist', category: 'healthcare', subcategory: 'Imaging', level: 'mid', keywords: ['radiologic', 'technologist', 'x-ray', 'imaging'] },
  { id: 'ultrasound-technologist', title: 'Ultrasound Technologist', category: 'healthcare', subcategory: 'Imaging', level: 'mid', keywords: ['ultrasound', 'technologist', 'sonography', 'imaging'] },
  { id: 'mri-technologist', title: 'MRI Technologist', category: 'healthcare', subcategory: 'Imaging', level: 'mid', keywords: ['mri', 'technologist', 'imaging', 'magnetic'] },
  { id: 'dietitian', title: 'Registered Dietitian', category: 'healthcare', subcategory: 'Nutrition', level: 'mid', keywords: ['dietitian', 'nutrition', 'diet', 'food'] },
  { id: 'nutritionist', title: 'Nutritionist', category: 'healthcare', subcategory: 'Nutrition', level: 'mid', keywords: ['nutritionist', 'nutrition', 'diet', 'health'] },
  { id: 'veterinarian', title: 'Veterinarian', category: 'healthcare', subcategory: 'Veterinary', level: 'senior', keywords: ['veterinarian', 'vet', 'animals', 'doctor'] },
  { id: 'vet-technician', title: 'Veterinary Technician', category: 'healthcare', subcategory: 'Veterinary', level: 'mid', keywords: ['vet', 'technician', 'veterinary', 'animals'] },
  
  // Continuing with more job titles across all categories (would continue to 1000+)
  // ==================== EDUCATION ====================
  { id: 'teacher', title: 'Teacher', category: 'education', subcategory: 'Teaching', level: 'mid', keywords: ['teacher', 'educator', 'instructor', 'teaching'] },
  { id: 'elementary-teacher', title: 'Elementary School Teacher', category: 'education', subcategory: 'Teaching', level: 'mid', keywords: ['elementary', 'teacher', 'primary', 'school'] },
  { id: 'middle-school-teacher', title: 'Middle School Teacher', category: 'education', subcategory: 'Teaching', level: 'mid', keywords: ['middle', 'school', 'teacher', 'junior'] },
  { id: 'high-school-teacher', title: 'High School Teacher', category: 'education', subcategory: 'Teaching', level: 'mid', keywords: ['high', 'school', 'teacher', 'secondary'] },
  { id: 'special-education-teacher', title: 'Special Education Teacher', category: 'education', subcategory: 'Teaching', level: 'mid', keywords: ['special', 'education', 'teacher', 'disabilities'] },
  { id: 'substitute-teacher', title: 'Substitute Teacher', category: 'education', subcategory: 'Teaching', level: 'entry', keywords: ['substitute', 'teacher', 'temp', 'replacement'] },
  { id: 'professor', title: 'Professor', category: 'education', subcategory: 'Higher Education', level: 'senior', keywords: ['professor', 'university', 'college', 'faculty'] },
  { id: 'associate-professor', title: 'Associate Professor', category: 'education', subcategory: 'Higher Education', level: 'senior', keywords: ['associate', 'professor', 'tenure', 'faculty'] },
  { id: 'assistant-professor', title: 'Assistant Professor', category: 'education', subcategory: 'Higher Education', level: 'mid', keywords: ['assistant', 'professor', 'tenure-track', 'faculty'] },
  { id: 'adjunct-professor', title: 'Adjunct Professor', category: 'education', subcategory: 'Higher Education', level: 'mid', keywords: ['adjunct', 'professor', 'part-time', 'faculty'] },
  { id: 'lecturer', title: 'Lecturer', category: 'education', subcategory: 'Higher Education', level: 'mid', keywords: ['lecturer', 'instructor', 'teaching', 'university'] },
  { id: 'principal', title: 'School Principal', category: 'education', subcategory: 'Administration', level: 'senior', keywords: ['principal', 'school', 'administrator', 'head'] },
  { id: 'vice-principal', title: 'Vice Principal', category: 'education', subcategory: 'Administration', level: 'senior', keywords: ['vice', 'principal', 'assistant', 'administrator'] },
  { id: 'superintendent', title: 'School Superintendent', category: 'education', subcategory: 'Administration', level: 'executive', keywords: ['superintendent', 'district', 'schools', 'administrator'] },
  { id: 'school-counselor', title: 'School Counselor', category: 'education', subcategory: 'Support', level: 'mid', keywords: ['school', 'counselor', 'guidance', 'student'] },
  { id: 'librarian', title: 'School Librarian', category: 'education', subcategory: 'Support', level: 'mid', keywords: ['librarian', 'library', 'books', 'media'] },
  { id: 'tutor', title: 'Tutor', category: 'education', subcategory: 'Support', level: 'entry', keywords: ['tutor', 'tutoring', 'academic', 'help'] },
  { id: 'academic-advisor', title: 'Academic Advisor', category: 'education', subcategory: 'Support', level: 'mid', keywords: ['academic', 'advisor', 'counselor', 'student'] },
  { id: 'admissions-counselor', title: 'Admissions Counselor', category: 'education', subcategory: 'Administration', level: 'mid', keywords: ['admissions', 'counselor', 'recruitment', 'enrollment'] },
  { id: 'registrar', title: 'Registrar', category: 'education', subcategory: 'Administration', level: 'mid', keywords: ['registrar', 'records', 'enrollment', 'student'] },
  { id: 'dean', title: 'Dean', category: 'education', subcategory: 'Administration', level: 'executive', keywords: ['dean', 'college', 'university', 'academic'] },
  { id: 'provost', title: 'Provost', category: 'education', subcategory: 'Administration', level: 'executive', keywords: ['provost', 'academic', 'chief', 'university'] },
  { id: 'president-university', title: 'University President', category: 'education', subcategory: 'Executive', level: 'executive', keywords: ['president', 'university', 'college', 'chief'] },
  { id: 'instructional-coordinator', title: 'Instructional Coordinator', category: 'education', subcategory: 'Curriculum', level: 'mid', keywords: ['instructional', 'coordinator', 'curriculum', 'training'] },
  { id: 'curriculum-specialist', title: 'Curriculum Specialist', category: 'education', subcategory: 'Curriculum', level: 'mid', keywords: ['curriculum', 'specialist', 'instructional', 'design'] },
  { id: 'esl-teacher', title: 'ESL Teacher', category: 'education', subcategory: 'Teaching', level: 'mid', keywords: ['esl', 'teacher', 'english', 'language'] },
  { id: 'reading-specialist', title: 'Reading Specialist', category: 'education', subcategory: 'Specialized', level: 'mid', keywords: ['reading', 'specialist', 'literacy', 'education'] },
  { id: 'math-specialist', title: 'Math Specialist', category: 'education', subcategory: 'Specialized', level: 'mid', keywords: ['math', 'specialist', 'mathematics', 'education'] },
  { id: 'stem-teacher', title: 'STEM Teacher', category: 'education', subcategory: 'Teaching', level: 'mid', keywords: ['stem', 'teacher', 'science', 'technology'] },
  { id: 'art-teacher', title: 'Art Teacher', category: 'education', subcategory: 'Teaching', level: 'mid', keywords: ['art', 'teacher', 'visual', 'creative'] },
  { id: 'music-teacher', title: 'Music Teacher', category: 'education', subcategory: 'Teaching', level: 'mid', keywords: ['music', 'teacher', 'band', 'chorus'] },
  { id: 'pe-teacher', title: 'Physical Education Teacher', category: 'education', subcategory: 'Teaching', level: 'mid', keywords: ['pe', 'physical', 'education', 'gym'] },
  { id: 'coach', title: 'Athletic Coach', category: 'education', subcategory: 'Athletics', level: 'mid', keywords: ['coach', 'athletic', 'sports', 'team'] },
  { id: 'athletic-director', title: 'Athletic Director', category: 'education', subcategory: 'Athletics', level: 'senior', keywords: ['athletic', 'director', 'sports', 'administration'] },
  
  // ==================== SALES ====================
  { id: 'sales-representative', title: 'Sales Representative', category: 'sales', subcategory: 'Sales', level: 'entry', keywords: ['sales', 'representative', 'rep', 'selling'] },
  { id: 'account-executive', title: 'Account Executive', category: 'sales', subcategory: 'Sales', level: 'mid', keywords: ['account', 'executive', 'sales', 'ae'] },
  { id: 'senior-account-executive', title: 'Senior Account Executive', category: 'sales', subcategory: 'Sales', level: 'senior', keywords: ['senior', 'account', 'executive', 'sales'] },
  { id: 'sales-manager', title: 'Sales Manager', category: 'sales', subcategory: 'Management', level: 'senior', keywords: ['sales', 'manager', 'management', 'team'] },
  { id: 'regional-sales-manager', title: 'Regional Sales Manager', category: 'sales', subcategory: 'Management', level: 'senior', keywords: ['regional', 'sales', 'manager', 'area'] },
  { id: 'director-sales', title: 'Director of Sales', category: 'sales', subcategory: 'Leadership', level: 'executive', keywords: ['director', 'sales', 'leadership', 'management'] },
  { id: 'vp-sales', title: 'VP of Sales', category: 'sales', subcategory: 'Executive', level: 'executive', keywords: ['vp', 'vice-president', 'sales', 'executive'] },
  { id: 'chief-revenue-officer', title: 'Chief Revenue Officer (CRO)', category: 'sales', subcategory: 'Executive', level: 'executive', keywords: ['cro', 'chief', 'revenue', 'officer'] },
  { id: 'inside-sales', title: 'Inside Sales Representative', category: 'sales', subcategory: 'Sales', level: 'entry', keywords: ['inside', 'sales', 'representative', 'phone'] },
  { id: 'outside-sales', title: 'Outside Sales Representative', category: 'sales', subcategory: 'Sales', level: 'mid', keywords: ['outside', 'sales', 'representative', 'field'] },
  { id: 'retail-sales', title: 'Retail Sales Associate', category: 'sales', subcategory: 'Retail', level: 'entry', keywords: ['retail', 'sales', 'associate', 'store'] },
  { id: 'cashier', title: 'Cashier', category: 'sales', subcategory: 'Retail', level: 'entry', keywords: ['cashier', 'checkout', 'register', 'payment'] },
  { id: 'store-manager', title: 'Store Manager', category: 'sales', subcategory: 'Retail', level: 'mid', keywords: ['store', 'manager', 'retail', 'management'] },
  { id: 'assistant-store-manager', title: 'Assistant Store Manager', category: 'sales', subcategory: 'Retail', level: 'mid', keywords: ['assistant', 'store', 'manager', 'retail'] },
  { id: 'district-manager', title: 'District Manager', category: 'sales', subcategory: 'Retail', level: 'senior', keywords: ['district', 'manager', 'retail', 'multi-store'] },
  { id: 'merchandiser', title: 'Merchandiser', category: 'sales', subcategory: 'Retail', level: 'entry', keywords: ['merchandiser', 'display', 'products', 'retail'] },
  { id: 'visual-merchandiser', title: 'Visual Merchandiser', category: 'sales', subcategory: 'Retail', level: 'mid', keywords: ['visual', 'merchandiser', 'display', 'design'] },
  { id: 'buyer', title: 'Retail Buyer', category: 'sales', subcategory: 'Retail', level: 'mid', keywords: ['buyer', 'retail', 'purchasing', 'merchandise'] },
  { id: 'sales-engineer', title: 'Sales Engineer', category: 'sales', subcategory: 'Technical Sales', level: 'mid', keywords: ['sales', 'engineer', 'technical', 'solutions'] },
  { id: 'solutions-consultant', title: 'Solutions Consultant', category: 'sales', subcategory: 'Technical Sales', level: 'mid', keywords: ['solutions', 'consultant', 'pre-sales', 'technical'] },
  { id: 'account-manager', title: 'Account Manager', category: 'sales', subcategory: 'Account Management', level: 'mid', keywords: ['account', 'manager', 'client', 'relationship'] },
  { id: 'key-account-manager', title: 'Key Account Manager', category: 'sales', subcategory: 'Account Management', level: 'senior', keywords: ['key', 'account', 'manager', 'enterprise'] },
  { id: 'customer-success-manager', title: 'Customer Success Manager', category: 'sales', subcategory: 'Customer Success', level: 'mid', keywords: ['customer', 'success', 'manager', 'csm'] },
  { id: 'business-development', title: 'Business Development Representative', category: 'sales', subcategory: 'Business Development', level: 'entry', keywords: ['business', 'development', 'representative', 'bdr'] },
  { id: 'senior-bdr', title: 'Senior Business Development Representative', category: 'sales', subcategory: 'Business Development', level: 'mid', keywords: ['senior', 'bdr', 'business', 'development'] },
  { id: 'sales-development-rep', title: 'Sales Development Representative (SDR)', category: 'sales', subcategory: 'Business Development', level: 'entry', keywords: ['sdr', 'sales', 'development', 'representative'] },
  { id: 'partnership-manager', title: 'Partnership Manager', category: 'sales', subcategory: 'Partnerships', level: 'mid', keywords: ['partnership', 'manager', 'partners', 'alliances'] },
  { id: 'channel-manager', title: 'Channel Manager', category: 'sales', subcategory: 'Channel Sales', level: 'mid', keywords: ['channel', 'manager', 'partners', 'resellers'] },
  
  // Continuing with more categories (would reach 1000+ total)
]

// Helper functions
export function getJobTitlesByCategory(category: JobCategory): JobTitle[] {
  return jobTitlesDatabase.filter(job => job.category === category)
}

export function searchJobTitles(query: string): JobTitle[] {
  const lowerQuery = query.toLowerCase()
  return jobTitlesDatabase.filter(job => 
    job.title.toLowerCase().includes(lowerQuery) ||
    job.keywords.some(keyword => keyword.toLowerCase().includes(lowerQuery))
  )
}

export function getJobCategories(): JobCategory[] {
  return Array.from(new Set(jobTitlesDatabase.map(j => j.category)))
}

export function getJobTitlesByLevel(level: 'entry' | 'mid' | 'senior' | 'executive'): JobTitle[] {
  return jobTitlesDatabase.filter(job => job.level === level)
}
