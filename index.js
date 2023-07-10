'use strict'

const fp = require('fastify-plugin')

async function plugin (app, options) {
  const clientsRole = options.mtlsClientsRole ?? null
  const commonNameDomain = `.${options.mtlsCommonNameDomain}`

  app.decorateRequest('createMtlsSession', async function () {
    if (typeof this.raw?.socket?.getPeerCertificate !== 'function') {
      throw new Error('Request is not a TLS connection')
    }

    const certificate = this.raw.socket.getPeerCertificate(false)
    const commonName = certificate.subject.CN

    if (!commonName.endsWith(commonNameDomain)) {
      throw new Error('Invalid certificate common name')
    }

    const domains = commonName.slice(0, -commonNameDomain.length).split('.').reverse()

    const role = domains[0]

    if (clientsRole && role === clientsRole) {
      const workspaceId = domains[1]
      if (workspaceId === undefined) {
        throw new Error('Missing workspace ID in certificate common name')
      }

      this.user = {
        'X-PLATFORMATIC-ROLE': role,
        'X-PLATFORMATIC-WORKSPACE-ID': workspaceId
      }
    } else {
      this.user = {
        'X-PLATFORMATIC-ROLE': role
      }
    }
  })
}

module.exports = fp(plugin, { name: 'mtls-auth' })
