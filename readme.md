# Structural JavaScript Profiler

`trace` is a JavaScript library for measuring code execution time.  
It provides a simple way to benchmark a code, allowing to measure the performance of individual functions and nested calls.  

Wrap the code to benchmark with `on(label)` and `off(label)` functions.
```
trace.on("my function 1")
// your code
trace.off("my function 1")
```

Benchmarking can be structured as a nested hierarchy of `on`/`off` calls.
```
trace.on("my function 1")
    trace.on("inner function")
    // your code
    trace.off("inner function")
trace.off("my function 1")
```

Each `on(label)` method must have corresponding closing `off(label)` method with matching label.  

Call `report` method from the code or console to generate an execution report.  
It will open a popup window with an expandable table representing the call hierarchy and benchmarks.  