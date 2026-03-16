"""
Name and Email Generator
Generates realistic diverse names and email addresses for seed data
"""

import random
from typing import Tuple, List
from faker import Faker

# Initialize Faker with multiple locales for diversity
fake = Faker(["en_US", "en_GB", "en_CA", "en_AU", "en_IN"])


# Additional name pools for more diversity
FIRST_NAMES_MALE = [
    "James",
    "John",
    "Robert",
    "Michael",
    "William",
    "David",
    "Richard",
    "Joseph",
    "Thomas",
    "Charles",
    "Christopher",
    "Daniel",
    "Matthew",
    "Anthony",
    "Donald",
    "Mark",
    "Paul",
    "Steven",
    "Andrew",
    "Kenneth",
    "Joshua",
    "Kevin",
    "Brian",
    "George",
    "Edward",
    "Ronald",
    "Timothy",
    "Jason",
    "Jeffrey",
    "Ryan",
    "Jacob",
    "Gary",
    "Nicholas",
    "Eric",
    "Jonathan",
    "Stephen",
    "Larry",
    "Justin",
    "Scott",
    "Brandon",
    "Benjamin",
    "Samuel",
    "Gregory",
    "Alexander",
    "Patrick",
    "Frank",
    "Raymond",
    "Jack",
    "Dennis",
    "Jerry",
    "Tyler",
    "Aaron",
    "Jose",
    "Adam",
    "Henry",
    "Nathan",
    "Douglas",
    "Zachary",
    "Peter",
    "Kyle",
    "Walter",
    "Ethan",
    "Jeremy",
    "Harold",
    "Keith",
    "Christian",
    "Roger",
    "Noah",
    "Gerald",
    "Carl",
    "Terry",
    "Sean",
    "Austin",
    "Arthur",
    "Lawrence",
    "Jesse",
    "Dylan",
    "Bryan",
    "Joe",
    "Jordan",
    "Billy",
    "Bruce",
    "Albert",
    "Willie",
    "Gabriel",
    "Logan",
    "Alan",
    "Juan",
    "Wayne",
    "Roy",
    "Ralph",
    "Randy",
    "Eugene",
    "Vincent",
    "Russell",
    "Louis",
    "Philip",
    "Bobby",
    "Johnny",
    "Brad",
    "Mary",
    "Steve",
]

FIRST_NAMES_FEMALE = [
    "Mary",
    "Patricia",
    "Jennifer",
    "Linda",
    "Elizabeth",
    "Barbara",
    "Susan",
    "Jessica",
    "Sarah",
    "Karen",
    "Nancy",
    "Lisa",
    "Betty",
    "Margaret",
    "Sandra",
    "Ashley",
    "Kimberly",
    "Emily",
    "Donna",
    "Michelle",
    "Dorothy",
    "Carol",
    "Amanda",
    "Melissa",
    "Deborah",
    "Stephanie",
    "Rebecca",
    "Sharon",
    "Laura",
    "Cynthia",
    "Kathleen",
    "Amy",
    "Shirley",
    "Angela",
    "Helen",
    "Anna",
    "Brenda",
    "Pamela",
    "Nicole",
    "Emma",
    "Ruth",
    "Samantha",
    "Katherine",
    "Christine",
    "Catherine",
    "Debra",
    "Rachel",
    "Carolyn",
    "Janet",
    "Olivia",
    "Maria",
    "Heather",
    "Diane",
    "Virginia",
    "Julie",
    "Joyce",
    "Victoria",
    "Kelly",
    "Lauren",
    "Christina",
    "Joan",
    "Evelyn",
    "Judith",
    "Megan",
    "Cheryl",
    "Andrea",
    "Hannah",
    "Martha",
    "Jacqueline",
    "Frances",
    "Gloria",
    "Ann",
    "Jean",
    "Alice",
    "Kathryn",
    "Grace",
    "Judy",
    "Theresa",
    "Beverly",
    "Denise",
    "Marilyn",
    "Amber",
    "Danielle",
    "Abigail",
    "Brittany",
    "Diana",
    "Jane",
    "Natalie",
    "Sophia",
    "Alexis",
    "Lori",
    "Tiffany",
    "Kayla",
    "Isabella",
    "Alexandra",
    "Brooke",
    "Alyssa",
    "Stephania",
    "Elise",
    "Sofia",
    "Avery",
]

FIRST_NAMES_GENDER_NEUTRAL = [
    "Alex",
    "Taylor",
    "Jordan",
    "Casey",
    "Riley",
    "Morgan",
    "Jamie",
    "Quinn",
    "Avery",
    "Cameron",
    "Dakota",
    "Emerson",
    "Finley",
    "Hayden",
    "Kendall",
    "Logan",
    "Mason",
    "Parker",
    "Peyton",
    "Reese",
    "Rowan",
    "Sawyer",
    "Skyler",
    "Sydney",
    "Tyler",
    "West",
    "Charlie",
    "Frankie",
    "Jackie",
    "Pat",
]

