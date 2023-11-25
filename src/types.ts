type TraceOptions = {
    skip?: number
    take?: number
}

type ReportSummary = {
    timestamp: number
    grandTotal: number
    records: ReportRecord[]
}

type ReportRecord = {
    label: string
    child: number
    count: number
    total: number
    percent: number
    first: number
    max: number
    min: number
    mean: number
    stddev: number
    inner: ReportRecord[]
}
