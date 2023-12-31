const REPORT_WINDOW_URL = "https://ababik.github.io/trace/viewer.html"

class Trace {
    private root: Context = null
    private current: Context = null

    constructor() {
        this.root = new Context(null, null)
        this.current = this.root
    }

    on(label: string, options?: TraceOptions) {
        let context = this.current.inner.get(label)
        if (!context) {
            context = new Context(label, this.current)
            this.current.inner.set(label, context)
        }
        this.current = context
        let skip = options?.skip || null
        let take = options?.take || null
        context.on(skip, take)
    }

    off(label: string) {
        if (this.current.label != label) {
            throw new Error(`Unexpected trace label "${label}" (expected "${this.current.label}").`)
        }
        this.current.off()
        this.current = this.current.parent
    }

    report() {
        if (this.current != this.root) {
            throw new Error(`Trace "${this.current.label}" is still active.`)
        }
        let grandTotal = 0
        let firstLevelContexts = this.root.inner.values()
        for (let contex of firstLevelContexts) {
            grandTotal += contex.deltas.reduce((a, b) => (a + b), 0)
        }
        let records: ReportRecord[] = []
        function walk(current: Context, records: ReportRecord[]) {
            for (let context of current.inner.values()) {
                let calc = context.calc(grandTotal)
                records.push(calc)
                walk(context, calc.inner)
            }
        }
        walk(this.root, records)
        let report: ReportSummary = {
            timestamp: Date.now(),
            grandTotal: grandTotal,
            records: records
        }
        console.log("trace", report)
        this.showReportWindow(report)
    }

    private showReportWindow(report: ReportSummary) {
        let reportWindow = window.open(REPORT_WINDOW_URL, "_blank")
        window.addEventListener("message", () => {
            reportWindow.postMessage(report, "*")
        })
    }
}

class Context {
    label: string = null

    start: number = 0
    count: number = 0
    deltas: number[] = []

    parent: Context = null
    inner: Map<string, Context> = new Map()

    constructor(label: string, parent: Context) {
        this.label = label
        this.parent = parent
    }

    on(skip: number, take: number) {
        this.start = 0
        this.count++
        let ignoreSkip = (skip != null) && (this.count <= skip)
        let ignoreTake = (take != null) && (this.deltas.length >= take)
        if (ignoreSkip || ignoreTake) {
            return
        }
        this.start = performance.now()
    }

    off() {
        let end = performance.now()
        if (this.start == 0) {
            return
        }
        let delta = end - this.start
        this.deltas.push(delta)
        this.start = 0
        return delta
    }

    calc(grandTotal: number): ReportRecord {
        let child = this.inner.size
        let count = this.deltas.length
        let total = this.deltas.reduce((a, b) => (a + b), 0)
        let percent = grandTotal ? (total / grandTotal * 100) : 0
        let mean = count ? (total / count) : 0
        let first = count ? this.deltas[0] : 0
        let max = Math.max(...this.deltas)
        let min = Math.min(...this.deltas)
        let squaredDifferences = this.deltas.map(value => Math.pow(value - mean, 2))
        let meanSquaredDifferences = count ? (squaredDifferences.reduce((a, b) => (a + b), 0) / count) : 0
        let stddev = Math.sqrt(meanSquaredDifferences)
        return {
            label: this.label,
            child, count, total, percent, first, max, min, mean, stddev,
            inner: []
        }
    }
}

window["trace"] = new Trace()