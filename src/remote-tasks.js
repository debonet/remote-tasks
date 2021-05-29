"use strict";

const { D, I, E } = require ( "@debonet/bugout" );
//const RemotePromises = require ( "@debonet/remote-promises" );
const Task = require ( "@debonet/es6tasks" );
const RemotePromises = require ( "../../remote-promises/src/remote-promises.js" );


// ===========================================================================
// Caller class
// ===========================================================================
class RemoteTaskCallerClient extends RemotePromises.CallerClient {
	constructor( ...vx ){
		super( ...vx );
		this.socket.on( "report",  fOnProgress );
		const self = this;

		// --------------------------------
		function fOnProgress( id, x ){
			const a = self.stashJobs.fxRead( id );
			if ( a ){
				a.fProgress( x );
			}
		}
	}
		
	// ---------------------------------------------------------------------------
	fpCall( ...vxArgs ) {
		const self = this;
		return new Task(( fOk, fErr, fProgress ) => {
			const id = self.stashJobs.fidStash({ vxArgs, fOk, fErr, fProgress });
			self.socket.emit( "do", id, ...vxArgs );
		});
	}
	run = this.fpCall;
	request = this.fpCall;
	issue = this.fpCall;
}

// ===========================================================================
// Caller class
// ===========================================================================
class RemoteTaskCallerServer extends RemotePromises.CallerServer {

	// ---------------------------------------------------------------------------
	fSetupNewProvider( socket ){
		super.fSetupNewProvider( socket );

		socket.on( "report", fOnProgress );

		const self = this;
		// --------------------------------
		function fOnProgress( id, x ){
			const aJob = self.stashJobs.fxRead( id );
			if ( aJob ){
				aJob.fProgress( x );
			}
		}
	}

	// ---------------------------------------------------------------------------
	fpCall( ...vxArgs ){
		const self = this;
		return new Task(( fOk, fErr, fProgress ) => {
			const id = self.stashJobs.fidStash({ vxArgs, fOk, fErr, fProgress });
			self.setidJobsWaiting.add( id );
			self.fHandleJobs();
		});
	}
	run = this.fpCall;
	request = this.fpCall;
	issue = this.fpCall;
}


// ===========================================================================
// Function Runner classes
// ===========================================================================
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
class RemoteTaskRunnerBase extends RemotePromises.RunnerBase{
	fOnExecute( socket, id, fp, vx ){
		return Task.resolve( fp( ...vx ))
			.progress(( x ) => socket.emit( "report", id, x ))
			.then(( x ) => socket.emit( "resolve", id, x ))
			.catch(( x ) => socket.emit( "reject", id, x ))
			.finally(() => delete this.aSocketForId[ id ]);
	}
}

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
class RemoteTaskRunnerServer extends RemotePromises.RunnerServer {
	fRunnerBase ( socket, fp ){
		return new RemoteTaskRunnerBase( socket, fp );
	}
}

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
class RemoteTaskRunnerClient extends RemotePromises.RunnerClient {
	fOnExecute( socket, id, fp, vx ){
		return Task.resolve( fp( ...vx ))
			.progress(( x ) => socket.emit( "report", id, x ))
			.then(( x ) => socket.emit( "resolve", id, x ))
			.catch(( x ) => socket.emit( "reject", id, x ))
			.finally(() => delete this.aSocketForId[ id ]);
	}
}

// ===========================================================================
// Construction functions
//   these hide the underling class machinery for easy use
// ===========================================================================

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
function ffpCallerClient( ...vx ){
	return ( new RemoteTaskCallerClient( ...vx )).ffpCaller();
}

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
function ffpCallerServer( ...vx ){
	return ( new RemoteTaskCallerServer( ...vx )).ffpCaller();
}

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
function frtRunnerServer( ...vx ){
	return new RemoteTaskRunnerServer( ...vx );
}

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
function frtRunnerClient( ...vx ){
	return new RemoteTaskRunnerClient( ...vx );
}



// ===========================================================================
// exports
// ===========================================================================
module.exports = {
	// conventional naming -------------------------
	
	// typical usage 
	serve : frtRunnerServer,
	client : ffpCallerClient,

	// flipped usage 
	provide : frtRunnerClient,
	marshal : ffpCallerServer,

	
	// explicit naming -------------------------

	// typical usage 
	frtServe : frtRunnerServer,
	ffpClient : ffpCallerClient,

	// flipped usage 
	frtProvide : frtRunnerClient,
	ffpMarshal : ffpCallerServer,

	// explicit names
	ffpCallerServer,
	ffpCallerClient,
	frtRunnerClient,
	frtRunnerClient,

	
	// underlying classes ----------------------
	CallerClient : RemoteTaskCallerClient,
	CallerServer : RemoteTaskCallerServer,
	RunnerBase : RemoteTaskRunnerBase,
	RunnerClient : RemoteTaskRunnerClient,
	RunnerServer : RemoteTaskRunnerServer
}



