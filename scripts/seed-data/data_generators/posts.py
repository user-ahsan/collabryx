"""
Post Content Generator
Generates realistic posts for all industries and post types
"""

import random
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta


def generate_tech_stack(industry: str) -> str:
    """Generate a tech stack string, handling missing industries gracefully"""
    default_tech = [
        "React",
        "Node.js",
        "Python",
        "AWS",
        "PostgreSQL",
        "TypeScript",
        "Docker",
    ]
    tech_list = INDUSTRY_CONTEXT.get(industry, {}).get("tech", default_tech)

    # Ensure we have at least 3 items
    if len(tech_list) < 3:
        tech_list = tech_list + default_tech[: 3 - len(tech_list)]

    return ", ".join(random.sample(tech_list, min(3, len(tech_list))))


# Post content templates by type and industry
POST_TEMPLATES = {
    "project-launch": {
        "templates": [
            "🚀 Just launched {project}! After {time_period} of building, we're finally live. Check it out at {url}",
            "Excited to announce {project} - a new way to {solve_problem}. Built with {tech_stack}. Would love your feedback!",
            "After months of hard work, {project} is now live! 🎉 We're solving {problem} for {target_audience}.",
            "Launch day! 🚢 {project} helps {target_audience} {achieve_goal}. Built by our amazing team.",
            "Today we're shipping {project}! This tool makes {task} {improvement}x faster. Try it free at {url}",
        ],
        "projects": [
            "our new AI-powered analytics platform",
            "a collaborative workspace for remote teams",
            "an open-source developer tool",
            "a marketplace for freelance developers",
            "a learning platform for aspiring engineers",
            "a fintech app for budget tracking",
            "a health and wellness tracker",
            "a sustainability monitoring dashboard",
            "a blockchain-based verification system",
            "a computer vision API",
        ],
        "time_periods": ["3 months", "6 months", "a year", "8 weeks", "10 months"],
        "problems": [
            "inefficient workflows",
            "poor team collaboration",
            "lack of accessible tools",
            "data silos",
        ],
        "target_audiences": [
            "developers",
            "small businesses",
            "students",
            "creators",
            "enterprises",
        ],
        "goals": [
            "ship faster",
            "collaborate better",
            "learn new skills",
            "grow their business",
        ],
    },
    "teammate-request": {
        "templates": [
            "Looking for a {role} to join our team! We're building {project}. Must have experience with {skills}. Equity + competitive pay.",
            "Seeking a talented {role} passionate about {domain}. Remote-friendly. DM if interested!",
            "Our startup is hiring! Need a {role} who loves {activity}. Work on challenging problems with a great team.",
            "Co-founder search: Looking for a technical {role} to build {product}. I bring {background}. Let's chat!",
            "Join our mission! Hiring {role} to help us {mission}. Stack: {tech_stack}. Early employee equity.",
        ],
        "roles": [
            "Full-stack Engineer",
            "Frontend Developer",
            "Backend Engineer",
            "ML Engineer",
            "Product Designer",
            "DevOps Engineer",
            "Mobile Developer",
            "Data Scientist",
        ],
        "domains": [
            "fintech",
            "edtech",
            "healthtech",
            "climate tech",
            "developer tools",
            "AI/ML",
        ],
        "activities": [
            "building scalable systems",
            "creating delightful UX",
            "solving hard technical challenges",
            "working with large datasets",
        ],
        "backgrounds": [
            "10+ years in finance",
            "a growing user base",
            "industry connections",
            "technical expertise",
        ],
        "missions": [
            "democratize finance",
            "improve education access",
            "fight climate change",
            "empower developers",
        ],
    },
    "announcement": {
        "templates": [
            "📢 Big news! {announcement}. This is a game-changer for {industry}.",
            "Excited to share that {achievement}! Couldn't have done it without the team 🙌",
            "Milestone alert! We just hit {milestone}. Thank you to our amazing community!",
            "Proud to announce {partnership}. Together we'll {goal}.",
            "New feature alert! 🎨 Now you can {feature}. Available to all users.",
        ],
        "announcements": [
            "we've raised our seed round",
            "we're opening a new office",
            "we've been acquired",
            "we're launching in a new market",
            "we've hit 10k users",
        ],
        "achievements": [
            "winning Best Startup 2024",
            "getting into Y Combinator",
            "launching our v2.0",
            "expanding to Europe",
        ],
        "milestones": [
            "10,000 users",
            "$1M ARR",
            "100k API calls/day",
            "50 team members",
        ],
        "partnerships": [
            "our partnership with Google Cloud",
            "our collaboration with Stanford",
            "our integration with Stripe",
        ],
        "features": [
            "create custom dashboards",
            "export data to CSV",
            "invite team members",
            "set up automated reports",
        ],
    },
    "general": {
        "templates": [
            "Just finished reading {resource}. Highly recommend for anyone interested in {topic}!",
            "Hot take: {opinion}. Change my mind. 🧵",
            "What's your favorite tool for {task}? Looking for recommendations.",
            "Lessons learned from {experience}: {lesson}",
            "Unpopular opinion: {unpopular_opinion}",
            "Working on {project}. Any tips for {challenge}?",
            "Shoutout to {person} for helping me with {topic}. Community is amazing! 🙏",
            "Today I learned: {til}. Mind = blown 🤯",
        ],
        "resources": [
            '"The Lean Startup"',
            '"Zero to One"',
            "the latest ML paper from Google",
            "this great blog post on system design",
        ],
        "topics": [
            "entrepreneurship",
            "machine learning",
            "product management",
            "career growth",
            "startup life",
        ],
        "opinions": [
            "Remote work is the future",
            "TypeScript > JavaScript",
            "Microservices are overused",
            "AI will transform every industry",
        ],
        "tasks": [
            "project management",
            "code review",
            "deployment",
            "team communication",
            "debugging",
        ],
        "experiences": [
            "my first startup",
            "leading a team",
            "switching careers",
            "building in public",
        ],
        "lessons": [
            "Start small and iterate",
            "Hire slowly, fire quickly",
            "Focus on users, not competitors",
            "Cash flow is king",
        ],
    },
}

