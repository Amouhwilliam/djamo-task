# Your API

This is where you are expected to write the application. You are free to choose the technology and framework. At Djamo, our typical stack is written in [TypeScript](https://www.typescriptlang.org/), using [NestJS](https://docs.nestjs.com/) and relying on [Postgres](https://www.postgresql.org/) for persistent storage and [Redis](https://redis.io/) for cache.

## Expected endpoints

You are expected to implement at least one endpoint, `/transaction` that accepts HTTP POST requests from the client. You are free to choose the body and headers of that endpoint.

## Expected artefacts

### README file

You _need_ to update this README with instructions on how to use your program. Think of it as scratchboard. You are highly encouraged to discuss your approach, mention pitfalls you have seen but not fixed, alternative approaches that you may have discarded and for what reason.

### Documentation

Sequence diagrams are encouraged to describe your chosen approach, other than that you are welcomed to document your code as you would have done under normal circumstances.

### Working solution

⚠️ The whole stack needs to work with the command: `docker-compose up -d`. You are expected to update the Dockerfiles and the docker-compose file according to the requirements of your solution. For instance, if you need an SQL script to be ran against a database, it needs to be done automatically without human intervention.
