'use strict'

const { join } = require('node:path')
const { readFileSync } = require('node:fs')

const fastify = require('fastify')

const UndiciTLSDispatcher = require('undici-tls-dispatcher')

const SERVER_TLS_KEY = readFileSync(join(__dirname, 'certs', 'server', 'server.key'), 'utf8')
const SERVER_TLS_CERT = readFileSync(join(__dirname, 'certs', 'server', 'server.crt'), 'utf8')

function createMtlsServer () {
  const app = fastify({
    https: {
      key: SERVER_TLS_KEY,
      cert: SERVER_TLS_CERT,
      rejectUnauthorized: false,
      requestCert: true
    }
  })

  return app
}

function createMtlsDispatcher (serverOrigin, clientServiceName) {
  let key = null
  let cert = null

  const mtlsClients = ['payments', 'client-test-1', 'client-empty']

  if (mtlsClients.includes(clientServiceName)) {
    key = readFileSync(join(__dirname, 'certs', clientServiceName, 'client.key'), 'utf8')
    cert = readFileSync(join(__dirname, 'certs', clientServiceName, 'client.crt'), 'utf8')
  } else {
    throw new Error(`Don't know how to create mTLS dispatcher for ${clientServiceName}`)
  }

  const tls = { key, cert }

  return new UndiciTLSDispatcher({
    connect: { rejectUnauthorized: false },
    tlsConfig: [{ url: serverOrigin, tls }]
  })
}

module.exports = { createMtlsServer, createMtlsDispatcher }
