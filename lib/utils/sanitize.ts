/**
 * Input sanitization utilities for user-generated content
 * Prevents XSS, injection attacks, and other security issues
 */

// ===========================================
// HTML SANITIZATION
// ===========================================

/**
 * Allowed HTML tags for rich text content
 */
const ALLOWED_TAGS = new Set([
  "p", "br", "strong", "em", "u", "s",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li",
  "blockquote", "code", "pre",
  "a", "img",
  "table", "thead", "tbody", "tr", "th", "td"
])

/**
 * Allowed attributes for HTML tags
 */
const ALLOWED_ATTRIBUTES: Record<string, Set<string>> = {
  a: new Set(["href", "title", "target", "rel"]),
  img: new Set(["src", "alt", "title", "width", "height"]),
  td: new Set(["colspan", "rowspan"]),
  th: new Set(["colspan", "rowspan", "scope"])
}

/**
 * Allowed URL protocols for links
 */
const ALLOWED_PROTOCOLS = ["http://", "https://", "mailto:"]

/**
 * Strip HTML tags from string
 */
export function stripHtml(html: string): string {
  if (!html) return ""
  
  // Create DOM parser
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, "text/html")
  
  // Return text content only
  return doc.body.textContent || ""
}

/**
 * Sanitize HTML string (allow safe tags only)
 */
export function sanitizeHtml(html: string): string {
  if (!html) return ""
  
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, "text/html")
  
  // Process all elements
  const processNode = (node: Node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element
      const tagName = element.tagName.toLowerCase()
      
      // Remove disallowed tags
      if (!ALLOWED_TAGS.has(tagName)) {
        // Replace with text content
        const textNode = doc.createTextNode(element.textContent || "")
        node.parentNode?.replaceChild(textNode, node)
        return
      }
      
      // Remove disallowed attributes
      const allowedAttrs = ALLOWED_ATTRIBUTES[tagName]
      Array.from(element.attributes).forEach((attr) => {
        const attrName = attr.name.toLowerCase()
        
        // Check if attribute is allowed for this tag
        if (!allowedAttrs || !allowedAttrs.has(attrName)) {
          element.removeAttribute(attrName)
          return
        }
        
        // Validate URL attributes
        if (attrName === "href" || attrName === "src") {
          const value = attr.value.toLowerCase()
          
          // Allow relative URLs
          if (value.startsWith("/") || value.startsWith("#")) {
            return
          }
          
          // Check protocol
          const hasAllowedProtocol = ALLOWED_PROTOCOLS.some(protocol => 
            value.startsWith(protocol)
          )
          
          if (!hasAllowedProtocol && !value.startsWith("data:image/")) {
            element.removeAttribute(attrName)
          }
        }
        
        // Add rel="noopener noreferrer" to external links
        if (attrName === "href" && attr.value.startsWith("http")) {
          element.setAttribute("rel", "noopener noreferrer")
          element.setAttribute("target", "_blank")
        }
      })
    }
    
    // Process children
    node.childNodes.forEach(processNode)
  }
  
  Array.from(doc.body.childNodes).forEach(processNode)
  
  return doc.body.innerHTML
}

// ===========================================
// TEXT SANITIZATION
// ===========================================

/**
 * Escape HTML special characters
 */
export function escapeHtml(text: string): string {
  if (!text) return ""
  
  const htmlEscapes: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }
  
  return text.replace(/[&<>"']/g, (char) => htmlEscapes[char])
}

/**
 * Sanitize user input text
 */
export function sanitizeText(text: string, options: {
  maxLength?: number
  trim?: boolean
  allowUnicode?: boolean
} = {}): string {
  if (!text) return ""
  
  let result = text
  
  // Trim whitespace
  if (options.trim !== false) {
    result = result.trim()
  }
  
  // Remove control characters (except newlines and tabs)
  result = result.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
  
  // Limit length
  if (options.maxLength && result.length > options.maxLength) {
    result = result.slice(0, options.maxLength)
  }
  
  // Optionally restrict to ASCII only
  if (options.allowUnicode === false) {
    result = result.replace(/[^\x20-\x7E]/g, "")
  }
  
  return result
}

/**
 * Sanitize URL
 */
export function sanitizeUrl(url: string): string | null {
  if (!url) return null
  
  const trimmed = url.trim()
  
  // Check for javascript: protocol
  if (trimmed.toLowerCase().startsWith("javascript:")) {
    return null
  }
  
  // Check for data: protocol (except images)
  if (trimmed.toLowerCase().startsWith("data:") && !trimmed.startsWith("data:image/")) {
    return null
  }
  
  try {
    // Validate URL format
    new URL(trimmed)
    return trimmed
  } catch (_error) {
    // If not absolute URL, check if it's a valid relative URL
    if (trimmed.startsWith("/") || trimmed.startsWith("#")) {
      return trimmed
    }
    return null
  }
}

// ===========================================
// SERVER-SIDE SANITIZATION
// ===========================================

/**
 * Sanitize for database storage (prevent SQL injection via strings)
 * Note: Use parameterized queries instead of relying on this
 */
export function sanitizeForDatabase(value: string): string {
  // Remove null bytes
  return value.replace(/\0/g, "")
}

/**
 * Sanitize filename for storage
 */
export function sanitizeFilename(filename: string): string {
  // Remove path components
  let base = filename.split(/[\\/]/).pop() || ""
  
  // Remove special characters
  base = base.replace(/[^a-zA-Z0-9._-]/g, "_")
  
  // Limit length
  return base.slice(0, 255)
}

/**
 * Validate and sanitize markdown content
 */
export function sanitizeMarkdown(markdown: string): string {
  if (!markdown) return ""
  
  // Remove potential HTML injection in markdown
  let result = markdown
  
  // Remove script tags
  result = result.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
  
  // Remove event handlers
  result = result.replace(/\son\w+\s*=\s*["'][^"']*["']/gi, "")
  
  return result
}

// ===========================================
// RATE LIMIT HELPERS
// ===========================================

/**
 * Check if input is trying to bypass rate limits via array expansion
 */
export function validateInputSize(input: unknown, maxSize: number): boolean {
  if (Array.isArray(input)) {
    return input.length <= maxSize
  }
  if (typeof input === "object" && input !== null) {
    return Object.keys(input).length <= maxSize
  }
  if (typeof input === "string") {
    return input.length <= maxSize
  }
  return true
}
