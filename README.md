### mtls-auth

Plugin to extract authentication information from mTLS certificate common name.

__Example:__

Common name: `payments.test.com`

```js
const app = fastify(/* tls certs */)

app.register(mtlsAuthPlugin, {
  mtlsCommonNameDomain: 'test.com'
})

app.get('/test', async (request) => {
  await request.createMtlsSession()
  console.log(request.user['X-PLATFORMATIC-ROLE']) // payments
})
```

Common name: `e4a123f8-1f12-11ee-be56-0242ac120002.clients.test.com`

```js
const app = fastify(/* tls certs */)

app.register(mtlsAuthPlugin, {
  mtlsClientsRole: 'clients',
  mtlsCommonNameDomain: 'test.com'
})

app.get('/test', async (request) => {
  await request.createMtlsSession()
  console.log(request.user['X-PLATFORMATIC-ROLE']) // clients
  console.log(request.user['X-PLATFORMATIC-WORKSPACE-ID']) // e4a123f8-1f12-11ee-be56-0242ac120002
})
```
