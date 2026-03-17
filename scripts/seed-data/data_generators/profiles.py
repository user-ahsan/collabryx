"""
Profile Data Generator
Generates complete profile data for all 20 industries
"""

import random
import json
import os
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta

from config import config


def load_templates() -> Dict:
    """Load profile templates from JSON file"""
    template_path = os.path.join(
        os.path.dirname(__file__), "..", "templates", "profile_templates.json"
    )
    with open(template_path, "r") as f:
        return json.load(f)


def generate_headline(industry: str, company: str = None) -> str:
    """Generate a realistic headline for given industry"""
    templates = load_templates()
    industry_headlines = templates["headlines"].get(
        industry, templates["headlines"]["SaaS"]
    )

    headline = random.choice(industry_headlines)

    # Replace placeholders
    if company:
        headline = headline.replace("{company}", company)
    else:
        headline = headline.replace("{company}", random.choice(config.COMPANIES))

    return headline


def generate_bio(industry: str, experience_years: int, is_founder: bool = False) -> str:
    """Generate a realistic bio"""
    templates = load_templates()
    bio_templates = templates["bios"]["templates"]
    bio_data = templates["bios"]

    template = random.choice(bio_templates)

    # Replace placeholders with realistic data
    interests = random.sample(bio_data["interests"], 3)

    replacements = {
        "{interest1}": interests[0],
        "{interest2}": interests[1],
        "{interest3}": interests[2],
        "{years}": str(experience_years),
        "{industry}": industry,
        "{company}": random.choice(config.COMPANIES),
        "{company_type}": random.choice(bio_data["company_types"]),
        "{current_work}": random.choice(bio_data["current_work"]),
        "{previous_experience}": f"built products at {random.choice(config.COMPANIES)}",
        "{previous_company}": random.choice(config.COMPANIES),
        "{university}": random.choice(config.UNIVERSITIES),
        "{role}": random.choice(
            [
                "Software Engineer",
                "Product Manager",
                "Founder",
                "CTO",
                "Head of Engineering",
            ]
        ),
        "{startup}": f"{industry.replace(' ', '')} Labs",
        "{product}": f"a platform for {industry.lower()}",
        "{problem}": random.choice(bio_data["problems"]),
        "{focus_area}": f"{industry} innovation",
        "{field1}": random.choice(["design", "technology", "business"]),
        "{field2}": random.choice(["user experience", "product strategy", "growth"]),
        "{new_interest}": random.choice(bio_data["interests"]),
        "{current_venture}": f"next-gen {industry.lower()} platform",
        "{accelerator}": random.choice(
            ["Y Combinator", "Techstars", "500 Startups", "Sequoia Surge"]
        ),
    }

    bio = template
    for key, value in replacements.items():
        bio = bio.replace(key, value)

    return bio


