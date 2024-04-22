function generate(report: ReportSummary) {
    let { records, timestamp, total } = report
    setTitle(timestamp, total)
    let table = document.querySelector(".table-body")
    function appendCell(row: HTMLElement, value: string) {
        let cell = document.createElement("div")
        cell.classList.add("table-cell")
        cell.innerText = value
        row.appendChild(cell)
    }
    function walk(records: ReportRecord[], level: number) {
        for (let record of records) {
            let row = document.createElement("div")
            table.appendChild(row)

            row.dataset["level"] = level.toString()
            
            row.classList.add("table-row")
            if (record.records.length) {
                row.classList.add("expander", "collapsed")
                row.addEventListener("click", () => toggle(row))
            }
            if (level != 1) {
                row.classList.add("hidden")
            }

            let cellLabel = document.createElement("div")
            cellLabel.classList.add("table-cell")
            let cellLabelInner = document.createElement("div")
            let label = record.label
            if (record.records.length !== 0) {
                label += ` (${record.records.length})`
            }
            cellLabelInner.innerText = label
            cellLabel.appendChild(cellLabelInner)
            row.appendChild(cellLabel)

            appendCell(row, Math.round(record.percent) + " %")
            appendCell(row, record.calls.toString())
            appendCell(row, record.duration.toFixed(4))
            appendCell(row, record.first.toFixed(4))
            appendCell(row, record.max.toFixed(4))
            appendCell(row, record.min.toFixed(4))
            appendCell(row, record.mean.toFixed(4))
            appendCell(row, record.stddev.toFixed(4))

            walk(record.records, level + 1)
        }
    }
    walk(records, 1)
}

function toggle(row: HTMLElement, expand = false) {
    if (!expand) {
        expand = row.classList.contains("collapsed")
        row.classList.toggle("collapsed")
    }
    let level = +row.dataset["level"]
    let next = row
    while (true) {
        next = next.nextElementSibling as HTMLElement
        if (!next) {
            break
        }
        let nextLevel = +next.dataset.level
        if (nextLevel <= level) {
            break
        }
        if (expand) {
            if (nextLevel == level + 1) {
                next.classList.remove("hidden")
                if (!next.classList.contains("collapsed")) {
                    toggle(next, true)
                }
            }
        } else {
            next.classList.add("hidden")
        }
    }
}

function setTitle(timestamp: number, total: number) {
    let date = new Date(timestamp)
    let hours = date.getHours().toString().padStart(2, "0")
    let minutes = date.getMinutes().toString().padStart(2, "0")
    let seconds = date.getSeconds().toString().padStart(2, "0")
    window.document.title = `${hours}:${minutes}:${seconds} - ${Math.round(total)}ms`;
}

window.addEventListener("message", (event: MessageEvent<ReportSummary>) => {
    generate(event.data)
})

window.opener.postMessage("ready", "*")