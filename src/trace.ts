const REPORT_WINDOW_URL = "https://ababik.github.io/trace/viewer.html"
export class Trace {
    private root: Context = null
    private current: Context = null

    constructor() {
        this.root = new Context(null, null)
        this.current = this.root
    }

    on(label: string, options?: TraceOptions) {
        let context = this.current.slaves.get(label)
        if (context === undefined) {
            context = new Context(label, this.current)
            this.current.slaves.set(label, context)
        }
        this.current = context
        const skip = options?.skip || null
        const take = options?.take || null
        context.on(skip, take)
    }

    off(label: string) {
        if (this.current.label != label) {
            throw new Error(`Unexpected trace label "${label}" (expected "${this.current.label}").`)
        }
        this.current.off()
        this.current = this.current.master
    }

    report() {
        if (this.current !== this.root) {
            throw new Error(`Trace "${this.current.label}" is still active.`)
        }
        const total = [...this.root.slaves.values()]
            .map(context => context.duration)
            .reduce((d1, d2) => (d1 + d2), 0)
        function walk(current: Context, records: ReportRecord[]) {
            for (const context of current.slaves.values()) {
                const percent = total ? (context.duration / total * 100) : 0
                const record: ReportRecord = {
                    label: context.label,
                    calls: context.calls,
                    duration: context.duration,
                    first: context.first,
                    max: context.max,
                    min: context.min,
                    mean: context.mean,
                    stddev: context.stddev,
                    percent: percent,
                    records: []
                }
                records.push(record)
                walk(context, record.records)
            }
        }
        const records: ReportRecord[] = []
        walk(this.root, records)
        const timestamp = Date.now()
        const report: ReportSummary = { timestamp, total, records }
        console.log("trace", report)
        this.showReportWindow(report)
        return report
    }

    private showReportWindow(report: ReportSummary) {
        const reportWindow = window.open(REPORT_WINDOW_URL, "_blank")
        window.addEventListener("message", () => {
            reportWindow.postMessage(report, "*")
        })
    }
}

export class Context {
    label: string = null

    iterations: number = 0
    calls: number = 0
    start: number = 0
    duration: number = 0
    mean: number = 0
    sumsq: number = 0
    stddev: number = 0
    first: number = 0
    max: number = 0
    min: number = 0

    master: Context = null
    slaves: Map<string, Context> = new Map()

    constructor(label: string, master: Context) {
        this.label = label
        this.master = master
    }

    on(skip: number, take: number) {
        this.start = 0
        this.iterations++
        const ignoreSkip = (skip !== null) && (this.iterations <= skip)
        const ignoreTake = (take !== null) && (this.calls >= take)
        if (ignoreSkip || ignoreTake) return
        this.calls++
        this.start = performance.now()
    }

    off() {
        const end = performance.now()
        if (this.start === 0) return
        const duration = end - this.start
        this.start = 0
        this.duration += duration
        this.mean = this.duration / this.calls
        this.sumsq += duration * duration
        const variance = (this.sumsq - (this.duration * this.duration / this.calls)) / this.calls
        this.stddev = Math.sqrt(variance)
        if (this.first === 0) this.first = duration
        if (this.calls === 1) {
            this.min = duration
            this.max = duration
        } else {
            if (duration > this.max) this.max = duration
            if (duration < this.min) this.min = duration
        }
    }
}

window["trace"] = new Trace()