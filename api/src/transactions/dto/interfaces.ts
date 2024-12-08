export interface TrxInterface {
    id: string
    status: string
    webhookUrl: string
}

export interface Transaction {
    id: number
    transactionID: string
    status: string
}