const REPORT_WINDOW_URL = "https://ababik.github.io/trace/viewer.html"

type TraceOptions = {
    skip?: number
    take?: number
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

class Trace {
    private root: Context = null
    private current: Context = null
    private grandTotal: number = 0

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
        let context = this.current
        this.grandTotal += context.off()
        this.current = context.parent
    }

    report() {
        if (this.current != this.root) {
            throw new Error(`Trace "${this.current.label}" is still active.`)
        }
        let grandTotal = this.grandTotal
        let records: ReportRecord[] = []
        function walk(current: Context, records: ReportRecord[]) {
            for (let context of current.inner.values()) {
                let calc = context.calc(grandTotal)
                records.push(calc)
                walk(context, calc.inner)
            }
        }
        walk(this.root, records)
        console.log(records)
        this.showReportWindow(records)
    }

    private showReportWindow(records: ReportRecord[]) {
        let reportWindow = window.open(REPORT_WINDOW_URL, "_blank")
        reportWindow.addEventListener("message", () => {
            reportWindow.postMessage(records)
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
        let percent = total / grandTotal * 100
        let mean = total / count
        let first = count ? this.deltas[0] : 0
        let max = Math.max(...this.deltas)
        let min = Math.min(...this.deltas)
        let squaredDifferences = this.deltas.map(value => Math.pow(value - mean, 2))
        let meanSquaredDifferences = squaredDifferences.reduce((a, b) => (a + b), 0) / count
        let stddev = Math.sqrt(meanSquaredDifferences)
        return {
            label: this.label,
            child, count, total, percent, first, max, min, mean, stddev,
            inner: []
        }
    }
}

window['trace'] = new Trace()