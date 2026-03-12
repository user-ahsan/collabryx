/**
 * Format a name into initials (first 2 characters, uppercase)
 * @param name - Full name string (e.g., "John Doe" → "JD")
 * @returns Formatted initials (max 2 characters)
 */
export function formatInitials(name: string): string {
  if (!name || name.trim() === "") {
    return "U"
  }
  
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Format initials from name, with fallback handling
 * @param name - Name string (can be null/undefined)
 * @param fallback - Fallback initials (default: "U")
 * @returns Formatted initials
 */
export function getInitials(name: string | null | undefined, fallback = "U"): string {
  if (!name || name.trim() === "") {
    return fallback
  }
  
  return formatInitials(name)
}