LAST_NAMES = [
    "Smith",
    "Johnson",
    "Williams",
    "Brown",
    "Jones",
    "Garcia",
    "Miller",
    "Davis",
    "Rodriguez",
    "Martinez",
    "Hernandez",
    "Lopez",
    "Gonzalez",
    "Wilson",
    "Anderson",
    "Thomas",
    "Taylor",
    "Moore",
    "Jackson",
    "Martin",
    "Lee",
    "Perez",
    "Thompson",
    "White",
    "Harris",
    "Sanchez",
    "Clark",
    "Ramirez",
    "Lewis",
    "Robinson",
    "Walker",
    "Young",
    "Allen",
    "King",
    "Wright",
    "Scott",
    "Torres",
    "Nguyen",
    "Hill",
    "Flores",
    "Green",
    "Adams",
    "Nelson",
    "Baker",
    "Hall",
    "Rivera",
    "Campbell",
    "Mitchell",
    "Carter",
    "Roberts",
    "Gomez",
    "Phillips",
    "Evans",
    "Turner",
    "Diaz",
    "Parker",
    "Cruz",
    "Edwards",
    "Collins",
    "Reyes",
    "Stewart",
    "Morris",
    "Morales",
    "Murphy",
    "Cook",
    "Rogers",
    "Gutierrez",
    "Ortiz",
    "Morgan",
    "Cooper",
    "Peterson",
    "Bailey",
    "Reed",
    "Kelly",
    "Howard",
    "Ramos",
    "Kim",
    "Cox",
    "Ward",
    "Richardson",
    "Watson",
    "Brooks",
    "Chavez",
    "Wood",
    "James",
    "Bennett",
    "Gray",
    "Mendoza",
    "Ruiz",
    "Hughes",
    "Price",
    "Alvarez",
    "Castillo",
    "Sanders",
    "Patel",
    "Myers",
    "Long",
    "Ross",
    "Foster",
    "Jimenez",
    "Chen",
    "Powell",
    "Jenkins",
    "Perry",
    "Russell",
    "Sullivan",
    "Bell",
    "Coleman",
    "Butler",
    "Henderson",
    "Barnes",
    "Gonzales",
    "Fisher",
    "Vasquez",
    "Simmons",
    "Romero",
    "Jordan",
    "Patterson",
    "Alexander",
    "Hamilton",
    "Graham",
    "Reynolds",
    "Griffin",
    "Wallace",
    "Moreno",
    "West",
    "Cole",
    "Hayes",
    "Bryant",
    "Herrera",
    "Gibson",
    "Ellis",
    "Tran",
    "Medina",
    "Aguilar",
    "Stevens",
    "Murray",
    "Ford",
    "Castro",
    "Marshall",
    "Owens",
    "Harrison",
    "Fernandez",
    "McDonald",
    "Woods",
    "Washington",
    "Kennedy",
    "Wells",
    "Vargas",
    "Henry",
    "Chen",
    "Freeman",
    "Webb",
    "Tucker",
    "Guzman",
    "Burns",
    "Crawford",
    "Olson",
    "Simpson",
    "Porter",
    "Hunter",
    "Gordon",
    "Meng",
    "Knight",
    "Ferguson",
    "Rose",
    "Stone",
    "Hawkins",
    "Dunn",
    "Perkins",
    "Hudson",
    "Spencer",
    "Gardner",
    "Stephens",
    "Payne",
    "Pierce",
    "Berry",
    "Matthews",
    "Arnold",
    "Wagner",
    "Willis",
    "Ray",
    "Watkins",
    "Olson",
    "Carroll",
    "Duncan",
    "Snyder",
    "Hart",
    "Cunningham",
    "Bradley",
    "Lane",
    "Andrews",
    "Ruiz",
    "Harper",
    "Fox",
    "Riley",
    "Armstrong",
    "Carpenter",
    "Weaver",
    "Greene",
    "Lawrence",
    "Elliott",
    "Chavez",
    "Sims",
    "Austin",
    "Peters",
    "Kelley",
    "Franklin",
    "Lawson",
    "Fields",
    "Gutierrez",
    "Ryan",
    "Schmidt",
    "Carr",
    "Vasquez",
    "Castillo",
    "Wheeler",
    "Chapman",
    "Oliver",
    "Montgomery",
    "Richards",
    "Williamson",
    "Johnston",
    "Banks",
    "Meyer",
    "Bishop",
    "McCoy",
    "Howell",
    "Alvarez",
    "Morrison",
    "Hansen",
    "Fernandez",
    "Garza",
    "Burton",
    "Fuller",
    "Wang",
    "Weber",
    "Welch",
    "Rojas",
    "Lucas",
    "Marquez",
    "Fields",
    "Park",
    "Yang",
    "Little",
    "Barker",
    "Terry",
    "Hale",
    "Wilkins",
    "Ayala",
    "Schroeder",
    "Carlton",
    "Neal",
    "Parks",
    "Conner",
    "Adkins",
    "Webster",
    "Norman",
    "Malone",
    "Hammond",
    "Flowers",
    "Cobb",
    "Moody",
    "Quinn",
    "Blake",
    "Maxwell",
    "Pope",
    "Floyd",
    "Osborne",
    "Paul",
    "McCarthy",
    "Guerrero",
    "Estrada",
    "Sandoval",
    "Gibbs",
    "Tyler",
    "Gross",
    "Fitzgerald",
    "Stokes",
    "Doyle",
    "Saunders",
    "Wise",
    "Colon",
    "Gill",
    "Alvarado",
    "Greer",
    "Padilla",
    "Simon",
    "Waters",
    "Nunez",
    "Ballard",
    "Schwartz",
    "McBride",
    "Caldwell",
    "Christensen",
    "Klein",
    "Everett",
    "Contreras",
    "Zimmerman",
    "Gallegos",
    "Burke",
    "Lynch",
    "Singleton",
    "Mathis",
    "Skinner",
    "Bradford",
    "Rich",
    "Galindo",
    "Ware",
]

