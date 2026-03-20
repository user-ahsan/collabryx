// Comprehensive Collaboration Goals Database - 100+ Goals
// Categorized for easy filtering and search

export interface CollaborationGoal {
  id: string
  label: string
  description: string
  category: GoalCategory
  keywords: string[]
}

export type GoalCategory = 
  | 'business'
  | 'technology'
  | 'creative'
  | 'finance'
  | 'education'
  | 'healthcare'
  | 'social'
  | 'research'
  | 'operations'
  | 'marketing'
  | 'legal'
  | 'manufacturing'
  | 'services'

export const collaborationGoals: CollaborationGoal[] = [
  // ==================== BUSINESS & ENTREPRENEURSHIP ====================
  { id: 'find-cofounder', label: 'Find a Co-Founder', description: 'Looking for partners to start a new venture.', category: 'business', keywords: ['cofounder', 'partner', 'startup', 'venture'] },
  { id: 'join-project', label: 'Join a Project', description: 'Want to contribute to an existing team or project.', category: 'business', keywords: ['join', 'project', 'team', 'contribute'] },
  { id: 'networking', label: 'Networking', description: 'Expand professional connections and meet like-minded people.', category: 'business', keywords: ['network', 'connections', 'professional', 'meet'] },
  { id: 'mentorship', label: 'Mentorship', description: 'Looking for guidance or offering to mentor others.', category: 'business', keywords: ['mentor', 'mentee', 'guidance', 'coaching'] },
  { id: 'freelance', label: 'Freelance/Contract Work', description: 'Available for short-term or contract opportunities.', category: 'business', keywords: ['freelance', 'contract', 'gig', 'temporary'] },
  { id: 'start-business', label: 'Start a Business', description: 'Planning to launch a new business or startup.', category: 'business', keywords: ['startup', 'business', 'launch', 'entrepreneur'] },
  { id: 'scale-business', label: 'Scale My Business', description: 'Looking to grow and expand an existing business.', category: 'business', keywords: ['scale', 'growth', 'expand', 'business'] },
  { id: 'pivot-business', label: 'Pivot Business', description: 'Seeking advice on changing business direction.', category: 'business', keywords: ['pivot', 'change', 'strategy', 'direction'] },
  { id: 'exit-strategy', label: 'Exit Strategy', description: 'Planning for acquisition, IPO, or business sale.', category: 'business', keywords: ['exit', 'acquisition', 'ipo', 'sale'] },
  { id: 'franchise', label: 'Franchise Opportunity', description: 'Interested in buying or selling a franchise.', category: 'business', keywords: ['franchise', 'licensing', 'business-model'] },
  { id: 'business-partner', label: 'Find Business Partner', description: 'Looking for a strategic business partner.', category: 'business', keywords: ['partner', 'business', 'strategic', 'alliance'] },
  { id: 'joint-venture', label: 'Joint Venture', description: 'Seeking partners for joint venture opportunities.', category: 'business', keywords: ['joint', 'venture', 'partnership', 'collaboration'] },
  { id: 'licensing', label: 'Licensing Deals', description: 'Looking to license products or technology.', category: 'business', keywords: ['licensing', 'ip', 'technology', 'deals'] },
  { id: 'distribution', label: 'Distribution Partnerships', description: 'Seeking distribution channels and partners.', category: 'business', keywords: ['distribution', 'channels', 'retail', 'partners'] },
  { id: 'supply-chain', label: 'Supply Chain Partners', description: 'Looking for suppliers or manufacturing partners.', category: 'business', keywords: ['supply', 'chain', 'manufacturing', 'suppliers'] },
  { id: 'board-advisor', label: 'Board/Advisory Role', description: 'Seeking or offering board/advisory positions.', category: 'business', keywords: ['board', 'advisor', 'governance', 'leadership'] },
  { id: 'angel-investing', label: 'Angel Investing', description: 'Looking to invest in early-stage startups.', category: 'business', keywords: ['angel', 'investor', 'startup', 'funding'] },
  { id: 'acquire-business', label: 'Acquire a Business', description: 'Interested in buying an existing business.', category: 'business', keywords: ['acquire', 'buy', 'business', 'acquisition'] },
  { id: 'sell-business', label: 'Sell My Business', description: 'Looking to sell or exit my business.', category: 'business', keywords: ['sell', 'exit', 'business', 'acquisition'] },
  { id: 'turnaround', label: 'Business Turnaround', description: 'Need help turning around a struggling business.', category: 'business', keywords: ['turnaround', 'restructuring', 'recovery', 'rescue'] },
  
  // ==================== TECHNOLOGY & DEVELOPMENT ====================
  { id: 'build-app', label: 'Build an App', description: 'Looking to develop a mobile or web application.', category: 'technology', keywords: ['app', 'mobile', 'web', 'development'] },
  { id: 'build-saas', label: 'Build a SaaS', description: 'Planning to create a software-as-a-service product.', category: 'technology', keywords: ['saas', 'software', 'subscription', 'cloud'] },
  { id: 'open-source', label: 'Open Source Contribution', description: 'Want to collaborate on open-source software.', category: 'technology', keywords: ['open-source', 'github', 'collaboration', 'code'] },
  { id: 'start-open-source', label: 'Start Open Source Project', description: 'Launching a new open-source initiative.', category: 'technology', keywords: ['open-source', 'project', 'community', 'github'] },
  { id: 'hackathon', label: 'Hackathon Participation', description: 'Looking for hackathon teammates.', category: 'technology', keywords: ['hackathon', 'coding', 'competition', 'team'] },
  { id: 'tech-cofounder', label: 'Technical Co-Founder', description: 'Seeking a technical partner for my startup.', category: 'technology', keywords: ['technical', 'cofounder', 'cto', 'developer'] },
  { id: 'non-tech-cofounder', label: 'Non-Technical Co-Founder', description: 'Developer seeking business co-founder.', category: 'technology', keywords: ['business', 'cofounder', 'ceo', 'non-technical'] },
  { id: 'beta-testers', label: 'Find Beta Testers', description: 'Looking for users to test my product.', category: 'technology', keywords: ['beta', 'testing', 'users', 'feedback'] },
  { id: 'early-adopters', label: 'Find Early Adopters', description: 'Seeking early customers for my product.', category: 'technology', keywords: ['early', 'adopters', 'customers', 'launch'] },
  { id: 'api-integration', label: 'API Integration', description: 'Need help integrating APIs or services.', category: 'technology', keywords: ['api', 'integration', 'development', 'services'] },
  { id: 'migrate-tech', label: 'Technology Migration', description: 'Planning to migrate to new technology stack.', category: 'technology', keywords: ['migrate', 'technology', 'stack', 'modernize'] },
  { id: 'cloud-migration', label: 'Cloud Migration', description: 'Moving infrastructure to the cloud.', category: 'technology', keywords: ['cloud', 'migration', 'aws', 'azure'] },
  { id: 'devops-help', label: 'DevOps Assistance', description: 'Need help with CI/CD and deployment.', category: 'technology', keywords: ['devops', 'cicd', 'deployment', 'automation'] },
  { id: 'security-audit', label: 'Security Audit', description: 'Looking for security review of my product.', category: 'technology', keywords: ['security', 'audit', 'pentest', 'vulnerability'] },
  { id: 'performance-optimize', label: 'Performance Optimization', description: 'Need help optimizing application performance.', category: 'technology', keywords: ['performance', 'optimization', 'speed', 'scaling'] },
  { id: 'scale-infrastructure', label: 'Scale Infrastructure', description: 'Preparing for high-traffic growth.', category: 'technology', keywords: ['scale', 'infrastructure', 'traffic', 'growth'] },
  { id: 'ai-integration', label: 'AI Integration', description: 'Want to add AI features to my product.', category: 'technology', keywords: ['ai', 'ml', 'integration', 'automation'] },
  { id: 'blockchain-project', label: 'Blockchain Project', description: 'Building a blockchain-based solution.', category: 'technology', keywords: ['blockchain', 'crypto', 'web3', 'defi'] },
  { id: 'iot-project', label: 'IoT Project', description: 'Working on Internet of Things solution.', category: 'technology', keywords: ['iot', 'hardware', 'sensors', 'connected'] },
  { id: 'data-project', label: 'Data Project', description: 'Need help with data engineering or analytics.', category: 'technology', keywords: ['data', 'analytics', 'engineering', 'big-data'] },
  
  // ==================== CREATIVE & DESIGN ====================
  { id: 'design-partner', label: 'Design Partner', description: 'Looking for a design collaborator.', category: 'creative', keywords: ['design', 'partner', 'collaboration', 'creative'] },
  { id: 'brand-identity', label: 'Brand Identity', description: 'Need help creating brand identity.', category: 'creative', keywords: ['brand', 'identity', 'logo', 'design'] },
  { id: 'website-design', label: 'Website Design', description: 'Looking for website design help.', category: 'creative', keywords: ['website', 'design', 'ui', 'frontend'] },
  { id: 'app-design', label: 'App Design', description: 'Need mobile app UI/UX design.', category: 'creative', keywords: ['app', 'design', 'mobile', 'ux'] },
  { id: 'marketing-materials', label: 'Marketing Materials', description: 'Need design for marketing collateral.', category: 'creative', keywords: ['marketing', 'design', 'collateral', 'print'] },
  { id: 'video-production', label: 'Video Production', description: 'Looking for video creation help.', category: 'creative', keywords: ['video', 'production', 'editing', 'content'] },
  { id: 'photography', label: 'Photography Services', description: 'Need professional photography.', category: 'creative', keywords: ['photography', 'photos', 'images', 'visual'] },
  { id: 'content-creation', label: 'Content Creation', description: 'Looking for content creators.', category: 'creative', keywords: ['content', 'creation', 'writing', 'media'] },
  { id: 'podcast', label: 'Podcast Collaboration', description: 'Starting or joining a podcast.', category: 'creative', keywords: ['podcast', 'audio', 'broadcast', 'show'] },
  { id: 'youtube-channel', label: 'YouTube Channel', description: 'Building a YouTube presence.', category: 'creative', keywords: ['youtube', 'video', 'channel', 'content'] },
  { id: 'social-media', label: 'Social Media Presence', description: 'Need help with social media strategy.', category: 'creative', keywords: ['social', 'media', 'marketing', 'content'] },
  { id: 'influencer-collab', label: 'Influencer Collaboration', description: 'Looking for influencer partnerships.', category: 'creative', keywords: ['influencer', 'collaboration', 'marketing', 'promotion'] },
  { id: 'art-collaboration', label: 'Art Collaboration', description: 'Seeking artistic collaboration.', category: 'creative', keywords: ['art', 'collaboration', 'creative', 'artist'] },
  { id: 'music-collaboration', label: 'Music Collaboration', description: 'Looking to collaborate on music.', category: 'creative', keywords: ['music', 'collaboration', 'audio', 'production'] },
  { id: 'writing-partner', label: 'Writing Partner', description: 'Seeking co-author or editor.', category: 'creative', keywords: ['writing', 'author', 'editor', 'book'] },
  { id: 'publish-book', label: 'Publish a Book', description: 'Planning to write and publish a book.', category: 'creative', keywords: ['book', 'publish', 'writing', 'author'] },
  { id: 'game-development', label: 'Game Development', description: 'Building a video game.', category: 'creative', keywords: ['game', 'development', 'gaming', 'indie'] },
  { id: 'animation-project', label: 'Animation Project', description: 'Creating animated content.', category: 'creative', keywords: ['animation', 'motion', 'graphics', 'video'] },
  { id: '3d-modeling', label: '3D Modeling', description: 'Need 3D modeling or rendering help.', category: 'creative', keywords: ['3d', 'modeling', 'rendering', 'design'] },
  { id: 'vr-ar-project', label: 'VR/AR Project', description: 'Building virtual or augmented reality experience.', category: 'creative', keywords: ['vr', 'ar', 'virtual', 'reality'] },
  
  // ==================== FINANCE & INVESTMENT ====================
  { id: 'seed-funding', label: 'Seed Funding', description: 'Seeking seed investment for startup.', category: 'finance', keywords: ['seed', 'funding', 'investment', 'startup'] },
  { id: 'series-a', label: 'Series A Funding', description: 'Ready for Series A investment round.', category: 'finance', keywords: ['series-a', 'funding', 'venture', 'investment'] },
  { id: 'venture-capital', label: 'Venture Capital', description: 'Looking for VC investment.', category: 'finance', keywords: ['vc', 'venture', 'capital', 'investment'] },
  { id: 'crowdfunding', label: 'Crowdfunding', description: 'Planning a crowdfunding campaign.', category: 'finance', keywords: ['crowdfunding', 'kickstarter', 'indiegogo', 'campaign'] },
  { id: 'grant-funding', label: 'Grant Funding', description: 'Seeking grants or government funding.', category: 'finance', keywords: ['grant', 'funding', 'government', 'nonprofit'] },
  { id: 'loan-financing', label: 'Loan/Financing', description: 'Looking for business loans.', category: 'finance', keywords: ['loan', 'financing', 'debt', 'bank'] },
  { id: 'revenue-share', label: 'Revenue Share Deal', description: 'Open to revenue-sharing arrangements.', category: 'finance', keywords: ['revenue', 'share', 'deal', 'profit'] },
  { id: 'equity-partner', label: 'Equity Partner', description: 'Seeking equity investment partner.', category: 'finance', keywords: ['equity', 'partner', 'investment', 'ownership'] },
  { id: 'financial-advisor', label: 'Financial Advisor', description: 'Need financial planning advice.', category: 'finance', keywords: ['financial', 'advisor', 'planning', 'money'] },
  { id: 'tax-planning', label: 'Tax Planning', description: 'Looking for tax optimization strategies.', category: 'finance', keywords: ['tax', 'planning', 'optimization', 'accounting'] },
  { id: 'accounting-help', label: 'Accounting Help', description: 'Need bookkeeping or accounting support.', category: 'finance', keywords: ['accounting', 'bookkeeping', 'finance', 'tax'] },
  { id: 'financial-model', label: 'Financial Modeling', description: 'Need help building financial projections.', category: 'finance', keywords: ['financial', 'model', 'projections', 'forecast'] },
  { id: 'valuation', label: 'Business Valuation', description: 'Need company valuation for funding.', category: 'finance', keywords: ['valuation', 'company', 'worth', 'assessment'] },
  { id: 'due-diligence', label: 'Due Diligence', description: 'Preparing for investor due diligence.', category: 'finance', keywords: ['due-diligence', 'audit', 'investor', 'review'] },
  { id: 'ipo-prep', label: 'IPO Preparation', description: 'Planning for public offering.', category: 'finance', keywords: ['ipo', 'public', 'offering', 'stock'] },
  { id: 'merger-acquisition', label: 'Merger/Acquisition', description: 'Exploring M&A opportunities.', category: 'finance', keywords: ['merger', 'acquisition', 'ma', 'corporate'] },
  { id: 'real-estate-invest', label: 'Real Estate Investment', description: 'Looking for property investment partners.', category: 'finance', keywords: ['real-estate', 'investment', 'property', 'real-estate'] },
  { id: 'crypto-invest', label: 'Crypto Investment', description: 'Interested in cryptocurrency investment.', category: 'finance', keywords: ['crypto', 'investment', 'bitcoin', 'blockchain'] },
  { id: 'passive-income', label: 'Passive Income', description: 'Seeking passive income opportunities.', category: 'finance', keywords: ['passive', 'income', 'investment', 'returns'] },
  { id: 'wealth-management', label: 'Wealth Management', description: 'Need wealth management services.', category: 'finance', keywords: ['wealth', 'management', 'portfolio', 'investment'] },
  
  // ==================== EDUCATION & LEARNING ====================
  { id: 'learn-skill', label: 'Learn a Skill', description: 'Looking to learn a new skill.', category: 'education', keywords: ['learn', 'skill', 'training', 'education'] },
  { id: 'teach-skill', label: 'Teach a Skill', description: 'Want to teach or share knowledge.', category: 'education', keywords: ['teach', 'skill', 'mentor', 'knowledge'] },
  { id: 'study-group', label: 'Study Group', description: 'Forming or joining study group.', category: 'education', keywords: ['study', 'group', 'learning', 'collaboration'] },
  { id: 'online-course', label: 'Online Course', description: 'Creating or taking online courses.', category: 'education', keywords: ['online', 'course', 'learning', 'elearning'] },
  { id: 'certification', label: 'Certification', description: 'Pursuing professional certification.', category: 'education', keywords: ['certification', 'credential', 'professional', 'training'] },
  { id: 'degree-program', label: 'Degree Program', description: 'Enrolled in or seeking degree program.', category: 'education', keywords: ['degree', 'university', 'college', 'education'] },
  { id: 'research-collab', label: 'Research Collaboration', description: 'Looking for research partners.', category: 'education', keywords: ['research', 'collaboration', 'academic', 'study'] },
  { id: 'thesis-advisor', label: 'Thesis Advisor', description: 'Seeking thesis or dissertation advisor.', category: 'education', keywords: ['thesis', 'advisor', 'dissertation', 'academic'] },
  { id: 'internship', label: 'Internship', description: 'Looking for internship opportunities.', category: 'education', keywords: ['internship', 'training', 'experience', 'entry'] },
  { id: 'apprenticeship', label: 'Apprenticeship', description: 'Seeking apprenticeship programs.', category: 'education', keywords: ['apprenticeship', 'trade', 'training', 'mentorship'] },
  { id: 'language-exchange', label: 'Language Exchange', description: 'Want to practice foreign languages.', category: 'education', keywords: ['language', 'exchange', 'practice', 'learning'] },
  { id: 'tutoring', label: 'Tutoring', description: 'Need tutoring or offering tutoring.', category: 'education', keywords: ['tutoring', 'tutor', 'teaching', 'help'] },
  { id: 'workshop', label: 'Workshop Participation', description: 'Interested in workshops or bootcamps.', category: 'education', keywords: ['workshop', 'bootcamp', 'training', 'intensive'] },
  { id: 'conference', label: 'Conference Networking', description: 'Attending or speaking at conferences.', category: 'education', keywords: ['conference', 'event', 'networking', 'speaking'] },
  { id: 'knowledge-share', label: 'Knowledge Sharing', description: 'Want to share expertise with others.', category: 'education', keywords: ['knowledge', 'sharing', 'expertise', 'teaching'] },
  { id: 'book-club', label: 'Book Club', description: 'Starting or joining book club.', category: 'education', keywords: ['book', 'club', 'reading', 'discussion'] },
  { id: 'mastermind', label: 'Mastermind Group', description: 'Looking for mastermind group.', category: 'education', keywords: ['mastermind', 'group', 'peer', 'learning'] },
  { id: 'career-advice', label: 'Career Advice', description: 'Seeking career guidance.', category: 'education', keywords: ['career', 'advice', 'guidance', 'professional'] },
  { id: 'skill-swap', label: 'Skill Swap', description: 'Exchange skills with others.', category: 'education', keywords: ['skill', 'swap', 'exchange', 'trade'] },
  { id: 'peer-learning', label: 'Peer Learning', description: 'Interested in peer-to-peer learning.', category: 'education', keywords: ['peer', 'learning', 'collaboration', 'study'] },
  
  // ==================== HEALTHCARE & WELLNESS ====================
  { id: 'health-coach', label: 'Health Coach', description: 'Looking for health/wellness coaching.', category: 'healthcare', keywords: ['health', 'coach', 'wellness', 'fitness'] },
  { id: 'fitness-partner', label: 'Fitness Partner', description: 'Seeking workout or fitness partner.', category: 'healthcare', keywords: ['fitness', 'workout', 'exercise', 'partner'] },
  { id: 'nutrition-advice', label: 'Nutrition Advice', description: 'Need nutrition or diet guidance.', category: 'healthcare', keywords: ['nutrition', 'diet', 'food', 'health'] },
  { id: 'mental-health', label: 'Mental Health Support', description: 'Seeking mental health resources.', category: 'healthcare', keywords: ['mental', 'health', 'therapy', 'support'] },
  { id: 'support-group', label: 'Support Group', description: 'Looking for or forming support group.', category: 'healthcare', keywords: ['support', 'group', 'community', 'health'] },
  { id: 'yoga-partner', label: 'Yoga/Meditation Partner', description: 'Want yoga or meditation buddy.', category: 'healthcare', keywords: ['yoga', 'meditation', 'mindfulness', 'wellness'] },
  { id: 'sports-team', label: 'Sports Team', description: 'Looking to join or form sports team.', category: 'healthcare', keywords: ['sports', 'team', 'athletics', 'recreation'] },
  { id: 'running-group', label: 'Running Group', description: 'Seeking running or cycling group.', category: 'healthcare', keywords: ['running', 'cycling', 'group', 'fitness'] },
  { id: 'wellness-retreat', label: 'Wellness Retreat', description: 'Planning wellness retreat or event.', category: 'healthcare', keywords: ['wellness', 'retreat', 'event', 'health'] },
  { id: 'health-challenge', label: 'Health Challenge', description: 'Starting health/fitness challenge.', category: 'healthcare', keywords: ['health', 'challenge', 'fitness', 'competition'] },
  { id: 'medical-advice', label: 'Medical Advice', description: 'Seeking medical consultation.', category: 'healthcare', keywords: ['medical', 'advice', 'doctor', 'consultation'] },
  { id: 'healthcare-provider', label: 'Healthcare Provider', description: 'Looking for healthcare services.', category: 'healthcare', keywords: ['healthcare', 'provider', 'doctor', 'clinic'] },
  { id: 'clinical-trial', label: 'Clinical Trial', description: 'Interested in clinical trials.', category: 'healthcare', keywords: ['clinical', 'trial', 'research', 'medical'] },
  { id: 'health-tech', label: 'Health Tech Solution', description: 'Building health technology product.', category: 'healthcare', keywords: ['health', 'tech', 'digital', 'medical'] },
  { id: 'telemedicine', label: 'Telemedicine', description: 'Interested in remote healthcare.', category: 'healthcare', keywords: ['telemedicine', 'remote', 'healthcare', 'virtual'] },
  { id: 'wellness-program', label: 'Wellness Program', description: 'Creating workplace wellness program.', category: 'healthcare', keywords: ['wellness', 'program', 'workplace', 'health'] },
  { id: 'health-advocacy', label: 'Health Advocacy', description: 'Advocating for health causes.', category: 'healthcare', keywords: ['health', 'advocacy', 'awareness', 'cause'] },
  { id: 'caregiver-support', label: 'Caregiver Support', description: 'Need caregiver resources.', category: 'healthcare', keywords: ['caregiver', 'support', 'care', 'family'] },
  { id: 'senior-care', label: 'Senior Care', description: 'Looking for senior care options.', category: 'healthcare', keywords: ['senior', 'care', 'elderly', 'aging'] },
  { id: 'childcare', label: 'Childcare', description: 'Seeking childcare services.', category: 'healthcare', keywords: ['childcare', 'daycare', 'babysitter', 'kids'] },
  
  // ==================== SOCIAL IMPACT & COMMUNITY ====================
  { id: 'volunteer', label: 'Volunteer', description: 'Looking to volunteer for causes.', category: 'social', keywords: ['volunteer', 'service', 'community', 'help'] },
  { id: 'nonprofit', label: 'Nonprofit Work', description: 'Starting or joining nonprofit.', category: 'social', keywords: ['nonprofit', 'charity', 'organization', 'cause'] },
  { id: 'social-enterprise', label: 'Social Enterprise', description: 'Building social impact business.', category: 'social', keywords: ['social', 'enterprise', 'impact', 'business'] },
  { id: 'community-organize', label: 'Community Organizing', description: 'Organizing community initiatives.', category: 'social', keywords: ['community', 'organize', 'activism', 'local'] },
  { id: 'fundraising', label: 'Fundraising', description: 'Raising funds for a cause.', category: 'social', keywords: ['fundraising', 'donation', 'charity', 'campaign'] },
  { id: 'awareness-campaign', label: 'Awareness Campaign', description: 'Running awareness campaign.', category: 'social', keywords: ['awareness', 'campaign', 'advocacy', 'cause'] },
  { id: 'environmental', label: 'Environmental Cause', description: 'Working on environmental issues.', category: 'social', keywords: ['environmental', 'climate', 'sustainability', 'green'] },
  { id: 'sustainability', label: 'Sustainability', description: 'Promoting sustainable practices.', category: 'social', keywords: ['sustainability', 'eco', 'green', 'environment'] },
  { id: 'diversity-inclusion', label: 'Diversity & Inclusion', description: 'Advancing D&I initiatives.', category: 'social', keywords: ['diversity', 'inclusion', 'equity', 'dei'] },
  { id: 'social-justice', label: 'Social Justice', description: 'Working on social justice issues.', category: 'social', keywords: ['social', 'justice', 'equality', 'rights'] },
  { id: 'human-rights', label: 'Human Rights', description: 'Advocating for human rights.', category: 'social', keywords: ['human', 'rights', 'advocacy', 'freedom'] },
  { id: 'education-access', label: 'Education Access', description: 'Improving education accessibility.', category: 'social', keywords: ['education', 'access', 'equality', 'opportunity'] },
  { id: 'healthcare-access', label: 'Healthcare Access', description: 'Improving healthcare accessibility.', category: 'social', keywords: ['healthcare', 'access', 'equality', 'medical'] },
  { id: 'poverty-alleviation', label: 'Poverty Alleviation', description: 'Fighting poverty and hunger.', category: 'social', keywords: ['poverty', 'hunger', 'homelessness', 'aid'] },
  { id: 'disaster-relief', label: 'Disaster Relief', description: 'Providing disaster relief support.', category: 'social', keywords: ['disaster', 'relief', 'emergency', 'aid'] },
  { id: 'refugee-support', label: 'Refugee Support', description: 'Supporting refugees and migrants.', category: 'social', keywords: ['refugee', 'migrant', 'support', 'immigration'] },
  { id: 'youth-development', label: 'Youth Development', description: 'Working with youth programs.', category: 'social', keywords: ['youth', 'development', 'kids', 'mentorship'] },
  { id: 'womens-empowerment', label: "Women's Empowerment", description: 'Supporting women\'s initiatives.', category: 'social', keywords: ['women', 'empowerment', 'equality', 'gender'] },
  { id: 'lgbtq-support', label: 'LGBTQ+ Support', description: 'Supporting LGBTQ+ community.', category: 'social', keywords: ['lgbtq', 'pride', 'equality', 'rights'] },
  { id: 'disability-advocacy', label: 'Disability Advocacy', description: 'Advocating for disability rights.', category: 'social', keywords: ['disability', 'accessibility', 'inclusion', 'rights'] },
  
  // ==================== RESEARCH & INNOVATION ====================
  { id: 'research-partner', label: 'Research Partner', description: 'Looking for research collaborators.', category: 'research', keywords: ['research', 'partner', 'collaboration', 'study'] },
  { id: 'phd-collab', label: 'PhD Collaboration', description: 'Seeking PhD research partners.', category: 'research', keywords: ['phd', 'doctorate', 'research', 'academic'] },
  { id: 'scientific-research', label: 'Scientific Research', description: 'Conducting scientific studies.', category: 'research', keywords: ['scientific', 'research', 'lab', 'experiment'] },
  { id: 'market-research', label: 'Market Research', description: 'Need market research assistance.', category: 'research', keywords: ['market', 'research', 'analysis', 'consumer'] },
  { id: 'user-research', label: 'User Research', description: 'Conducting user research studies.', category: 'research', keywords: ['user', 'research', 'ux', 'testing'] },
  { id: 'data-collection', label: 'Data Collection', description: 'Gathering research data.', category: 'research', keywords: ['data', 'collection', 'survey', 'research'] },
  { id: 'survey-design', label: 'Survey Design', description: 'Creating surveys or questionnaires.', category: 'research', keywords: ['survey', 'questionnaire', 'research', 'feedback'] },
  { id: 'lab-partner', label: 'Lab Partner', description: 'Looking for laboratory partners.', category: 'research', keywords: ['lab', 'laboratory', 'research', 'science'] },
  { id: 'field-research', label: 'Field Research', description: 'Conducting field studies.', category: 'research', keywords: ['field', 'research', 'outdoor', 'study'] },
  { id: 'patent', label: 'Patent Development', description: 'Working on patent applications.', category: 'research', keywords: ['patent', 'ip', 'invention', 'innovation'] },
  { id: 'innovation-lab', label: 'Innovation Lab', description: 'Participating in innovation programs.', category: 'research', keywords: ['innovation', 'lab', 'incubator', 'startup'] },
  { id: 'r-and-d', label: 'R&D Collaboration', description: 'Research and development partnership.', category: 'research', keywords: ['r&d', 'research', 'development', 'innovation'] },
  { id: 'prototype', label: 'Prototype Development', description: 'Building product prototypes.', category: 'research', keywords: ['prototype', 'mvp', 'product', 'development'] },
  { id: 'proof-of-concept', label: 'Proof of Concept', description: 'Developing proof of concept.', category: 'research', keywords: ['poc', 'proof', 'concept', 'validation'] },
  { id: 'pilot-program', label: 'Pilot Program', description: 'Running pilot program or trial.', category: 'research', keywords: ['pilot', 'program', 'trial', 'test'] },
  { id: 'case-study', label: 'Case Study', description: 'Creating or participating in case study.', category: 'research', keywords: ['case', 'study', 'research', 'analysis'] },
  { id: 'white-paper', label: 'White Paper', description: 'Writing industry white paper.', category: 'research', keywords: ['whitepaper', 'paper', 'research', 'publication'] },
  { id: 'publish-research', label: 'Publish Research', description: 'Looking to publish research.', category: 'research', keywords: ['publish', 'research', 'journal', 'academic'] },
  { id: 'conference-presentation', label: 'Conference Presentation', description: 'Presenting at conferences.', category: 'research', keywords: ['conference', 'presentation', 'speaking', 'research'] },
  { id: 'grant-writing', label: 'Grant Writing', description: 'Seeking research grants.', category: 'research', keywords: ['grant', 'writing', 'funding', 'research'] },
  
  // ==================== OPERATIONS & MANAGEMENT ====================
  { id: 'operations-help', label: 'Operations Help', description: 'Need operational support.', category: 'operations', keywords: ['operations', 'management', 'efficiency', 'process'] },
  { id: 'process-improvement', label: 'Process Improvement', description: 'Optimizing business processes.', category: 'operations', keywords: ['process', 'improvement', 'optimization', 'efficiency'] },
  { id: 'project-management', label: 'Project Management', description: 'Need project management help.', category: 'operations', keywords: ['project', 'management', 'planning', 'execution'] },
  { id: 'agile-coach', label: 'Agile Coach', description: 'Seeking agile/scrum coaching.', category: 'operations', keywords: ['agile', 'scrum', 'coach', 'methodology'] },
  { id: 'change-management', label: 'Change Management', description: 'Managing organizational change.', category: 'operations', keywords: ['change', 'management', 'transformation', 'organization'] },
  { id: 'quality-assurance', label: 'Quality Assurance', description: 'Implementing QA processes.', category: 'operations', keywords: ['qa', 'quality', 'assurance', 'testing'] },
  { id: 'risk-management', label: 'Risk Management', description: 'Need risk assessment help.', category: 'operations', keywords: ['risk', 'management', 'assessment', 'mitigation'] },
  { id: 'compliance', label: 'Compliance', description: 'Ensuring regulatory compliance.', category: 'operations', keywords: ['compliance', 'regulatory', 'legal', 'audit'] },
  { id: 'supply-chain-optimize', label: 'Supply Chain Optimization', description: 'Improving supply chain efficiency.', category: 'operations', keywords: ['supply', 'chain', 'logistics', 'optimization'] },
  { id: 'inventory-management', label: 'Inventory Management', description: 'Need inventory system help.', category: 'operations', keywords: ['inventory', 'stock', 'management', 'warehouse'] },
  { id: 'vendor-management', label: 'Vendor Management', description: 'Managing supplier relationships.', category: 'operations', keywords: ['vendor', 'supplier', 'management', 'procurement'] },
  { id: 'contract-negotiation', label: 'Contract Negotiation', description: 'Need contract negotiation help.', category: 'operations', keywords: ['contract', 'negotiation', 'legal', 'agreement'] },
  { id: 'facility-management', label: 'Facility Management', description: 'Managing office/facility operations.', category: 'operations', keywords: ['facility', 'office', 'management', 'operations'] },
  { id: 'remote-work', label: 'Remote Work Setup', description: 'Setting up remote work systems.', category: 'operations', keywords: ['remote', 'work', 'distributed', 'virtual'] },
  { id: 'hybrid-work', label: 'Hybrid Work Model', description: 'Implementing hybrid work model.', category: 'operations', keywords: ['hybrid', 'work', 'flexible', 'office'] },
  { id: 'office-relocation', label: 'Office Relocation', description: 'Planning office move.', category: 'operations', keywords: ['office', 'relocation', 'move', 'facility'] },
  { id: 'business-continuity', label: 'Business Continuity', description: 'Planning for business continuity.', category: 'operations', keywords: ['continuity', 'planning', 'disaster', 'recovery'] },
  { id: 'crisis-management', label: 'Crisis Management', description: 'Handling crisis situations.', category: 'operations', keywords: ['crisis', 'management', 'emergency', 'response'] },
  { id: 'succession-planning', label: 'Succession Planning', description: 'Planning leadership succession.', category: 'operations', keywords: ['succession', 'planning', 'leadership', 'transition'] },
  { id: 'knowledge-management', label: 'Knowledge Management', description: 'Implementing knowledge systems.', category: 'operations', keywords: ['knowledge', 'management', 'documentation', 'systems'] },
  
  // ==================== MARKETING & SALES ====================
  { id: 'marketing-strategy', label: 'Marketing Strategy', description: 'Need marketing plan development.', category: 'marketing', keywords: ['marketing', 'strategy', 'plan', 'campaign'] },
  { id: 'brand-strategy', label: 'Brand Strategy', description: 'Developing brand positioning.', category: 'marketing', keywords: ['brand', 'strategy', 'positioning', 'identity'] },
  { id: 'go-to-market', label: 'Go-to-Market', description: 'Planning product launch.', category: 'marketing', keywords: ['go-to-market', 'launch', 'product', 'strategy'] },
  { id: 'customer-acquisition', label: 'Customer Acquisition', description: 'Looking to acquire customers.', category: 'marketing', keywords: ['customer', 'acquisition', 'growth', 'marketing'] },
  { id: 'lead-generation', label: 'Lead Generation', description: 'Need lead generation help.', category: 'marketing', keywords: ['lead', 'generation', 'prospects', 'sales'] },
  { id: 'sales-strategy', label: 'Sales Strategy', description: 'Developing sales approach.', category: 'marketing', keywords: ['sales', 'strategy', 'approach', 'revenue'] },
  { id: 'sales-partner', label: 'Sales Partner', description: 'Looking for sales representatives.', category: 'marketing', keywords: ['sales', 'partner', 'rep', 'commission'] },
  { id: 'affiliate-program', label: 'Affiliate Program', description: 'Starting affiliate marketing.', category: 'marketing', keywords: ['affiliate', 'marketing', 'commission', 'referral'] },
  { id: 'partnership-marketing', label: 'Partnership Marketing', description: 'Seeking marketing partnerships.', category: 'marketing', keywords: ['partnership', 'marketing', 'collaboration', 'co-marketing'] },
  { id: 'pr-campaign', label: 'PR Campaign', description: 'Running public relations campaign.', category: 'marketing', keywords: ['pr', 'public-relations', 'media', 'press'] },
  { id: 'media-relations', label: 'Media Relations', description: 'Need media coverage.', category: 'marketing', keywords: ['media', 'relations', 'press', 'coverage'] },
  { id: 'content-strategy', label: 'Content Strategy', description: 'Developing content marketing.', category: 'marketing', keywords: ['content', 'strategy', 'marketing', 'blog'] },
  { id: 'seo-help', label: 'SEO Help', description: 'Need search engine optimization.', category: 'marketing', keywords: ['seo', 'search', 'optimization', 'google'] },
  { id: 'ppc-campaign', label: 'PPC Campaign', description: 'Running paid advertising.', category: 'marketing', keywords: ['ppc', 'ads', 'google', 'paid'] },
  { id: 'social-media-ads', label: 'Social Media Ads', description: 'Running social media advertising.', category: 'marketing', keywords: ['social', 'media', 'ads', 'facebook'] },
  { id: 'email-marketing', label: 'Email Marketing', description: 'Building email campaigns.', category: 'marketing', keywords: ['email', 'marketing', 'newsletter', 'campaign'] },
  { id: 'conversion-optimization', label: 'Conversion Optimization', description: 'Improving conversion rates.', category: 'marketing', keywords: ['conversion', 'optimization', 'cro', 'funnel'] },
  { id: 'analytics-setup', label: 'Analytics Setup', description: 'Need analytics implementation.', category: 'marketing', keywords: ['analytics', 'tracking', 'data', 'measurement'] },
  { id: 'customer-retention', label: 'Customer Retention', description: 'Improving customer retention.', category: 'marketing', keywords: ['retention', 'customer', 'loyalty', 'churn'] },
  { id: 'community-building', label: 'Community Building', description: 'Building brand community.', category: 'marketing', keywords: ['community', 'building', 'engagement', 'brand'] },
  
  // ==================== LEGAL & PROFESSIONAL ====================
  { id: 'legal-advice', label: 'Legal Advice', description: 'Need legal consultation.', category: 'legal', keywords: ['legal', 'advice', 'lawyer', 'attorney'] },
  { id: 'incorporation', label: 'Incorporation', description: 'Setting up business entity.', category: 'legal', keywords: ['incorporation', 'llc', 'corporation', 'business'] },
  { id: 'ip-protection', label: 'IP Protection', description: 'Protecting intellectual property.', category: 'legal', keywords: ['ip', 'intellectual-property', 'patent', 'trademark'] },
  { id: 'trademark', label: 'Trademark', description: 'Registering trademarks.', category: 'legal', keywords: ['trademark', 'brand', 'registration', 'ip'] },
  { id: 'copyright', label: 'Copyright', description: 'Copyright registration help.', category: 'legal', keywords: ['copyright', 'registration', 'protection', 'content'] },
  { id: 'contract-review', label: 'Contract Review', description: 'Need contract review.', category: 'legal', keywords: ['contract', 'review', 'legal', 'agreement'] },
  { id: 'nda', label: 'NDA/Legal Documents', description: 'Need legal document templates.', category: 'legal', keywords: ['nda', 'confidentiality', 'legal', 'template'] },
  { id: 'terms-of-service', label: 'Terms of Service', description: 'Creating terms and policies.', category: 'legal', keywords: ['terms', 'service', 'privacy', 'policy'] },
  { id: 'gdpr-compliance', label: 'GDPR Compliance', description: 'Ensuring data privacy compliance.', category: 'legal', keywords: ['gdpr', 'privacy', 'compliance', 'data'] },
  { id: 'employment-law', label: 'Employment Law', description: 'Need employment legal advice.', category: 'legal', keywords: ['employment', 'law', 'hr', 'legal'] },
  { id: 'immigration', label: 'Immigration', description: 'Need immigration assistance.', category: 'legal', keywords: ['immigration', 'visa', 'citizenship', 'legal'] },
  { id: 'tax-law', label: 'Tax Law', description: 'Need tax legal advice.', category: 'legal', keywords: ['tax', 'law', 'irs', 'legal'] },
  { id: 'real-estate-law', label: 'Real Estate Law', description: 'Need property legal help.', category: 'legal', keywords: ['real-estate', 'law', 'property', 'legal'] },
  { id: 'family-law', label: 'Family Law', description: 'Need family legal services.', category: 'legal', keywords: ['family', 'law', 'divorce', 'custody'] },
  { id: 'estate-planning', label: 'Estate Planning', description: 'Planning estate and will.', category: 'legal', keywords: ['estate', 'planning', 'will', 'trust'] },
  { id: 'bankruptcy', label: 'Bankruptcy', description: 'Need bankruptcy assistance.', category: 'legal', keywords: ['bankruptcy', 'debt', 'legal', 'financial'] },
  { id: 'litigation', label: 'Litigation', description: 'Involved in legal dispute.', category: 'legal', keywords: ['litigation', 'lawsuit', 'court', 'legal'] },
  { id: 'mediation', label: 'Mediation', description: 'Seeking mediation services.', category: 'legal', keywords: ['mediation', 'arbitration', 'dispute', 'resolution'] },
  { id: 'regulatory-compliance', label: 'Regulatory Compliance', description: 'Need regulatory guidance.', category: 'legal', keywords: ['regulatory', 'compliance', 'legal', 'government'] },
  { id: 'corporate-governance', label: 'Corporate Governance', description: 'Implementing governance practices.', category: 'legal', keywords: ['corporate', 'governance', 'board', 'compliance'] },
  
  // ==================== MANUFACTURING & PRODUCTION ====================
  { id: 'manufacturing-partner', label: 'Manufacturing Partner', description: 'Looking for manufacturing.', category: 'manufacturing', keywords: ['manufacturing', 'production', 'factory', 'partner'] },
  { id: 'prototype-manufacturing', label: 'Prototype Manufacturing', description: 'Need prototype production.', category: 'manufacturing', keywords: ['prototype', 'manufacturing', 'sample', 'test'] },
  { id: 'mass-production', label: 'Mass Production', description: 'Scaling to mass production.', category: 'manufacturing', keywords: ['mass', 'production', 'scale', 'manufacturing'] },
  { id: 'contract-manufacturing', label: 'Contract Manufacturing', description: 'Seeking contract manufacturer.', category: 'manufacturing', keywords: ['contract', 'manufacturing', 'oem', 'production'] },
  { id: '3d-printing', label: '3D Printing', description: 'Need 3D printing services.', category: 'manufacturing', keywords: ['3d', 'printing', 'additive', 'prototype'] },
  { id: 'cnc-machining', label: 'CNC Machining', description: 'Need CNC machining.', category: 'manufacturing', keywords: ['cnc', 'machining', 'milling', 'manufacturing'] },
  { id: 'injection-molding', label: 'Injection Molding', description: 'Need injection molding.', category: 'manufacturing', keywords: ['injection', 'molding', 'plastic', 'manufacturing'] },
  { id: 'sheet-metal', label: 'Sheet Metal Work', description: 'Need sheet metal fabrication.', category: 'manufacturing', keywords: ['sheet', 'metal', 'fabrication', 'manufacturing'] },
  { id: 'assembly', label: 'Assembly Services', description: 'Need product assembly.', category: 'manufacturing', keywords: ['assembly', 'production', 'manufacturing', 'labor'] },
  { id: 'packaging-design', label: 'Packaging Design', description: 'Need packaging design.', category: 'manufacturing', keywords: ['packaging', 'design', 'box', 'product'] },
  { id: 'packaging-manufacturing', label: 'Packaging Manufacturing', description: 'Need packaging production.', category: 'manufacturing', keywords: ['packaging', 'manufacturing', 'box', 'container'] },
  { id: 'quality-control', label: 'Quality Control', description: 'Need QC inspection.', category: 'manufacturing', keywords: ['qc', 'quality', 'control', 'inspection'] },
  { id: 'certification', label: 'Product Certification', description: 'Need product certifications.', category: 'manufacturing', keywords: ['certification', 'product', 'safety', 'compliance'] },
  { id: 'sourcing', label: 'Product Sourcing', description: 'Looking for product sources.', category: 'manufacturing', keywords: ['sourcing', 'supplier', 'product', 'procurement'] },
  { id: 'import-export', label: 'Import/Export', description: 'Need import/export help.', category: 'manufacturing', keywords: ['import', 'export', 'trade', 'international'] },
  { id: 'customs', label: 'Customs Clearance', description: 'Need customs assistance.', category: 'manufacturing', keywords: ['customs', 'clearance', 'import', 'trade'] },
  { id: 'freight', label: 'Freight/Shipping', description: 'Need freight forwarding.', category: 'manufacturing', keywords: ['freight', 'shipping', 'logistics', 'transport'] },
  { id: 'warehouse', label: 'Warehousing', description: 'Need warehouse storage.', category: 'manufacturing', keywords: ['warehouse', 'storage', 'fulfillment', 'logistics'] },
  { id: 'fulfillment', label: 'Order Fulfillment', description: 'Need fulfillment services.', category: 'manufacturing', keywords: ['fulfillment', 'orders', 'shipping', '3pl'] },
  { id: 'reverse-logistics', label: 'Reverse Logistics', description: 'Need returns management.', category: 'manufacturing', keywords: ['reverse', 'logistics', 'returns', 'refunds'] },
  
  // ==================== SERVICES & SUPPORT ====================
  { id: 'customer-support', label: 'Customer Support', description: 'Need customer service help.', category: 'services', keywords: ['customer', 'support', 'service', 'help'] },
  { id: 'technical-support', label: 'Technical Support', description: 'Need tech support.', category: 'services', keywords: ['technical', 'support', 'it', 'help'] },
  { id: 'virtual-assistant', label: 'Virtual Assistant', description: 'Looking for VA services.', category: 'services', keywords: ['virtual', 'assistant', 'va', 'admin'] },
  { id: 'administrative-help', label: 'Administrative Help', description: 'Need admin support.', category: 'services', keywords: ['administrative', 'admin', 'support', 'office'] },
  { id: 'data-entry', label: 'Data Entry', description: 'Need data entry services.', category: 'services', keywords: ['data', 'entry', 'input', 'typing'] },
  { id: 'translation', label: 'Translation', description: 'Need translation services.', category: 'services', keywords: ['translation', 'language', 'translator', 'interpretation'] },
  { id: 'transcription', label: 'Transcription', description: 'Need transcription services.', category: 'services', keywords: ['transcription', 'audio', 'text', 'typing'] },
  { id: 'research-services', label: 'Research Services', description: 'Need research assistance.', category: 'services', keywords: ['research', 'analysis', 'data', 'study'] },
  { id: 'bookkeeping', label: 'Bookkeeping', description: 'Need bookkeeping services.', category: 'services', keywords: ['bookkeeping', 'accounting', 'finance', 'records'] },
  { id: 'payroll', label: 'Payroll Services', description: 'Need payroll processing.', category: 'services', keywords: ['payroll', 'payment', 'employees', 'processing'] },
  { id: 'hr-services', label: 'HR Services', description: 'Need HR support.', category: 'services', keywords: ['hr', 'human-resources', 'recruitment', 'employees'] },
  { id: 'recruiting', label: 'Recruiting', description: 'Need recruitment help.', category: 'services', keywords: ['recruiting', 'hiring', 'talent', 'recruitment'] },
  { id: 'training', label: 'Training Services', description: 'Need employee training.', category: 'services', keywords: ['training', 'development', 'learning', 'education'] },
  { id: 'consulting', label: 'Consulting', description: 'Need business consulting.', category: 'services', keywords: ['consulting', 'advisor', 'consultant', 'business'] },
  { id: 'coaching', label: 'Coaching', description: 'Need business/life coaching.', category: 'services', keywords: ['coaching', 'coach', 'mentor', 'guidance'] },
  { id: 'therapy', label: 'Therapy/Counseling', description: 'Need therapy services.', category: 'services', keywords: ['therapy', 'counseling', 'mental-health', 'psychologist'] },
  { id: 'legal-services', label: 'Legal Services', description: 'Need legal representation.', category: 'services', keywords: ['legal', 'lawyer', 'attorney', 'services'] },
  { id: 'accounting-services', label: 'Accounting Services', description: 'Need accounting help.', category: 'services', keywords: ['accounting', 'cpa', 'tax', 'finance'] },
  { id: 'insurance', label: 'Insurance', description: 'Need insurance coverage.', category: 'services', keywords: ['insurance', 'coverage', 'policy', 'protection'] },
  { id: 'real-estate-services', label: 'Real Estate Services', description: 'Need real estate help.', category: 'services', keywords: ['real-estate', 'agent', 'realtor', 'property'] },
]

// Helper function to get goals by category
export function getGoalsByCategory(category: GoalCategory): CollaborationGoal[] {
  return collaborationGoals.filter(goal => goal.category === category)
}

// Helper function to search goals
export function searchGoals(query: string): CollaborationGoal[] {
  const lowerQuery = query.toLowerCase()
  return collaborationGoals.filter(goal => 
    goal.label.toLowerCase().includes(lowerQuery) ||
    goal.description.toLowerCase().includes(lowerQuery) ||
    goal.keywords.some(keyword => keyword.toLowerCase().includes(lowerQuery))
  )
}

// Get all categories
export function getGoalCategories(): GoalCategory[] {
  return Array.from(new Set(collaborationGoals.map(g => g.category)))
}
