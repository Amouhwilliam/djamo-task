# Third-party mock

Application that mocks the behavior of a 3rd party service.

## Run locally

Either you have nodejs on your machine, and you can run it with this command:

```
PORT=<SOME_PORT> npm run start
```

Or you can start it with Docker:

```
docker build . -t djamo/3rdparty
docker run -p "<SOME_PORT>:3000" --rm djamo/3rdparty
```

## Endpoints & Webhook

### POST /transaction

This applications exposes one endpoint, `/transaction`. It will return HTTP 200 after a delay comprised between 200ms and 10s. The expected body is as follow:

```json
{
  "id": "<some ID>",
  "webhookUrl": "<URL of your webhook>"
}
```

Roughly 10% of the time, this endpoint will time out and an HTTP 504 error will be returned. Half of these timed out requests will actually go through, after a while (30s to 120s).

### GET /transaction/:id

You can retrieve the data of a specific transaction with this endpoint. If no transaction is matching that ID, an HTTP 404 error is returned.

### Webhook

Roughly 80% of the time, after an HTTP POST on `/transaction`, a webhook will be sent to the supplied `webhookUrl` with a delay comprised between 10 and 30s. The payload will be as follow:

```json
{
  "id": "<id that was supplied>",
  "status": "<completed|declined>"
}
```

Roughly 1/3rd of the time, the status will be "declined".
