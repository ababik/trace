import { Trace } from "../src/trace"

window.open = jest.fn()

test("no call", () => {
    const trace = new Trace()
    const report = trace.report()

    expect(report).toEqual({
        timestamp: expect.any(Number),
        total: 0,
        records: []
    })
})

test("single call", () => {
    jest.spyOn(performance, "now")
        .mockImplementationOnce(() => 10)
        .mockImplementationOnce(() => 20)

    const trace = new Trace()
    trace.on("block1")
    trace.off("block1")
    const report = trace.report()

    expect(report).toEqual({
        timestamp: expect.any(Number),
        total: 10,
        records: [
            {
                label: "block1",
                calls: 1,
                duration: 10,
                first: 10,
                max: 10,
                min: 10,
                mean: 10,
                stddev: 0,
                percent: 100,
                records: []
            }
        ]
    })
})

test("multiple calls", () => {
    jest.spyOn(performance, "now")
        .mockImplementationOnce(() => 10)
        .mockImplementationOnce(() => 20)
        .mockImplementationOnce(() => 30)
        .mockImplementationOnce(() => 50)

    const trace = new Trace()
    trace.on("block1")
    trace.off("block1")
    trace.on("block2")
    trace.off("block2")
    const report = trace.report()

    expect(report).toEqual({
        timestamp: expect.any(Number),
        total: 30,
        records: [
            {
                label: "block1",
                calls: 1,
                duration: 10,
                first: 10,
                max: 10,
                min: 10,
                mean: 10,
                stddev: 0,
                percent: 33.33333333333333,
                records: []
            },
            {
                label: "block2",
                calls: 1,
                duration: 20,
                first: 20,
                max: 20,
                min: 20,
                mean: 20,
                stddev: 0,
                percent: 66.66666666666666,
                records: []
            }
        ]
    })
})

test("nested calls", () => {
    jest.spyOn(performance, "now")
        // block1 - on
        .mockImplementationOnce(() => 1)
        // sub-block1
        .mockImplementationOnce(() => 1)
        .mockImplementationOnce(() => 21)
        .mockImplementationOnce(() => 1)
        .mockImplementationOnce(() => 31)
        .mockImplementationOnce(() => 1)
        .mockImplementationOnce(() => 11)
        // sub-block2
        .mockImplementationOnce(() => 1)
        .mockImplementationOnce(() => 51)
        // block1 - off
        .mockImplementationOnce(() => 201)
        // block2
        .mockImplementationOnce(() => 1)
        .mockImplementationOnce(() => 101)

    const trace = new Trace()
    trace.on("block1")
    trace.on("sub-block1")
    trace.off("sub-block1")
    trace.on("sub-block1")
    trace.off("sub-block1")
    trace.on("sub-block1")
    trace.off("sub-block1")
    trace.on("sub-block2")
    trace.off("sub-block2")
    trace.off("block1")
    trace.on("block2")
    trace.off("block2")
    const report = trace.report()

    expect(report).toEqual({
        timestamp: expect.any(Number),
        total: 300,
        records: [
            {
                calls: 1,
                duration: 200,
                first: 200,
                label: "block1",
                max: 200,
                mean: 200,
                min: 200,
                percent: 66.66666666666666,
                stddev: 0,
                records: [
                    {
                        calls: 3,
                        duration: 60,
                        first: 20,
                        label: "sub-block1",
                        max: 30,
                        mean: 20,
                        min: 10,
                        percent: 20,
                        stddev: 8.16496580927726,
                        records: [],
                    },
                    {
                        calls: 1,
                        duration: 50,
                        first: 50,
                        label: "sub-block2",
                        max: 50,
                        mean: 50,
                        min: 50,
                        percent: 16.666666666666664,
                        stddev: 0,
                        records: [],
                    }
                ]
            },
            {
                calls: 1,
                duration: 100,
                first: 100,
                label: "block2",
                max: 100,
                mean: 100,
                min: 100,
                percent: 33.33333333333333,
                stddev: 0,
                records: []
            }
        ]
    })
})

test("invalid off", () => {
    const trace = new Trace()
    trace.on("block1")
    trace.on("block2")
    expect(() => trace.off("block1"))
        .toThrow("Unexpected trace label \"block1\" (expected \"block2\").")
})

test("unexpected report call", () => {
    const trace = new Trace()
    trace.on("block1")
    expect(() => trace.report())
        .toThrow("Trace \"block1\" is still active.")
})

test("skip", () => {
    jest.spyOn(performance, "now")
        // skip
        .mockImplementationOnce(() => 1)
        // skip
        .mockImplementationOnce(() => 1)
        // take the rest
        .mockImplementationOnce(() => 1)
        .mockImplementationOnce(() => 11)
        .mockImplementationOnce(() => 1)
        .mockImplementationOnce(() => 21)
        .mockImplementationOnce(() => 1)
        .mockImplementationOnce(() => 31)

    const trace = new Trace()
    for (let i = 0; i < 5; i++) {
        trace.on("block1", { skip: 2 })
        trace.off("block1")
    }
    const report = trace.report()

    expect(report).toEqual({
        timestamp: expect.any(Number),
        total: 60,
        records: [
            {
                label: "block1",
                calls: 3,
                duration: 60,
                first: 10,
                max: 30,
                min: 10,
                mean: 20,
                stddev: 8.16496580927726,
                percent: 100,
                records: []
            }
        ]
    })
})

test("take", () => {
    jest.spyOn(performance, "now")
        .mockImplementationOnce(() => 1)
        .mockImplementationOnce(() => 11)
        .mockImplementationOnce(() => 1)
        .mockImplementationOnce(() => 21)
        .mockImplementationOnce(() => 1)
        .mockImplementationOnce(() => 31)

    const trace = new Trace()
    for (let i = 0; i < 10; i++) {
        trace.on("block1", { take: 3 })
        trace.off("block1")
    }
    const report = trace.report()

    expect(report).toEqual({
        timestamp: expect.any(Number),
        total: 60,
        records: [
            {
                label: "block1",
                calls: 3,
                duration: 60,
                first: 10,
                max: 30,
                min: 10,
                mean: 20,
                stddev: 8.16496580927726,
                percent: 100,
                records: []
            }
        ]
    })
})

test("skip and take", () => {
    jest.spyOn(performance, "now")
        // skip
        .mockImplementationOnce(() => 1)
        // skip
        .mockImplementationOnce(() => 1)
        // take the rest
        .mockImplementationOnce(() => 1)
        .mockImplementationOnce(() => 11)
        .mockImplementationOnce(() => 1)
        .mockImplementationOnce(() => 21)
        .mockImplementationOnce(() => 1)
        .mockImplementationOnce(() => 31)

    const trace = new Trace()
    for (let i = 0; i < 10; i++) {
        trace.on("block1", { skip: 2, take: 3 })
        trace.off("block1")
    }
    const report = trace.report()

    expect(report).toEqual({
        timestamp: expect.any(Number),
        total: 60,
        records: [
            {
                label: "block1",
                calls: 3,
                duration: 60,
                first: 10,
                max: 30,
                min: 10,
                mean: 20,
                stddev: 8.16496580927726,
                percent: 100,
                records: []
            }
        ]
    })
})