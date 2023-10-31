<h1 align="center">
  <a href="https://openship.org">
    <img width="200px" style="margin-right: 20px" src="https://docs.openship.org/images/openship.svg">
  </a>
</h1>

<div align="center">

**Openship is an operations platform that enables multi-channel fulfillment**

[Website](https://openship.org) · [Documentation](https://docs.openship.org) · [Openship Cloud](https://openship.org/signup)

</div>

## Running locally

To get Openship running on your local machine:

### Clone the repo

```
git clone https://github.com/openshiporg/openship
```

### Rename example.env to .env

```shell
//.env
FRONTEND_URL=http://localhost:3000
DATABASE_URL=postgresql://postgres:example@url:3000/postgres
SESSION_SECRET=please_change_me
```

Be sure to replace DATABASE_URL with a postgres connection string.

You can run postgres locally or get a database online.

> Railway offers a free, temporary [postgres database](https://railway.app/new/postgresql).

### Start the application

Run the following commands start up Openship:

```js
$ cd openship
$ yarn install
$ yarn dev
```

### Openship: http://localhost:3000

Once the application is running, go to localhost:3000. If there are no users in the database, you'll be redirected to localhost:3000/init where you can create the admin user.

### GraphQL Playground: http://localhost:3000/api/graphql

Use the playground to build and run queries/mutations against the API.

### Keystone CMS: http://localhost:3000/dashboard

Openship uses [Keystone.js](https://github.com/keystonejs/keystone). Openship mounts the Keystone Admin UI to /dashboard. It's a great way to see and interact with your database.

## Deployment

Openship uses Next.js, so naturally, it can be hosted anywhere that supports Node.js. Openship also requires a `postgres` database.

### 1-Click Deployment

These deployment services offer `Node.js` and `postgres` databases so Openship can be deployed in 1-click.

#### Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template/31ZaPV?referralCode=fQpsld)

#### Render

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/openshiporg/openship)

### Next.js Deployment

To deploy on platforms that don't support databases like [Netlify](https://netlify.com) and [Vercel](https://vercel.com), you'll need to pass a `postgres` connection string as the `DATABASE_URL` variable.

#### Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fopenshiporg%2Fopenship&env=SESSION_SECRET,FRONTEND_URL,DATABASE_URL&envDescription=A%20postgres%20connection%20string%20is%20used%20for%20DATABASE_URL)

#### Netlify

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/openshiporg/openship)

Go to site settings > build & deploy > environment and add these variables:

```bash
  FRONTEND_URL=http://localhost:3000
  DATABASE_URL=postgresql://postgres:example@url:3000/postgres
  SESSION_SECRET=OH_PLEASE_PLEASE_CHANGE_ME
```

Replace DATABASE_URL with a postgres database connection string and FRONTEND_URL with the url ending in netlify.app. Redeploy the site.

## Credits

Openship wouldn't be here without these great projects

- [Next.js](https://nextjs.org/)
- [Keystone.js](https://keystonejs.com/)
- [Prisma](https://prisma.io/)
- [Mantine](https://mantine.dev/)
- [swr](https://swr.vercel.app/)
