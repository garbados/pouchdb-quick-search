/* global describe, it, beforeEach, afterEach */

'use strict'

const assert = require('assert')
const { name } = require('./package.json')
const PouchDB = require('pouchdb')
PouchDB.plugin(require('.'))

const WORDS = ['hello', 'goodbye', 'love']

describe(name, function () {
  beforeEach(async function () {
    this.db = new PouchDB('.test')
    for (let i = 0; i < 100; i++) {
      const j = Math.floor(Math.random() * WORDS.length)
      const word1 = WORDS[WORDS.length % i]
      const word2 = WORDS[j]
      await this.db.post({ title: word1, text: `${word1} ${word2}` })
    }
  })

  afterEach(async function () {
    await this.db.destroy()
  })

  it('should do basic search', async function () {
    const results = await this.db.search(['title', 'text'], WORDS[0])
    for (const result of results) {
      assert.equal(typeof result.ref, 'string')
      assert.equal(typeof result.score, 'number')
    }
  })

  it('should include docs in results', async function () {
    const results = await this.db.search(['title', 'text'], WORDS[0], {
      include_docs: true
    })
    for (const result of results) {
      assert.equal(typeof result.ref, 'string')
      assert.equal(typeof result.score, 'number')
      assert.equal(typeof result.doc, 'object')
    }
  })

  it('should highlight results', async function () {
    const results = await this.db.search(['title', 'text'], WORDS[0], {
      highlighting: true
    })
    const { highlighting } = results[0]
    assert.equal(highlighting.title, `<strong>${WORDS[0]}</strong>`)
  })

  it('should use another language', async function () {
    // TODO
  })

  it('should use a custom indexer', async function () {
    // TODO
  })
})