# Email domains
EMAIL_DOMAINS = [
    "gmail.com",
    "outlook.com",
    "yahoo.com",
    "icloud.com",
    "protonmail.com",
    "mail.com",
    "zoho.com",
    "hey.com",
]

# University email domains
UNIVERSITY_DOMAINS = [
    "stanford.edu",
    "mit.edu",
    "berkeley.edu",
    "cmu.edu",
    "harvard.edu",
    "uw.edu",
    "gatech.edu",
    "utexas.edu",
    "umich.edu",
    "cornell.edu",
    "caltech.edu",
    "princeton.edu",
    "yale.edu",
    "columbia.edu",
    "utoronto.ca",
    "cam.ac.uk",
    "ox.ac.uk",
]


def generate_name(gender: str = None) -> str:
    """
    Generate a realistic full name

    Args:
        gender: 'male', 'female', or None for random

    Returns:
        Full name string
    """
    if gender == "male":
        first_name = random.choice(FIRST_NAMES_MALE)
    elif gender == "female":
        first_name = random.choice(FIRST_NAMES_FEMALE)
    else:
        # Random gender selection
        first_name_pool = random.choice(
            [FIRST_NAMES_MALE, FIRST_NAMES_FEMALE, FIRST_NAMES_GENDER_NEUTRAL]
        )
        first_name = random.choice(first_name_pool)

    last_name = random.choice(LAST_NAMES)
    return f"{first_name} {last_name}"


def generate_email(
    first_name: str = None,
    last_name: str = None,
    is_student: bool = False,
    domain: str = None,
) -> str:
    """
    Generate a realistic email address

    Args:
        first_name: Optional first name to use
        last_name: Optional last name to use
        is_student: If True, use university domain
        domain: Specific domain to use

    Returns:
        Email address string
    """
    if not first_name:
        first_name = fake.first_name().lower()
    else:
        first_name = first_name.lower()

    if not last_name:
        last_name = random.choice(LAST_NAMES).lower()
    else:
        last_name = last_name.lower()

    # Clean names for email
    first_name = first_name.replace(" ", "").replace("-", "")
    last_name = last_name.replace(" ", "").replace("-", "")

    # Email format variations
    formats = [
        f"{first_name}.{last_name}",
        f"{first_name}{last_name}",
        f"{first_name[0]}{last_name}",
        f"{first_name}{last_name[0]}",
        f"{first_name}.{last_name}{random.randint(1, 99)}",
    ]

    email_prefix = random.choice(formats)

    if domain:
        email_domain = domain
    elif is_student:
        email_domain = random.choice(UNIVERSITY_DOMAINS)
    else:
        email_domain = random.choice(EMAIL_DOMAINS)

    return f"{email_prefix}@{email_domain}"


def generate_user_data(
    industry: str = None, is_student: bool = False
) -> Tuple[str, str, str]:
    """
    Generate complete user data (name, email, industry)

    Args:
        industry: Optional industry to associate with user
        is_student: If True, generate student email

    Returns:
        Tuple of (full_name, email, industry)
    """
    full_name = generate_name()

    # Split name for email generation
    name_parts = full_name.split(" ")
    first_name = name_parts[0]
    last_name = name_parts[-1] if len(name_parts) > 1 else ""

    email = generate_email(first_name, last_name, is_student)

    if not industry:
        from config import config

        industry = random.choice(config.INDUSTRIES)

    return full_name, email, industry


def generate_diverse_users(count: int) -> List[dict]:
    """
    Generate a list of diverse user profiles

    Args:
        count: Number of users to generate

    Returns:
        List of user data dictionaries
    """
    from config import config

    users = []
    for _ in range(count):
        full_name, email, industry = generate_user_data()

        users.append(
            {
                "full_name": full_name,
                "email": email,
                "industry": industry,
                "is_student": random.random() < 0.3,  # 30% students
            }
        )

    return users


# For testing
if __name__ == "__main__":
    print("Generated sample users:")
    for i, user in enumerate(generate_diverse_users(10), 1):
        print(f"{i}. {user['full_name']} - {user['email']} ({user['industry']})")
