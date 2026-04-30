export interface BM25Document {
  id: string
  text: string
  metadata?: Record<string, unknown>
}

export class BM25 {
  private k1 = 1.5
  private b = 0.75
  private avgdl = 0
  private documents: BM25Document[] = []
  private docLengths: number[] = []
  private docFreqs: Map<string, number> = new Map()
  private N = 0

  index(documents: BM25Document[]): void {
    this.documents = documents
    this.N = documents.length
    this.docLengths = documents.map(d => d.text.split(/\s+/).length)
    this.avgdl = this.docLengths.reduce((a, b) => a + b, 0) / this.N
    
    documents.forEach(doc => {
      const words = new Set(doc.text.toLowerCase().split(/\s+/))
      words.forEach(word => {
        this.docFreqs.set(word, (this.docFreqs.get(word) || 0) + 1)
      })
    })
  }

  search(query: string, limit = 10): Array<{ doc: BM25Document; score: number }> {
    const queryWords = query.toLowerCase().split(/\s+/)
    const scores: Array<{ doc: BM25Document; score: number }> = []

    for (let i = 0; i < this.documents.length; i++) {
      const doc = this.documents[i]
      const docWords = doc.text.toLowerCase().split(/\s+/)
      const docLength = this.docLengths[i]
      
      let score = 0
      for (const word of queryWords) {
        const df = this.docFreqs.get(word) || 0
        if (df === 0) continue
        
        const tf = docWords.filter(w => w === word).length
        const idf = Math.log((this.N - df + 0.5) / (df + 0.5))
        const tfTerm = (tf * (this.k1 + 1)) / (tf + this.k1 * (1 - this.b + this.b * docLength / this.avgdl))
        
        score += idf * tfTerm
      }
      
      if (score > 0) {
        scores.push({ doc, score })
      }
    }

    return scores.sort((a, b) => b.score - a.score).slice(0, limit)
  }
}