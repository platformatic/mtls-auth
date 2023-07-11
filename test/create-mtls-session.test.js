'use strict'

const assert = require('node:assert')
const { test } = require('node:test')
const { request } = require('undici')
const fastify = require('fastify')

const mtlsAuthPlugin = require('..')
const { createMtlsServer, createMtlsDispatcher } = require('./helper')

test('should create an mtls session', async (t) => {
  const app = createMtlsServer()

  app.register(mtlsAuthPlugin, {
    mtlsCommonNameDomain: 'test.com'
  })

  app.get('/user', async (request) => {
    await request.createMtlsSession()
    return request.user
  })

  const serverOrigin = await app.listen({ port: 0 })
  t.after(() => app.close())

  const url = serverOrigin + '/user'
  const { statusCode, body } = await request(url, {
    method: 'GET',
    dispatcher: createMtlsDispatcher(serverOrigin, 'payments')
  })

  assert.strictEqual(statusCode, 200)

  const user = await body.json()
  assert.deepStrictEqual(user, {
    'X-PLATFORMATIC-ROLE': 'payments'
  })
})

test('should fail if common name domain is wrong', async (t) => {
  const app = createMtlsServer()

  app.register(mtlsAuthPlugin, {
    mtlsCommonNameDomain: 'foo.bar.com'
  })

  app.get('/user', async (request) => {
    await request.createMtlsSession()
    return request.user
  })

  const serverOrigin = await app.listen({ port: 0 })
  t.after(() => app.close())

  const url = serverOrigin + '/user'
  const { statusCode, body } = await request(url, {
    method: 'GET',
    dispatcher: createMtlsDispatcher(serverOrigin, 'payments')
  })

  assert.strictEqual(statusCode, 500)

  const error = await body.json()
  assert.strictEqual(error.message, 'Invalid certificate common name')
})

test('should create client session', async (t) => {
  const app = createMtlsServer()

  app.register(mtlsAuthPlugin, {
    mtlsClientsRole: 'clients',
    mtlsCommonNameDomain: 'test.com'
  })

  app.get('/user', async (request) => {
    await request.createMtlsSession()
    return request.user
  })

  const serverOrigin = await app.listen({ port: 0 })
  t.after(() => app.close())

  const url = serverOrigin + '/user'
  const { statusCode, body } = await request(url, {
    method: 'GET',
    dispatcher: createMtlsDispatcher(serverOrigin, 'client-test-1')
  })

  assert.strictEqual(statusCode, 200)

  const user = await body.json()
  assert.deepStrictEqual(user, {
    'X-PLATFORMATIC-ROLE': 'clients',
    'X-PLATFORMATIC-WORKSPACE-ID': 'e4a123f8-1f12-11ee-be56-0242ac120002'
  })
})

test('should fail if there is a client role without id', async (t) => {
  const app = createMtlsServer()

  app.register(mtlsAuthPlugin, {
    mtlsClientsRole: 'clients',
    mtlsCommonNameDomain: 'test.com'
  })

  app.get('/user', async (request) => {
    await request.createMtlsSession()
    return request.user
  })

  const serverOrigin = await app.listen({ port: 0 })
  t.after(() => app.close())

  const url = serverOrigin + '/user'
  const { statusCode, body } = await request(url, {
    method: 'GET',
    dispatcher: createMtlsDispatcher(serverOrigin, 'client-empty')
  })

  assert.strictEqual(statusCode, 500)

  const error = await body.json()
  assert.strictEqual(error.message, 'Missing workspace ID in certificate common name')
})

test('should fail if it is not a tls connection', async (t) => {
  const app = fastify()

  app.register(mtlsAuthPlugin, {
    mtlsClientsRole: 'payments'
  })

  app.get('/user', async (request) => {
    await request.createMtlsSession()
    return request.user
  })

  const serverOrigin = await app.listen({ port: 0 })
  t.after(() => app.close())

  const url = serverOrigin + '/user'
  const { statusCode, body } = await request(url, {
    method: 'GET',
    dispatcher: createMtlsDispatcher(serverOrigin, 'payments')
  })

  assert.strictEqual(statusCode, 500)

  const error = await body.json()
  assert.strictEqual(error.message, 'Request is not a TLS connection')
})
