export const loadJobConfig = (jobId: string) => {
    return {
        jobId,
        //removeOnComplete: true,
        attempts: 100,
        backoff: {
            type: 'fixed',
            delay: 500, // delayed the job to not overwhelm the external api (conform to the api rate limiting)
        },
        concurrency: 5 // increase to add more workers
    }
}
