"""
Collabryx Seed Data Configuration
Centralized configuration for database seeding operations
"""

import os
from typing import List
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class SeedConfig:
    """Configuration settings for seed data generation"""

    # =========================================================================
    # SUPABASE CONFIGURATION
    # =========================================================================
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

    # REST API endpoints (constructed from base URL)
    SUPABASE_REST_URL: str = ""
    SUPABASE_AUTH_URL: str = ""

    # Default HTTP headers for REST API calls
    API_HEADERS: dict = {}

    # =========================================================================
    # PYTHON WORKER CONFIGURATION
    # =========================================================================
    PYTHON_WORKER_URL: str = os.getenv("PYTHON_WORKER_URL", "http://localhost:8000")

    # =========================================================================
    # SEEDING TOGGLES (with backward compatibility for old env vars)
    # =========================================================================
    # New variables take precedence, fall back to old variables
    SEED_PROFILES: bool = os.getenv("SEED_PROFILES", "true").lower() == "true"
    SEED_POSTS: bool = os.getenv("SEED_POSTS", "true").lower() == "true"
    SEED_CONNECTIONS: bool = os.getenv("SEED_CONNECTIONS", "true").lower() == "true"
    SEED_MATCHES: bool = os.getenv("SEED_MATCHES", "true").lower() == "true"
    SEED_CONVERSATIONS: bool = os.getenv("SEED_CONVERSATIONS", "true").lower() == "true"
    SEED_MESSAGES: bool = os.getenv("SEED_MESSAGES", "true").lower() == "true"

    # Backward compatibility: ENABLE_NOTIFICATIONS -> SEED_NOTIFICATIONS
    SEED_NOTIFICATIONS: bool = (
        os.getenv(
            "SEED_NOTIFICATIONS", os.getenv("ENABLE_NOTIFICATIONS", "true")
        ).lower()
        == "true"
    )

    # Backward compatibility: ENABLE_MENTOR_SESSIONS -> SEED_MENTOR_SESSIONS
    SEED_MENTOR_SESSIONS: bool = (
        os.getenv(
            "SEED_MENTOR_SESSIONS", os.getenv("ENABLE_MENTOR_SESSIONS", "true")
        ).lower()
        == "true"
    )

    # Backward compatibility: ENABLE_EMBEDDINGS -> SEED_EMBEDDINGS
    SEED_EMBEDDINGS: bool = (
        os.getenv("SEED_EMBEDDINGS", os.getenv("ENABLE_EMBEDDINGS", "true")).lower()
        == "true"
    )

    # =========================================================================
    # SEED LIMITS (as strings to support "-1" and ranges)
    # =========================================================================
    LIMIT_PROFILES: str = os.getenv("LIMIT_PROFILES", "100")
    LIMIT_POSTS: str = os.getenv("LIMIT_POSTS", "300")
    LIMIT_CONNECTIONS: str = os.getenv("LIMIT_CONNECTIONS", "500")
    LIMIT_MATCHES_PER_USER: str = os.getenv("LIMIT_MATCHES_PER_USER", "5")
    LIMIT_CONVERSATIONS: str = os.getenv("LIMIT_CONVERSATIONS", "150")
    LIMIT_MESSAGES_PER_CONVERSATION: str = os.getenv(
        "LIMIT_MESSAGES_PER_CONVERSATION", "5,20"
    )
    LIMIT_COMMENTS_PER_POST: str = os.getenv("LIMIT_COMMENTS_PER_POST", "3,8")
    LIMIT_REACTIONS_PER_POST: str = os.getenv("LIMIT_REACTIONS_PER_POST", "5,15")
    LIMIT_NOTIFICATIONS_PER_USER: str = os.getenv("LIMIT_NOTIFICATIONS_PER_USER", "5")
    LIMIT_MENTOR_SESSIONS: str = os.getenv("LIMIT_MENTOR_SESSIONS", "50")

    # Backward compatibility for old SEED_COUNT_* variables
    if LIMIT_PROFILES == "100" and os.getenv("SEED_COUNT_PROFILES"):
        LIMIT_PROFILES = os.getenv("SEED_COUNT_PROFILES", "100")
    if LIMIT_POSTS == "300" and os.getenv("SEED_COUNT_POSTS"):
        LIMIT_POSTS = os.getenv("SEED_COUNT_POSTS", "300")
    if LIMIT_CONNECTIONS == "500" and os.getenv("SEED_COUNT_CONNECTIONS"):
        LIMIT_CONNECTIONS = os.getenv("SEED_COUNT_CONNECTIONS", "500")
    if LIMIT_CONVERSATIONS == "150" and os.getenv("SEED_COUNT_CONVERSATIONS"):
        LIMIT_CONVERSATIONS = os.getenv("SEED_COUNT_CONVERSATIONS", "150")
    if LIMIT_MENTOR_SESSIONS == "50" and os.getenv("SEED_COUNT_MENTOR_SESSIONS"):
        LIMIT_MENTOR_SESSIONS = os.getenv("SEED_COUNT_MENTOR_SESSIONS", "50")

    # =========================================================================
    # BATCH PROCESSING
    # =========================================================================
    BATCH_SIZE: int = int(os.getenv("BATCH_SIZE", "10"))
    DELAY_BETWEEN_BATCHES: float = float(os.getenv("DELAY_BETWEEN_BATCHES", "2.0"))

    # =========================================================================
    # INDUSTRIES (20 target industries)
    # =========================================================================
    INDUSTRIES: List[str] = [
        "Fintech",
        "EdTech",
        "HealthTech",
        "E-commerce",
        "AI/ML",
        "Cybersecurity",
        "Blockchain",
        "Cloud Computing",
        "DevTools",
        "SaaS",
        "Gaming",
        "Social Media",
        "PropTech",
        "AgriTech",
        "CleanTech",
        "Biotech",
        "Robotics",
        "IoT",
        "AR/VR",
        "Data Analytics",
    ]

    # =========================================================================
    # SKILLS BY CATEGORY
    # =========================================================================
    TECHNICAL_SKILLS = [
        "JavaScript",
        "TypeScript",
        "Python",
        "Java",
        "C++",
        "Go",
        "Rust",
        "React",
        "Vue",
        "Angular",
        "Svelte",
        "Next.js",
        "Nuxt.js",
        "Node.js",
        "Django",
        "FastAPI",
        "Flask",
        "Spring Boot",
        "PostgreSQL",
        "MySQL",
        "MongoDB",
        "Redis",
        "Elasticsearch",
        "AWS",
        "Azure",
        "GCP",
        "Docker",
        "Kubernetes",
        "Terraform",
        "GraphQL",
        "REST API",
        "gRPC",
        "WebSocket",
        "Machine Learning",
        "Deep Learning",
        "NLP",
        "Computer Vision",
        "Data Science",
        "Data Engineering",
        "Business Intelligence",
        "iOS Development",
        "Android Development",
        "React Native",
        "Flutter",
        "UI/UX Design",
        "Figma",
        "Sketch",
        "Adobe XD",
        "Git",
        "CI/CD",
        "DevOps",
        "Agile",
        "Scrum",
    ]

    SOFT_SKILLS = [
        "Leadership",
        "Communication",
        "Teamwork",
        "Problem Solving",
        "Critical Thinking",
        "Creativity",
        "Adaptability",
        "Time Management",
        "Project Management",
        "Mentorship",
        "Public Speaking",
        "Writing",
    ]

    # =========================================================================
    # LOCATIONS (Tech hubs)
    # =========================================================================
    LOCATIONS = [
        "San Francisco, CA",
        "New York, NY",
        "Seattle, WA",
        "Austin, TX",
        "Boston, MA",
        "Los Angeles, CA",
        "Chicago, IL",
        "Denver, CO",
        "Miami, FL",
        "Portland, OR",
        "Atlanta, GA",
        "Toronto, Canada",
        "London, UK",
        "Berlin, Germany",
        "Paris, France",
        "Amsterdam, Netherlands",
        "Singapore",
        "Tokyo, Japan",
        "Bangalore, India",
        "Tel Aviv, Israel",
    ]

    # =========================================================================
    # UNIVERSITIES (for verification)
    # =========================================================================
    UNIVERSITIES = [
        "Stanford University",
        "MIT",
        "UC Berkeley",
        "Carnegie Mellon University",
        "Harvard University",
        "University of Washington",
        "Georgia Tech",
        "University of Texas at Austin",
        "University of Michigan",
        "Cornell University",
        "Caltech",
        "Princeton University",
        "Yale University",
        "Columbia University",
        "University of Toronto",
        "University of Cambridge",
        "University of Oxford",
        "ETH Zurich",
        "Technical University of Munich",
        "National University of Singapore",
    ]

    # =========================================================================
    # COMPANY NAMES (for experience)
    # =========================================================================
    COMPANIES = [
        "Google",
        "Meta",
        "Amazon",
        "Apple",
        "Microsoft",
        "Netflix",
        "Uber",
        "Airbnb",
        "Stripe",
        "Shopify",
        "Tesla",
        "SpaceX",
        "OpenAI",
        "Anthropic",
        "Databricks",
        "Snowflake",
        "Palantir",
        "Coinbase",
        "Rippling",
        "Brex",
        "Figma",
        "Notion",
        "Linear",
        "Vercel",
        "Supabase",
        "Ramp",
        "Plaid",
        "Affirm",
        "Robinhood",
        "Instacart",
        "DoorDash",
        "Lyft",
        "Pinterest",
        "Snap",
        "Twitter",
        "LinkedIn",
        "Salesforce",
        "Adobe",
        "Oracle",
        "IBM",
        "StartupLab",
        "TechVentures",
        "InnovateCo",
        "BuildFast",
        "ScaleUp",
    ]

    # =========================================================================
    # INITIALIZATION
    # =========================================================================
    @classmethod
    def initialize(cls):
        """Initialize REST API URLs and headers"""
        if cls.SUPABASE_URL:
            cls.SUPABASE_REST_URL = f"{cls.SUPABASE_URL}/rest/v1"
            cls.SUPABASE_AUTH_URL = f"{cls.SUPABASE_URL}/auth/v1"
            cls.API_HEADERS = {
                "apikey": cls.SUPABASE_SERVICE_ROLE_KEY,
                "Authorization": f"Bearer {cls.SUPABASE_SERVICE_ROLE_KEY}",
                "Content-Type": "application/json",
                "Prefer": "return=representation",
            }

    # =========================================================================
    # VERIFICATION
    # =========================================================================
    @classmethod
    def validate(cls) -> bool:
        """Validate that all required configuration is present"""
        required = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]
        missing = [var for var in required if not getattr(cls, var)]

        if missing:
            print(f"❌ Missing required configuration: {missing}")
            print("   Copy .env.example to .env and fill in your values")
            return False

        # Initialize REST API configuration
        cls.initialize()

        return True

    @classmethod
    def print_summary(cls):
        """Print configuration summary"""
        print("\n" + "=" * 60)
        print("SEEDING CONFIGURATION")
        print("=" * 60)
        print(f"Profiles:           {cls.LIMIT_PROFILES}")
        print(f"Posts:              {cls.LIMIT_POSTS}")
        print(f"Connections:        {cls.LIMIT_CONNECTIONS}")
        print(f"Matches/user:       {cls.LIMIT_MATCHES_PER_USER}")
        print(f"Conversations:      {cls.LIMIT_CONVERSATIONS}")
        print(f"Messages/conv:      {cls.LIMIT_MESSAGES_PER_CONVERSATION}")
        print(f"Notifications:      {cls.LIMIT_NOTIFICATIONS_PER_USER}")
        print(f"Mentor Sessions:    {cls.LIMIT_MENTOR_SESSIONS}")
        print("-" * 60)
        print(f"Industries:         {len(cls.INDUSTRIES)}")
        print(f"Technical Skills:   {len(cls.TECHNICAL_SKILLS)}")
        print(f"Soft Skills:        {len(cls.SOFT_SKILLS)}")
        print(f"Locations:          {len(cls.LOCATIONS)}")
        print(f"Universities:       {len(cls.UNIVERSITIES)}")
        print(f"Companies:          {len(cls.COMPANIES)}")
        print("=" * 60 + "\n")


# Create a global config instance
config = SeedConfig()
