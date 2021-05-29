const RemoteTasks = require( "../src/remote-tasks.js" );
const Task = require( "@debonet/es6tasks" );

// =============================================================================
// =============================================================================
describe( "Remote Tasks support all RemotePromse functionality", ()=> {
	
	// ---------------------------------------------------------------------------
	// ---------------------------------------------------------------------------
	test( "test a forward remote task", async () => {

		const fp = () => new Task(( fOk ) => {
			return setTimeout(() => fOk( "success" ), 100 )
		});
		
		const rps = RemoteTasks.serve( fp, 3000 );

		const fpNew = RemoteTasks.client( "ws://localhost:3000" );

		expect( await fpNew()).toBe( "success" );

		rps.close();
		fpNew.close();
		
	});

	// ---------------------------------------------------------------------------
	// ---------------------------------------------------------------------------
	test( "test a forward remote task error", async () => {

		const fp = () => new Task(( fOk, fErr ) => {
			return setTimeout(() => fErr( "error" ), 100 )
		});
		
		const rps = RemoteTasks.serve( fp, 3000 );

		const fpNew = RemoteTasks.client( "ws://localhost:3000" );

		try{
			await fpNew();
		}
		catch( err ){
			expect( err ).toBe( "error" );
		}

		rps.close();
		fpNew.close();
		
	});

	// ---------------------------------------------------------------------------
	// ---------------------------------------------------------------------------
	test( "test a forward remote constant-task", async () => {

		const fp = () => "success";
		
		const rps = RemoteTasks.serve( fp, 3000 );

		const fpNew = RemoteTasks.client( "ws://localhost:3000" );

		expect( await fpNew()).toBe( "success" );

		rps.close();
		fpNew.close();
		
	});

	// ---------------------------------------------------------------------------
	// ---------------------------------------------------------------------------
	test( "test a flipped remote task", async () => {

		const fp = () => new Task(( fOk ) => {
			return setTimeout(() => {
				fOk( "success" );
			}, 100 );
		});
		
		const fpNew = RemoteTasks.marshal( 3000 );

		const rps = RemoteTasks.provide( fp, "ws://localhost:3000" );

		expect( await fpNew()).toBe( "success" );

		rps.close();
		fpNew.close();
	});



	// ---------------------------------------------------------------------------
	// ---------------------------------------------------------------------------
	test( "test a flipped remote task error", async () => {

		const fp = () => new Task(( fOk, fErr ) => {
			return setTimeout(() => {
				fErr( "error" );
			}, 100 );
		});
		
		const fpNew = RemoteTasks.marshal( 3000 );

		const rps = RemoteTasks.provide( fp, "ws://localhost:3000" );

		try{
			await fpNew();
		}
		catch( err ){
			expect( err ).toBe( "error" );
		}

		rps.close();
		fpNew.close();
	});


	// ---------------------------------------------------------------------------
	// ---------------------------------------------------------------------------
	test( "test a flipped remote task with multiple handlers", async () => {

		const fp = ( n ) => new Task(( fOk ) => {
			return setTimeout(() => {
				fOk( "success " + n );
			}, 1000 );
		});
		
		const fpNew = RemoteTasks.marshal( 3000 );

		const rps1 = RemoteTasks.provide(() => fp( 1 ), "ws://localhost:3000" );
		const rps2 = RemoteTasks.provide(() => fp( 2 ), "ws://localhost:3000" );

		setTimeout( async () => {
			const vs = await Task.all([
				fpNew(), fpNew(), fpNew(),
				fpNew(), fpNew(), fpNew(),
			])
			expect( vs ).toStrictEqual([
				'success 2', 'success 1', 'success 2',
				'success 1', 'success 2', 'success 1'
			]);
			const rps3 = RemoteTasks.provide(() => fp( 3 ), "ws://localhost:3000" );

			setTimeout( async () => {

				const vs = await Task.all([
					fpNew(), 	fpNew(), 	fpNew(), 	fpNew(), 	fpNew(), 	fpNew(), ])

				expect( vs ).toStrictEqual([
					'success 3', 	'success 2', 	'success 1',
					'success 3', 	'success 2', 	'success 1'
				]);

				rps1.close();
				rps2.close();
				rps3.close();
				fpNew.close();
			}, 100 );
		}, 100 );

		fpNew.close();
		rps1.close();
		rps2.close();
		
	});


});