def generate_skills(industry: str, count: int = None) -> List[Dict[str, Any]]:
    """Generate skills relevant to the industry"""
    if count is None:
        count = random.randint(5, 10)

    # Select industry-relevant skills
    industry_skill_map = {
        "AI/ML": [
            "Machine Learning",
            "Deep Learning",
            "Python",
            "TensorFlow",
            "PyTorch",
            "NLP",
            "Computer Vision",
            "Data Science",
        ],
        "Fintech": [
            "Python",
            "Java",
            "Blockchain",
            "Smart Contracts",
            "Financial Modeling",
            "Risk Analysis",
            "PostgreSQL",
            "AWS",
        ],
        "EdTech": [
            "React",
            "Node.js",
            "Python",
            " instructional Design",
            "LMS",
            "Video Streaming",
            "MongoDB",
            "AWS",
        ],
        "HealthTech": [
            "Python",
            "Java",
            "HL7",
            "FHIR",
            "HIPAA Compliance",
            "Data Security",
            "Machine Learning",
            "PostgreSQL",
        ],
        "E-commerce": [
            "React",
            "Node.js",
            "Shopify",
            "Stripe API",
            "PostgreSQL",
            "Redis",
            "Elasticsearch",
            "AWS",
        ],
        "Cybersecurity": [
            "Python",
            "Network Security",
            "Penetration Testing",
            "Cryptography",
            "SIEM",
            "Linux",
            "Cloud Security",
            "Incident Response",
        ],
        "Blockchain": [
            "Solidity",
            "Web3.js",
            "Rust",
            "Smart Contracts",
            "Cryptography",
            "DeFi",
            "NFT",
            "Ethereum",
        ],
        "Cloud Computing": [
            "AWS",
            "Azure",
            "GCP",
            "Kubernetes",
            "Docker",
            "Terraform",
            "CI/CD",
            "Microservices",
        ],
        "DevTools": [
            "Go",
            "Rust",
            "TypeScript",
            "Compiler Design",
            "VS Code Extensions",
            "CLI Tools",
            "Git",
            "API Design",
        ],
        "SaaS": [
            "React",
            "TypeScript",
            "Node.js",
            "PostgreSQL",
            "Redis",
            "Stripe",
            "AWS",
            "GraphQL",
        ],
        "Gaming": [
            "Unity",
            "Unreal Engine",
            "C++",
            "C#",
            "3D Graphics",
            "Multiplayer Networking",
            "Game Design",
            "Blender",
        ],
        "Social Media": [
            "React Native",
            "Node.js",
            "GraphQL",
            "Redis",
            "Kafka",
            "Elasticsearch",
            "Machine Learning",
            "AWS",
        ],
        "PropTech": [
            "React",
            "Node.js",
            "PostgreSQL",
            "GIS",
            "Google Maps API",
            "IoT",
            "Mobile Development",
            "AWS",
        ],
        "AgriTech": [
            "Python",
            "IoT",
            "Machine Learning",
            "Computer Vision",
            "Drone Technology",
            "Data Analytics",
            "Mobile Development",
            "AWS",
        ],
        "CleanTech": [
            "Python",
            "Data Science",
            "IoT",
            "Machine Learning",
            "Energy Systems",
            "Data Visualization",
            "Cloud Computing",
            "APIs",
        ],
        "Biotech": [
            "Python",
            "R",
            "Bioinformatics",
            "Machine Learning",
            "Data Analysis",
            "Genomics",
            "Statistical Modeling",
            "Linux",
        ],
        "Robotics": [
            "C++",
            "Python",
            "ROS",
            "Computer Vision",
            "Machine Learning",
            "Embedded Systems",
            "Control Systems",
            "Linux",
        ],
        "IoT": [
            "C++",
            "Python",
            "Embedded Systems",
            "MQTT",
            "Bluetooth",
            "WiFi",
            "Cloud Platforms",
            "Security",
        ],
        "AR/VR": [
            "Unity",
            "Unreal Engine",
            "C#",
            "C++",
            "3D Graphics",
            "Computer Vision",
            "OpenGL",
            "Mobile Development",
        ],
        "Data Analytics": [
            "Python",
            "SQL",
            "Tableau",
            "Power BI",
            "Spark",
            "Hadoop",
            "Machine Learning",
            "Data Visualization",
        ],
    }

    base_skills = industry_skill_map.get(industry, config.TECHNICAL_SKILLS[:10])
    additional_skills = [s for s in config.TECHNICAL_SKILLS if s not in base_skills]

    skills = []
    selected_skills = random.sample(base_skills, min(len(base_skills), count - 2))
    selected_skills += random.sample(additional_skills, min(len(additional_skills), 2))

    for i, skill in enumerate(selected_skills):
        skills.append(
            {
                "skill_name": skill,
                "proficiency": random.choice(
                    ["beginner", "intermediate", "advanced", "expert"]
                ),
                "is_primary": i < 3,  # First 3 skills are primary
            }
        )

    return skills


def generate_interests(industry: str, count: int = None) -> List[str]:
    """Generate interests for a user"""
    if count is None:
        count = random.randint(3, 5)

    templates = load_templates()
    all_interests = templates["bios"]["interests"]

    # Always include the user's industry
    interests = [industry]

    # Add related interests
    remaining = random.sample([i for i in all_interests if i != industry], count - 1)
    interests.extend(remaining)

    return interests