# Industry-specific additions
INDUSTRY_CONTEXT = {
    "AI/ML": {
        "tech": ["PyTorch", "TensorFlow", "transformers", "GPUs"],
        "trends": ["LLMs", "generative AI", "computer vision"],
    },
    "Fintech": {
        "tech": ["blockchain", "smart contracts", "Stripe API", "Plaid"],
        "trends": ["DeFi", "embedded finance", "open banking"],
    },
    "EdTech": {
        "tech": ["video streaming", "interactive content", "LMS", "gamification"],
        "trends": ["personalized learning", "microlearning", "VR education"],
    },
    "HealthTech": {
        "tech": ["HIPAA compliance", "telemedicine", "wearables", "EHR"],
        "trends": ["remote care", "AI diagnostics", "mental health"],
    },
    "E-commerce": {
        "tech": ["Shopify", "headless commerce", "payment processing"],
        "trends": ["social commerce", "sustainability", "personalization"],
    },
    "Cybersecurity": {
        "tech": ["zero trust", "encryption", "SIEM", "pentesting"],
        "trends": ["AI security", "quantum resistance", "privacy"],
    },
    "SaaS": {
        "tech": ["multi-tenant", "subscription billing", "APIs"],
        "trends": ["PLG", "vertical SaaS", "AI features"],
    },
    "DevTools": {
        "tech": ["CLI", "APIs", "SDKs", "documentation"],
        "trends": ["developer experience", "automation", "AI coding"],
    },
    "Blockchain": {
        "tech": ["Solidity", "Web3", "smart contracts", "IPFS"],
        "trends": ["DeFi", "NFTs", "DAOs", "Layer 2"],
    },
    "Cloud Computing": {
        "tech": ["Kubernetes", "serverless", "multi-cloud"],
        "trends": ["edge computing", "FinOps", "platform engineering"],
    },
}


