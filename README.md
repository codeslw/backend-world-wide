<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Recent Updates

### Enhanced Chat System

The backend now features an improved real-time chat system with:

- WebSocket-based messaging with Socket.io
- Read status tracking and unread message counts
- File attachments and message replies
- Typing indicators and chat status management

For frontend developers, we've provided comprehensive documentation:
- [Chat API Documentation](docs/CHAT_API.md) - Complete API reference
- [Chat System Updates](docs/CHAT_UPDATES.md) - Latest changes and migration guide
- Swagger documentation at `/api` including WebSocket endpoints

### API Documentation

The project includes comprehensive Swagger documentation:

- RESTful API endpoints with request/response schemas
- WebSocket events and payloads
- Authentication requirements
- Example usage for both REST and WebSocket APIs

Access the documentation by running the server and navigating to:
```
http://localhost:3000/api
```

### Project Features

- User authentication with JWT
- Role-based access control
- File uploads with Digital Ocean Spaces
- RESTful API with Swagger documentation
- PostgreSQL database with Prisma ORM
- WebSocket support for real-time features

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

This project uses Docker Compose for streamlined deployment. The deployment process is:

1. Ensure you have Docker and Docker Compose installed
2. Clone the repository
3. Create an `.env` file with the required environment variables
4. Run `docker-compose up -d` to start the services

### Environment Variables

The following environment variables are required:

```
DATABASE_URL=postgresql://postgres:password@postgres:5432/world-wide-db?schema=public
JWT_SECRET=your_jwt_secret  # This is critical for authentication to work
DIGITAL_OCEAN_ACCESS_KEY=your_digital_ocean_access_key
DIGITAL_OCEAN_SECRET_KEY=your_digital_ocean_secret_key
DIGITAL_OCEAN_BUCKET=your_digital_ocean_bucket
DIGITAL_OCEAN_ENDPOINT=your_digital_ocean_endpoint
```

> **Important**: The `JWT_SECRET` is critical for authentication to work. If it's not set or is using the default value, the application will fail to start with a "JwtStrategy requires a secret or key" error.

### Data Persistence

The application uses Docker volumes to persist data:

- PostgreSQL data is stored in a named volume `world-wide-postgres-data`
- This volume is preserved during deployments and container restarts
- To backup your database, you can use Docker's volume backup commands

### CI/CD Pipeline

The CI/CD pipeline automatically:

1. Runs tests on pull requests
2. Deploys to the production environment on merge to master
3. Uses Docker Compose for consistent deployments
4. Performs health checks to ensure successful deployment

### Manual Deployment

If you need to manually deploy the application:

```bash
# Run the manual deployment script
npm run deploy:manual
```

This script will:
1. Update your git repository to the latest master
2. Clean Docker resources
3. Rebuild and restart containers
4. Run database migrations

### Troubleshooting Deployment Issues

If you're experiencing deployment issues:

1. **Git not showing latest commits**
   ```bash
   # Run the deployment fix script
   npm run deploy:fix
   ```

2. **Container startup failures**
   - Check logs: `docker-compose logs -f`
   - Verify `.env` file exists with correct values
   - Ensure docker service is running: `systemctl status docker`

3. **Database connection issues**
   - Check if PostgreSQL container is running: `docker-compose ps`
   - Verify database credentials in `.env` match docker-compose.yml

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