// =============================================================================
// =============================================================================
describe( "Remote Tasks RemotePromse disconnect functionality", ()=> {

	// ---------------------------------------------------------------------------
	// ---------------------------------------------------------------------------
	function delay( dtm ){
		return new Task(( fOk ) => setTimeout( fOk, dtm ));
	}

	// ---------------------------------------------------------------------------
	// ---------------------------------------------------------------------------
	test( "test a forward disconnection", async () => {

		const fp = ( x ) => new Task(( fOk ) => {
			return setTimeout(() => fOk( "success " + x ), 100 )
		});
		
		const rps1 = RemoteTasks.serve(() => fp( 1 ), 3000 );
		const fpNew = RemoteTasks.client( "ws://localhost:3000", {
			reconnectionDelay: 100,
			reconnectionDelayMax : 100,
		});

		expect( await fpNew()).toBe( "success 1" );

		let b = false;
		
		fpNew().then(( x ) => {
			b = true;
			expect( x ).toBe( "success 2" );
		});
		
		rps1.close();

		await delay( 100 );
		
		expect( b ).toBe( false );

		const rps2 = RemoteTasks.serve(() => fp( 2 ), 3000 );

		await delay( 300 );

		expect( b ).toBe( true );

		
		rps2.close();
		fpNew.close();
		
	});




	// ---------------------------------------------------------------------------
	// ---------------------------------------------------------------------------
	test( "test a flipped disconnection", async () => {

		const fp = ( x ) => new Task(( fOk ) => {
			return setTimeout(() => fOk( "success " + x ), 100 )
		});
		
		const rps1 = RemoteTasks.provide(() => fp( 1 ), "ws://localhost:3000" );
		const fpNew = RemoteTasks.marshal( 3000 );

		expect( await fpNew()).toBe( "success 1" );

		let b = false;
		
		fpNew().then(( x ) => {
			b = true;
			expect( x ).toBe( "success 2" );
		});
		
		rps1.close();

		await delay( 100 );
		
		expect( b ).toBe( false );

		const rps2 = RemoteTasks.provide(() => fp( 2 ), "ws://localhost:3000" );

		await delay( 1000 );

		expect( b ).toBe( true );

		
		rps2.close();
		fpNew.close();
		
		
	});

});




// ===========================================================================
// ===========================================================================
describe( "task specific testing", () => {

	function fpDelay( dtm ){
		return new Promise(( fOk ) => setTimeout( fOk, dtm ));
	}

	// ---------------------------------------------------------------------------
	// ---------------------------------------------------------------------------
	test( "test a forward remote task progress", async () => {

		const fp = () => new Task(async ( fResolve, fReject, fReport ) => {
			fReport( 1 );
			await fpDelay(10);
			fReport( 2 );
			await fpDelay(10);
			fReport( 3 );
			await fpDelay(10);
			fReport( 4 );
			await fpDelay(10);
			
			fResolve( "success" );
		});
		
		const rps = RemoteTasks.serve( fp, 3000 );

		const fpNew = RemoteTasks.client( "ws://localhost:3000" );

		const vs = [];
		function fProg(s){
			vs.push( s );
		}
		
		const sResult = await fpNew().progress( fProg );
		
		expect( vs.join( ', ' )).toBe( "1, 2, 3, 4" );
		expect( sResult ).toBe( "success" );

		rps.close();
		fpNew.close();
		
	});


	// ---------------------------------------------------------------------------
	// ---------------------------------------------------------------------------
	test( "test a reverse remote task progress", async () => {

		const fp = () => new Task(async ( fResolve, fReject, fReport ) => {
			fReport( 1 );
			await fpDelay(10);
			fReport( 2 );
			await fpDelay(10);
			fReport( 3 );
			await fpDelay(10);
			fReport( 4 );
			await fpDelay(10);
			
			fResolve( "success" );
		});
		
		const fpNew = RemoteTasks.marshal( 3000 );

		const rps = RemoteTasks.provide( fp, "ws://localhost:3000" );

		const vs = [];
		function fProg(s){
			vs.push( s );
		}
		
		const sResult = await fpNew().progress( fProg );
		
		expect( vs.join( ', ' )).toBe( "1, 2, 3, 4" );
		expect( sResult ).toBe( "success" );

		rps.close();
		fpNew.close();
		
	});

});






