function generate(records: ReportRecord[]) {
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
            if (record.inner.length) {
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
            if (record.child) {
                label += ` (${record.child})`
            }
            cellLabelInner.innerText = label
            cellLabel.appendChild(cellLabelInner)
            row.appendChild(cellLabel)

            appendCell(row, Math.round(record.percent) + " %")
            appendCell(row, record.count.toString())
            appendCell(row, record.total.toFixed(4))
            appendCell(row, record.first.toFixed(4))
            appendCell(row, record.max.toFixed(4))
            appendCell(row, record.min.toFixed(4))
            appendCell(row, record.mean.toFixed(4))
            appendCell(row, record.stddev.toFixed(4))

            walk(record.inner, level + 1)
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

window.addEventListener("message", (event: MessageEvent<ReportRecord[]>) => {
    generate(event.data)
})