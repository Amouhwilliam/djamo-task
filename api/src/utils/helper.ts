export const loadJobConfig = (jobId: string) => {
    return {
        jobId,
        //removeOnComplete: true,
        attempts: 100,
        backoff: {
            type: 'fixed',
            delay: 1000,
        },
        concurrency: 5 // increase to add more workers
    }
}
