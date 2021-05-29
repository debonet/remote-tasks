# remote-tasks

An ES6 library to add a network abstraction between calls to and fulfillment of function tasks. 

See @debonet/tasks and @debonet/remote-promises.

# Usage

Instead of being confined to a single application running on a single processor:

```javascript
	function someTaskFunction(){ return new Task( ... ) }

	somePromiseFunction( args )
		.progress( ... )
		.then( ... )
		.catch( ... )
		.finally( ... );

```


With remote-task, we can move the handling of the function to a different process or machine.

In "forward mode": 

Process 1:

```javascript
	function someTaskFunction(){ return new Task( ... ) }

	RemoteTask.serve( someTaskFunction, 3000, { path: "somePath" } );
```

Process 2:

```javascript
	const someTaskFunction = RemoteTask.client( "ws://some_server:3000/somePath" );

	someTaskFunction( args )
		.progress( ... )
		.then( ... )
		.catch( ... )
		.finally( ... );
```


and in "reverse mode":



On one or more processes:

```javascript
	function someTaskFunction(){ return new Task( ... ) }

	RemoteTask.provide( someTaskFunction, "ws://some_server:3000/somePath" );
```

On another process:

```javascript
	const someTaskFunction = RemoteTask.marshal( 3000, { path: "somePath" } );

	someTaskFunction( args )
		.progress( ... )
		.then( ... )
		.catch( ... )
		.finally( ... );
```



# API

Identical to the API for @debonet/remote-promises, with the subsitution of Tasks for Promies.


# Installation

npm install @debonet/remote-tasks