def generate_post(industry: str = None, post_type: str = None) -> Dict[str, Any]:
    """Generate a single post"""

    if post_type is None:
        # Weighted random selection
        post_type = random.choices(
            ["general", "project-launch", "teammate-request", "announcement"],
            weights=[50, 20, 15, 15],
        )[0]

    if industry is None:
        from config import config

        industry = random.choice(config.INDUSTRIES)

    type_templates = POST_TEMPLATES.get(post_type, POST_TEMPLATES["general"])
    template = random.choice(type_templates["templates"])

    # Generate post content based on template
    content = template

    # Replace placeholders based on post type
    if post_type == "project-launch":
        replacements = {
            "{project}": random.choice(type_templates["projects"]),
            "{time_period}": random.choice(type_templates["time_periods"]),
            "{url}": f"https://{industry.lower().replace('/', '')}labs.com",
            "{solve_problem}": random.choice(type_templates["problems"]),
            "{problem}": random.choice(type_templates["problems"]),
            "{target_audience}": random.choice(type_templates["target_audiences"]),
            "{achieve_goal}": random.choice(type_templates["goals"]),
            "{task}": random.choice(["development", "deployment", "testing"]),
            "{improvement}": str(random.randint(2, 10)),
            "{tech_stack}": generate_tech_stack(industry),
        }
    elif post_type == "teammate-request":
        replacements = {
            "{role}": random.choice(type_templates["roles"]),
            "{project}": f"a new {industry.lower()} product",
            "{skills}": ", ".join(
                random.sample(["React", "Python", "AWS", "TypeScript", "Node.js"], 3)
            ),
            "{domain}": industry.lower(),
            "{activity}": random.choice(type_templates["activities"]),
            "{product}": f"the future of {industry.lower()}",
            "{background}": random.choice(type_templates["backgrounds"]),
            "{mission}": random.choice(type_templates["missions"]),
            "{tech_stack}": ", ".join(
                random.sample(["React", "Python", "AWS", "TypeScript"], 3)
            ),
        }
    elif post_type == "announcement":
        replacements = {
            "{announcement}": random.choice(type_templates["announcements"]),
            "{industry}": industry.lower(),
            "{achievement}": random.choice(type_templates["achievements"]),
            "{milestone}": random.choice(type_templates["milestones"]),
            "{partnership}": random.choice(type_templates["partnerships"]),
            "{goal}": "achieve great things",
            "{feature}": random.choice(type_templates["features"]),
        }
    else:  # general
        replacements = {
            "{resource}": random.choice(type_templates["resources"]),
            "{topic}": random.choice(type_templates["topics"]),
            "{opinion}": random.choice(type_templates["opinions"]),
            "{task}": random.choice(type_templates["tasks"]),
            "{experience}": random.choice(type_templates["experiences"]),
            "{lesson}": random.choice(type_templates["lessons"]),
            "{project}": f"a new {industry.lower()} feature",
            "{challenge}": "scaling and performance",
            "{person}": "@techleader",
            "{til}": "that Python's GIL can be bypassed with multiprocessing",
            "{unpopular_opinion}": random.choice(type_templates["opinions"]),
        }

    for key, value in replacements.items():
        content = content.replace(key, value)

    # Generate intent for teammate-request and project-launch
    intent = None
    if post_type == "teammate-request":
        intent = random.choice(["teammate", "cofounder"])
    elif post_type == "project-launch":
        intent = random.choice(["mvp", "fyp", None])

    return {
        "content": content,
        "post_type": post_type,
        "intent": intent,
        "industry": industry,
    }


def generate_posts(count: int, author_ids: List[str] = None) -> List[Dict[str, Any]]:
    """Generate multiple posts"""
    from config import config

    posts = []
    for i in range(count):
        industry = config.INDUSTRIES[i % len(config.INDUSTRIES)]
        post = generate_post(industry)
        post["author_index"] = i % len(author_ids) if author_ids else 0
        posts.append(post)

    return posts


def generate_comment(post_type: str = None) -> str:
    """Generate a realistic comment"""
    comment_templates = [
        "This is amazing! Congratulations on the launch! 🎉",
        "Great work! Would love to learn more about your tech stack.",
        "Interesting approach. Have you considered {alternative}?",
        "This is exactly what I needed. Signing up now!",
        "Congrats! How did you solve {challenge}?",
        "Looks promising! What's your monetization strategy?",
        "Well done! The UI looks clean. What design system did you use?",
        "Impressive! How long did it take to build?",
        "This is cool! Is there an API available?",
        "Nice work! Are you planning to add {feature}?",
        "Game changer! 🔥",
        "Following for updates!",
        "Would love to try this out. Is there a free tier?",
        "Great execution! How did you find your first customers?",
        "This solves a real pain point. Well done!",
    ]

    alternatives = [
        "using a different framework",
        "a microservices approach",
        "serverless",
        "a different database",
    ]
    challenges = ["scaling", "user acquisition", "payment processing", "data migration"]
    features = ["dark mode", "mobile app", "integrations", "analytics"]

    comment = random.choice(comment_templates)
    comment = comment.replace("{alternative}", random.choice(alternatives))
    comment = comment.replace("{challenge}", random.choice(challenges))
    comment = comment.replace("{feature}", random.choice(features))

    return comment


def generate_reaction() -> str:
    """Generate a reaction emoji"""
    return random.choice(["👍", "❤️", "🎉", "🚀", "🔥", "💯", "👏", "💡"])


# For testing
if __name__ == "__main__":
    print("Generating sample posts...")

    for post_type in ["project-launch", "teammate-request", "announcement", "general"]:
        post = generate_post("AI/ML", post_type)
        print(f"\n{post_type.upper()}:")
        print(post["content"][:150] + "...")
