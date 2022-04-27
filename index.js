'use strict'

const lunr = require('lunr')

async function getDocsById (rows) {
  const keys = rows.map(row => row.ref)
  const result = await this.allDocs({ keys, include_docs: true })
  return result.rows.reduce((all, { doc }) => {
    all[doc._id] = doc
    return all
  }, {})
}

module.exports = {
  async getSearchIndex (fields, opts = {}) {
    const { indexer, language } = opts
    const builder = new lunr.Builder()

    if (language) {
      builder.use(language)
    }

    builder.pipeline.add(
      lunr.trimmer,
      lunr.stopWordFilter,
      lunr.stemmer
    )

    builder.searchPipeline.add(
      lunr.stemmer
    )

    builder.ref('_id')
    fields.map(field => builder.field(field))

    await this.query((doc, emit) => {
      const ok = fields
        .map(field => field in doc)
        .reduce((all, value) => { return all && value }, true)
      if (ok) {
        if (indexer) {
          indexer(builder, doc)
        } else {
          builder.add(doc)
        }
      }
    })

    return builder.build()
  },
  async searchFromIndex (index, query) {
    return index.search(query)
  },
  async hydrateSearchResults (fields, query, results, opts = {}) {
    const {
      include_docs: includeDocs,
      highlighting,
      highlighting_pre: highlightingPre,
      highlighting_post: highlightingPost
    } = opts

    let docsById // in case we need the actual docs, index them by ID

    // handle include_docs
    if (includeDocs) {
      docsById = await getDocsById.call(this, results)
      results.forEach(result => {
        result.doc = docsById[result.ref]
      })
    }

    // handle highlighting
    if (highlighting) {
      if (!docsById) docsById = await getDocsById.call(this, results)
      results.forEach(result => {
        const doc = docsById[result.ref]
        result.highlighting = {}
        for (const field of fields) {
          result.highlighting[field] = doc[field].replace(
            new RegExp(query, 'g'),
            `${highlightingPre || '<strong>'}${query}${highlightingPost || '</strong>'}`
          )
        }
      })
    }

    return results
  },
  async search (fields, query, opts = {}) {
    const index = await this.getSearchIndex(fields, opts)
    const results = await this.searchFromIndex(index, query)
    await this.hydrateSearchResults(fields, query, results, opts)

    return results
  }
}
