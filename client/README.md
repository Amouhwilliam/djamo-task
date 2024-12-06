# Client mock

Application that mocks the behaviour of a client's mobile application.

## Run locally

Either you have nodejs on your machine, and you can run it with this command:

```
PORT=<SOME_PORT> YOUR_API=<URL_OF_YOUR_API> npm run start
```

Or you can start it with Docker:

```
docker build . -t djamo/client
docker run -p "<SOME_PORT>:3000" -e YOUR_API=<URL_OF_YOUR_API> --rm djamo/client
```

## Endpoints

### POST /transaction

Will call your API on the endpoint `/transaction` with the following body:

```json
{
  "id": "<random uuid>"
}
```

And wil log the response.

### PUT /transaction

Will update the transaction's status. It expects the following body:

```json
{
    "id": "<your UUID>",
    "status": "<accepted|declined>"
```