def generate_experiences(
    industry: str, years_experience: int, is_student: bool = False
) -> List[Dict[str, Any]]:
    """Generate work/education experiences"""
    experiences = []

    if is_student:
        # Education entry
        experiences.append(
            {
                "title": f"Computer Science Student",
                "company": random.choice(config.UNIVERSITIES),
                "description": f"Focusing on {industry} and software development. GPA: {random.uniform(3.5, 4.0):.2f}",
                "start_date": (
                    datetime.now() - timedelta(days=random.randint(365, 1095))
                ).strftime("%Y-%m-%d"),
                "end_date": None,
                "is_current": True,
                "order_index": 0,
            }
        )

        # Maybe an internship
        if random.random() < 0.6:
            experiences.append(
                {
                    "title": "Software Engineering Intern",
                    "company": random.choice(config.COMPANIES),
                    "description": f"Worked on {industry.lower()} products and features",
                    "start_date": (
                        datetime.now() - timedelta(days=random.randint(60, 180))
                    ).strftime("%Y-%m-%d"),
                    "end_date": (
                        datetime.now() - timedelta(days=random.randint(0, 30))
                    ).strftime("%Y-%m-%d"),
                    "is_current": False,
                    "order_index": 1,
                }
            )
    else:
        # Work experiences based on seniority
        num_experiences = min(years_experience // 2 + 1, 4)

        for i in range(num_experiences):
            is_current = i == 0
            years_ago = i * random.randint(2, 4)

            experiences.append(
                {
                    "title": random.choice(
                        [
                            "Software Engineer",
                            "Senior Software Engineer",
                            "Staff Engineer",
                            "Product Manager",
                            "Engineering Manager",
                            "CTO",
                            "Founder",
                            "Lead Developer",
                            "Principal Engineer",
                            "Technical Lead",
                        ]
                    ),
                    "company": random.choice(config.COMPANIES),
                    "description": f"Leading {industry.lower()} initiatives and building scalable solutions",
                    "start_date": (
                        datetime.now()
                        - timedelta(days=365 * (years_ago + random.randint(1, 3)))
                    ).strftime("%Y-%m-%d"),
                    "end_date": None
                    if is_current
                    else (datetime.now() - timedelta(days=365 * years_ago)).strftime(
                        "%Y-%m-%d"
                    ),
                    "is_current": is_current,
                    "order_index": i,
                }
            )

    return experiences


def generate_projects(industry: str, count: int = None) -> List[Dict[str, Any]]:
    """Generate portfolio projects"""
    if count is None:
        count = random.randint(1, 3)

    project_templates = {
        "AI/ML": [
            "Sentiment Analysis Tool",
            "Image Classification App",
            "Chatbot Platform",
            "Recommendation Engine",
        ],
        "Fintech": [
            "Personal Finance Tracker",
            "Crypto Portfolio Manager",
            "Payment Gateway",
            "Budget Planning App",
        ],
        "EdTech": [
            "Online Learning Platform",
            "Quiz App",
            "Student Progress Tracker",
            "Virtual Classroom",
        ],
        "E-commerce": [
            "Marketplace Platform",
            "Inventory Management System",
            "Product Recommendation Engine",
            "Checkout Optimization",
        ],
        "HealthTech": [
            "Telemedicine App",
            "Health Tracker",
            "Medication Reminder",
            "Patient Portal",
        ],
        "Cybersecurity": [
            "Vulnerability Scanner",
            "Password Manager",
            "Security Audit Tool",
            "Encryption Library",
        ],
        "Blockchain": [
            "DeFi Protocol",
            "NFT Marketplace",
            "Crypto Wallet",
            "DAO Governance Platform",
        ],
        "Cloud Computing": [
            "Serverless API",
            "Auto-scaling Platform",
            "Cloud Migration Tool",
            "Infrastructure Dashboard",
        ],
        "DevTools": [
            "Code Linter",
            "API Testing Tool",
            "CLI Utility",
            "Developer Dashboard",
        ],
        "SaaS": [
            "Project Management Tool",
            "Customer Analytics Platform",
            "Team Collaboration App",
            "Workflow Automation",
        ],
        "Gaming": [
            "Mobile Game",
            "Multiplayer Game Server",
            "Game Analytics Platform",
            "Level Editor Tool",
        ],
        "Social Media": [
            "Content Sharing App",
            "Community Platform",
            "Social Analytics Tool",
            "Messaging App",
        ],
        "PropTech": [
            "Property Listing Platform",
            "Virtual Tour App",
            "Rent Management System",
            "Real Estate Analytics",
        ],
        "AgriTech": [
            "Farm Management App",
            "Crop Monitoring System",
            "Agricultural Marketplace",
            "Weather Prediction Tool",
        ],
        "CleanTech": [
            "Carbon Footprint Tracker",
            "Energy Monitoring App",
            "Sustainability Dashboard",
            "Recycling Platform",
        ],
        "Biotech": [
            "Genome Analysis Tool",
            "Clinical Trial Tracker",
            "Lab Management System",
            "Drug Interaction Checker",
        ],
        "Robotics": [
            "Robot Control System",
            "Autonomous Navigation",
            "Computer Vision Pipeline",
            "Robot Simulation",
        ],
        "IoT": [
            "Smart Home Hub",
            "Sensor Network Dashboard",
            "IoT Device Manager",
            "Home Automation System",
        ],
        "AR/VR": [
            "AR Navigation App",
            "VR Training Simulator",
            "3D Model Viewer",
            "AR Shopping Experience",
        ],
        "Data Analytics": [
            "Business Intelligence Dashboard",
            "Data Pipeline Tool",
            "Analytics Platform",
            "Report Generator",
        ],
    }

    projects = []
    available_projects = project_templates.get(
        industry, ["Side Project", "Open Source Contribution", "Hackathon Project"]
    )

    for i in range(count):
        project_name = random.choice(available_projects)
        projects.append(
            {
                "title": project_name,
                "description": f"Built a {project_name.lower()} using modern technologies. Solves real-world problems in {industry.lower()}.",
                "url": f"https://github.com/user/{project_name.lower().replace(' ', '-')}",
                "image_url": None,
                "tech_stack": random.sample(
                    config.TECHNICAL_SKILLS, random.randint(3, 5)
                ),
                "is_public": True,
                "order_index": i,
            }
        )

    return projects


def generate_looking_for() -> List[str]:
    """Generate 'looking for' intents"""
    templates = load_templates()
    return random.choice(templates["looking_for"])


def generate_complete_profile(
    industry: str, is_student: bool = False
) -> Dict[str, Any]:
    """Generate a complete profile with all related data"""
    from data_generators.names import generate_name, generate_email

    # Basic info
    full_name = generate_name()
    name_parts = full_name.split(" ")
    first_name = name_parts[0]
    last_name = name_parts[-1] if len(name_parts) > 1 else ""

    email = generate_email(first_name, last_name, is_student)

    # Experience level
    if is_student:
        years_experience = 0
        headline = f"Computer Science Student @ {random.choice(config.UNIVERSITIES)}"
    else:
        years_experience = random.randint(2, 15)
        headline = generate_headline(industry)

    # Generate all profile components
    profile = {
        "email": email,
        "full_name": full_name,
        "display_name": full_name,
        "headline": headline,
        "bio": generate_bio(
            industry, years_experience, is_founder=random.random() < 0.2
        ),
        "location": random.choice(config.LOCATIONS),
        "website_url": f"https://{first_name.lower()}{last_name.lower()}.com"
        if random.random() < 0.7
        else None,
        "collaboration_readiness": random.choice(
            ["available", "open", "available", "available"]
        ),  # Weighted towards available
        "is_verified": random.random() < 0.3,  # 30% verified
        "verification_type": random.choice(["student", "faculty", "alumni"])
        if random.random() < 0.3
        else None,
        "university": random.choice(config.UNIVERSITIES)
        if random.random() < 0.4
        else None,
        "profile_completion": 0,  # Will be calculated after adding skills, etc.
        "looking_for": generate_looking_for(),
        "onboarding_completed": True,
        "industry": industry,
        "is_student": is_student,
        "years_experience": years_experience,
    }

    # Generate related data
    profile["skills"] = generate_skills(industry)
    profile["interests"] = generate_interests(industry)
    profile["experiences"] = generate_experiences(
        industry, years_experience, is_student
    )
    profile["projects"] = generate_projects(industry)

    # Calculate profile completion
    completion = 25  # Basic profile
    if len(profile["skills"]) > 0:
        completion += 25
    if len(profile["interests"]) > 0 or len(profile["looking_for"]) > 0:
        completion += 20
    if len(profile["experiences"]) > 0 or len(profile["projects"]) > 0:
        completion += 30
    profile["profile_completion"] = min(completion, 100)

    return profile


def generate_profiles(count: int, existing_emails: set = None) -> List[Dict[str, Any]]:
    """Generate multiple complete profiles distributed across industries

    Args:
        count: Number of profiles to generate
        existing_emails: Set of existing emails to avoid duplicates

    Returns:
        List of complete profile dictionaries
    """
    profiles = []
    used_emails = existing_emails if existing_emails else set()

    # Use random industry distribution if enabled, otherwise distribute evenly
    use_random = config.SEED_PROFILES_RANDOMIZE_INDUSTRIES

    for i in range(count):
        # Industry selection: random or evenly distributed
        if use_random:
            industry = random.choice(config.INDUSTRIES)
        else:
            industry = config.INDUSTRIES[i % len(config.INDUSTRIES)]

        is_student = random.random() < 0.3  # 30% students

        # Generate profile with unique email
        max_attempts = 10
        for attempt in range(max_attempts):
            profile = generate_complete_profile(industry, is_student)

            # Check if email is unique
            if profile["email"] not in used_emails:
                used_emails.add(profile["email"])
                break

            # If duplicate, regenerate with different name combination
            if attempt < max_attempts - 1:
                # Force regeneration by modifying the random seed slightly
                import time

                random.seed(time.time() + attempt)
        else:
            # If we couldn't find unique email after max attempts, add timestamp
            profile["email"] = f"{profile['email'].split('@')[0]}-{i}@collabryx.demo"
            used_emails.add(profile["email"])

        profiles.append(profile)

    return profiles


# For testing
if __name__ == "__main__":
    print("Generating sample profiles...")
    sample_profiles = generate_profiles(3)

    for i, profile in enumerate(sample_profiles, 1):
        print(f"\n{'=' * 60}")
        print(f"Profile {i}: {profile['full_name']}")
        print(f"Industry: {profile['industry']}")
        print(f"Headline: {profile['headline']}")
        print(f"Bio: {profile['bio'][:100]}...")
        print(f"Skills: {[s['skill_name'] for s in profile['skills']][:5]}")
        print(f"Location: {profile['location']}")
        print(f"Completion: {profile['profile_completion']}%")
