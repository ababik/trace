type TraceOptions = {
    skip?: number
    take?: number
}

type ReportSummary = {
    timestamp: number
    total: number
    records: ReportRecord[]
}

type ReportRecord = {
    label: string
    calls: number
    duration: number
    percent: number
    first: number
    max: number
    min: number
    mean: number
    stddev: number
    records: ReportRecord[]
}
