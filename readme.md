# Structural JavaScript Profiler

`trace` is a JavaScript library for measuring code execution time.  
It provides a simple way to benchmark code, allowing measurement of the performance of individual functions and nested calls. 

Wrap the code to benchmark with the `on(label)` and `off(label)` functions.
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

Ensure that each `on(label)` method has a corresponding closing `off(label)` method with a matching label.  

To generate an execution report, call the `report` method from the code or dev tools console.  
This will open a popup window with an expandable table representing the call hierarchy and benchmarks.  

Report example
![Report example](./public/example.gif)