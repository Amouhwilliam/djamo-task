export const loadJobConfig = (jobId: string) => {
    return {
        jobId,
        //removeOnComplete: true,
        attempts: 1000,
        backoff: {
            type: 'fixed',
            delay: 50, // delayed the job to not overwhelm the external api (conform to the api rate limiting)
        },
        concurrency: 20 // increase to add more workers
    }
}
