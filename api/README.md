# API
This Project is built with [Nest](https://github.com/nestjs/nest), [Postgres](https://www.postgresql.org/) and [Redis](https://redis.io/).

## Context
The purpose of this API is to facilitate client transactions while delivering the best possible user experience. It ensures that the client is promptly notified whether their transaction was successful or failed. To achieve this, the API interacts with a third-party service to retrieve the transaction's outcome. However, this third-party service is unreliable: it frequently times out, often takes a significant amount of time to respond, and occasionally requires retries or fallback mechanisms to handle delays effectively.

## Solution 
To enhance the user experience during transactions, our system processes transactions asynchronously. Upon receiving a transaction request, the API responds immediately with a "pending" status, informing the user that they will be notified once the transaction is complete.

To implement asynchronous processing, we utilize a job queue powered by BullMQ, with Redis as the underlying data store. Each transaction is queued and processed independently, which helps manage issues encountered with the third-party API, such as timeouts or failures. If a transaction fails, the job is automatically retried. Once the transaction is successfully processed, the database is updated, and the user is notified of the outcome.

The system processes jobs concurrently, leveraging multiple workers to handle multiple transactions simultaneously. Transaction details are stored in a PostgreSQL database and cached using Redis, ensuring rapid response times when serving transaction results.

To prevent unprocessed transactions from being forgotten, a cron job runs every 2 minutes to identify pending transactions in the database that are not enqueued and processes them. The API is designed to be idempotent, ensuring that duplicate requests are handled gracefully. A middleware caches the transaction response for 5 seconds to return the same response to duplicate requests during this time. Transactions are temporarily cached for 50 seconds after being recorded in the database or successfully processed. This enables the system to deliver rapid responses to repeated transaction requests while avoiding redundant processing.

This non-blocking, asynchronous design abstracts third-party API issues from the client, ensuring a seamless and efficient user experience while maintaining system reliability and performance.

Please find the senquence diagram in the sequence-diagram.png file at the root of this folder
In this version is the most cleaned and lightweight version of the project if you want to have tools to check db, the queues or the caches or also have acces to a custom tracing system implemented with logs, please run this tag:

## Discussion
The API currently lacks unit tests and load testing due to time constraints. However, I strongly advocate that a robust API should be thoroughly tested. Every file and piece of code should be covered with comprehensive unit tests to ensure reliability. Additionally, implementing load testing would provide valuable insights into the API's resilience and performance under stressful conditions, helping to identify potential bottlenecks and improve stability.

The CronJob task in our case could become resource-intensive if we process billions of transactions daily, as it involves fetching pending transactions and verifying whether they are already enqueued. To optimize this, reducing the interval time could help minimize the backlog of unprocessed or failed data. Alternatively, implementing an efficient pagination strategy could offer a more scalable and elegant solution. However, it's important to note that this fallback mechanism is primarily designed to ensure no transactions are missed, as the queues themselves are fast and reliable for normal operations.

## Findings

- While testing and debuging i find out the third party api reacts quite differently compare to what is stated in the README.md file:
80% of the time when it does not timeout, the third party api should reply via our webhook and the rest reply directly but it actually alway replies both ways.

Again those are just findings, maybe the third party is designed that way as it mimic a very unreliable app ;)
either the api is designed to handle them. 

- the client app has a potential "bug" at the line 25.   
```bash
const { id, status } = req.body.status;
```
which I replaced which
```bash
const { id, status } = req.body;
```

## Running the app

Run the docker compose file at the root of the project to run the whole stack no extra command is needed,
but if you are willing to run the api separately without docker please follow intructions the below

```bash
$ yarn install
```

```bash
# development
$ yarn run start

# watch mode
$ yarn run start:dev

# production mode
$ yarn run start:prod
```
