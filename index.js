'use strict'

const fp = require('fastify-plugin')

async function plugin (app, options) {
  const clientsRole = options.mtlsClientsRole ?? null
  const mtlsDomain = options.mtlsDomain ? `.${options.mtlsDomain}` : null

  app.decorateRequest('getMtlsAuth', function () {
    if (typeof this.raw?.socket?.getPeerCertificate !== 'function') {
      throw new Error('Request is not a TLS connection')
    }

    const certificate = this.raw.socket.getPeerCertificate(false)
    const commonName = certificate?.subject?.CN

    if (commonName && mtlsDomain && !commonName.endsWith(mtlsDomain)) {
      app.log.error({ commonName }, 'Invalid certificate common name')
      throw new Error('Invalid certificate common name')
    }

    if (!commonName) {
      return {}
    }

    const domains = commonName.slice(0, -mtlsDomain.length).split('.').reverse()

    const role = domains[0]

    if (clientsRole && role === clientsRole) {
      const workspaceId = domains[1]
      if (workspaceId === undefined) {
        app.log.error(
          { commonName, workspaceId },
          'Missing workspace ID in certificate common name'
        )
        throw new Error('Missing workspace ID in certificate common name')
      }
      return {
        'X-PLATFORMATIC-ROLE': role,
        'X-PLATFORMATIC-WORKSPACE-ID': workspaceId
      }
    } else {
      return { 'X-PLATFORMATIC-ROLE': role }
    }
  })
}

module.exports = fp(plugin, { name: 'mtls-auth' })