// ===========================================================================
// ===========================================================================
describe( "remote task disconnection testing", () => {

	function fpDelay( dtm ){
		return new Promise(( fOk ) => setTimeout( fOk, dtm ));
	}

	// ---------------------------------------------------------------------------
	// ---------------------------------------------------------------------------
	test( "forward disconnection & resumption", async () => {

		const fp = ( x ) => new Task(async ( fResolve, fReject, fReport ) => {
			fReport( `prog 1:${x}` );
			await fpDelay(10);
			fReport( `prog 2:${x}` );
			await fpDelay(500);
			fReport( `prog 3:${x}` );
			await fpDelay(10);
			fReport( `prog 4:${x}` );
			await fpDelay(10);
			
			fResolve( `success ${x}` );
		});
		
		const rps1 = RemoteTasks.serve(() => fp( 1 ), 3000 );

		const fpNew = RemoteTasks.client( "ws://localhost:3000", {
			reconnectionDelay: 100,
			reconnectionDelayMax : 100,
		});

		const vs = [];
		function fProg(s){
			vs.push( s );
		}
		
		const p = fpNew().progress( fProg );

		await fpDelay( 100 );
		expect( vs.join( ', ' )).toBe( "prog 1:1, prog 2:1" );

		rps1.close();

		const rps2 = RemoteTasks.serve(() => fp( 2 ), 3000 );

		await fpDelay( 300 );
		expect( vs.join( ', ' )).toBe( "prog 1:1, prog 2:1, prog 1:2, prog 2:2" );

		const sResult = await p;
		
		expect( vs.join( ', ' )).toBe(
			"prog 1:1, prog 2:1, prog 1:2, prog 2:2, prog 3:2, prog 4:2"
		);
		expect( sResult ).toBe( "success 2" );

		rps2.close();
		fpNew.close();

	});


	// ---------------------------------------------------------------------------
	// ---------------------------------------------------------------------------
	test( "reverse disconnection & swapping", async () => {

		const fp = ( x ) => new Task(async ( fResolve, fReject, fReport ) => {
			fReport( `prog 1:${x}` );
			await fpDelay(10);
			fReport( `prog 2:${x}` );
			await fpDelay(500);
			fReport( `prog 3:${x}` );
			await fpDelay(10);
			fReport( `prog 4:${x}` );
			await fpDelay(10);
			
			fResolve( `success ${x}` );
		});
		
		const fpNew = RemoteTasks.marshal( 3000 );

		const rps1 = RemoteTasks.provide(
			() => fp( 1 ),
			"ws://localhost:3000", {
				reconnectionDelay: 100,
				reconnectionDelayMax : 100,
			}
		);

		const rps2 = RemoteTasks.provide(
			() => fp( 2 ),
			"ws://localhost:3000", {
				reconnectionDelay: 100,
				reconnectionDelayMax : 100,
			}
		);

		const vs = [];
		function fProg(s){
			vs.push( s );
		}
		
		const p = fpNew().progress( fProg );

		await fpDelay( 300 );
		expect( vs.join( ', ' )).toBe( "prog 1:1, prog 2:1" );

		rps1.close();

		await fpDelay( 300 );
		expect( vs.join( ', ' )).toBe( "prog 1:1, prog 2:1, prog 1:2, prog 2:2" );

		const sResult = await p;
		
		expect( vs.join( ', ' )).toBe(
			"prog 1:1, prog 2:1, prog 1:2, prog 2:2, prog 3:2, prog 4:2"
		);
		expect( sResult ).toBe( "success 2" );

		rps2.close();
		fpNew.close();

	});


});
