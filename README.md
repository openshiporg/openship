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

### Rename example.env to .env and fill out these required values

```shell
//.env
FRONTEND_URL=http://localhost:3000
DATABASE_URL=postgresql://postgres:example@url:3000/postgres
SESSION_SECRET=OH_PLEASE_PLEASE_PLEASE_CHANGE_ME
```

Be sure to replace `DATABASE_URL` with a postgres connection string.

You can run postgres locally or get a database online.

### Start the application

Run the following commands start up Openship:

```js
$ cd openship
$ yarn install
$ yarn dev
```

### Openship: http://localhost:3000/dashboard

Once the application is running, go to localhost:3000. If there are no users in the database, you'll be redirected to localhost:3000/init where you can create the admin user.

### GraphQL Playground: http://localhost:3000/api/graphql

Use the playground to build and run queries/mutations against the API.

## Deployment

Openship uses Next.js, so naturally, it can be hosted anywhere that supports Node.js. Openship also requires a `postgres` database.

### 1-Click Deployment

These deployment services offer `Node.js` and `postgres` databases so Openship can be deployed in 1-click.

#### Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template/31ZaPV?referralCode=fQpsld)

#### Render

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/openshiporg/openship)

#### Vercel

Before you click the Vercel deploy button below, be sure to get a postgres database connection string. Vercel has database storage where you can create a postgres database by following [these instructions](https://vercel.com/docs/storage/vercel-postgres/quickstart#create-a-postgres-database). Be sure to use the `POSTGRES_PRISMA_URL` as `DATABASE_URL`.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fopenshiporg%2Fopenship&env=SESSION_SECRET,FRONTEND_URL,DATABASE_URL&envDescription=A%20postgres%20connection%20string%20is%20used%20for%20DATABASE_URL)

### Next.js Deployment

To deploy on platforms that don't support databases like [Netlify](https://netlify.com), you'll need to pass a postgres connection string as the `DATABASE_URL` variable.

#### Netlify

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/openshiporg/openship#FRONTEND_URL=https://yourapp.netlify.app&DATABASE_URL=postgresql://postgres:example@url:3000/postgres&SESSION_SECRET=OH_PLEASE_PLEASE_PLEASE_CHANGE_ME)

After the site is deployed, we need to add the correct deployment URL (ending in netlify.app or your custom domain).

Go to site settings > build & deploy > environment and add these variables:

```bash
  FRONTEND_URL=https://yourapp.netlify.app
```

Replace `FRONTEND_URL` with the url ending in netlify.app. Redeploy the site.

### Docker

Create a copy of example.env named `.env` and cusotmize the session secret, as well as the postgres user/password/dbname as you wish:

```
cp example.env .env
```

The project datase init is coupled with the build system, so we have to start the postgres service before building:

```
mkdir ./volumes/postgres/data
docker-compose up -d postgres
```

Now build and start the OpenShip container itself:
```
docker-compose up -d
```

The web app should be available at `curl localhost:3100`. If it is not, please check `docker-compose logs`.

Finally, expose the `localhost:3100` to the desired public host.

## Credits

Openship wouldn't be here without these great projects

- [Next.js](https://nextjs.org/)
- [Keystone.js](https://keystonejs.com/)
- [Prisma](https://prisma.io/)
- [Shadcn/ui](https://mantine.dev/)
- [Full Credits](https://github.com/openshiporg/openship/blob/main/package.json)
