#!/usr/bin/env node
/*
 * Inspired from node-fibers build.js
 */

var build_path = 'build';

var cp = require('child_process'),
	fs = require('fs'),
	path = require('path');

// Usage: pre-gyp-build.js [--debug] [--target_arch <arch>] <install|build> <target name>
//		install: used during "npm install" to use a pre-built binary or build it, depending on what's available
//		build: used to build the binary
// Pre-built binaries are located under 'bin.pre-built'
// --debug to build the debug version of the binary
//

var force    = false,
	debug    = false,
	arch     = process.arch,
	platform = process.platform,
	v8       = /[0-9]+\.[0-9]+/.exec(process.versions.v8)[0],
	args,
	target_name,
	action,
	modPath,
	preBuiltFile,
	builtFile;



args = process.argv.slice(2).filter(function(arg) {
	if (arg.substring(0, 13) === '--target_arch') {
		arch = arg.substring(14);
	} else if (arg === '--debug') {
		debug = true;
	}
	return true;
});

if (!{ia32: true, x64: true, arm: true}.hasOwnProperty(arch)) {
	console.error('Unsupported (?) architecture: `'+ arch+ '`');
	process.exit(1);
}

if (args.length < 3){
	usage('Missing arguments!');
}



// action and target name from cmd line
action = args[0];
prebuilt_path = args[1];
target_name = args[2];

// ensure the target name ends with '.node'
if (path.extname(target_name) != '.node')
	target_name += '.node'

// pre-built library name
modPath = platform+ '-'+ arch+ '-v8-'+ v8;

// update build path with debug/release
build_path = path.join(build_path, debug ? 'Debug':'Release');

// update pre-built path with platform/arch
prebuilt_path = path.join(prebuilt_path, modPath);

// file paths
preBuiltFile = path.join(prebuilt_path, target_name),
builtFile = path.join(build_path, target_name);



if (action.toLowerCase() === 'install'){
	install();
}
else if (action.toLowerCase() === 'build'){
	build(function(err){
		if (err)
			process.exit(err);
		else
			deployPreBuilt();
	});
}
else{
	usage('Unknown action!');
}




function usage(reason){
	console.error(reason);
	console.error('Usage: pre-gyp-build [--debug] [--target_arch <arch>] <install|build> <prebuilt dir> <target name>');
	process.exit(1);
}


// Check and install the prebuilt if found. Trigger a build otherwise
function install(){
	try {
		console.log("Checking prebuilt binary from:",preBuiltFile);
		fs.statSync(preBuiltFile);

		// Stat ok
		console.log('Prebuilt file exists, copying to build directory:', builtFile);

		// first create the tagret build dir
		mkdirs(build_path);

		// then copy prebuilt file to build dir
		copyFile(preBuiltFile, builtFile, function(err){
			if (err)
				console.error("Error copying prebuilt file to: ", builtFile);
		});
	} catch (ex) {
		// Stat failed
		build();
	}
}


// Build it
function build(done) {
	var gyp = path.resolve(__dirname, '..', 'pre-gyp-build/node_modules/.bin', process.platform === 'win32' ? 'node-gyp.cmd' : 'node-gyp');

	console.log("Building '%s' version...", modPath);
	cp.spawn(
		gyp,
		['rebuild'],
		{customFds: [0, 1, 2]})
	.on('exit', function(err) {
		if (err) {
			if (err === 127) {
				console.error(
					'node-gyp not found! Please upgrade your install of npm! You need at least 1.1.5 (I think) '+
					'and preferably 1.1.30.'
				);
			} else {
				console.error('Build failed: ', err);
			}
		}
		done(err);
	});
}


// Copy built file to the prebuilt bin folder
function deployPreBuilt(){
	// make sure the prebuilt folder exist
	mkdirs(prebuilt_path);

	// then copy built file to prebuilt dir
	copyFile(builtFile, preBuiltFile, function(err){
		if (err)
			console.error("Error copying built file to: ", preBuiltFile);
		else
			console.log("Deployed prebuilt file at: ", preBuiltFile);
	});
}



function copyFile(src, dest, callback){
	var cbCalled = false;

	var rd = fs.createReadStream(src);
	rd.on("error", function(err) {
		done(err);
	});

	var wr = fs.createWriteStream(dest);
	wr.on("error", function(err) {
		done(err);
	});
	wr.on("close", function(ex) {
		done();
	});

	rd.pipe(wr);

	function done(err) {
		if (!cbCalled) {
			callback(err);
			cbCalled = true;
		}
	}
}

function mkdirs(dir){
	var tmp='';
	dir.split('/').forEach(function(p){
		tmp = path.join(tmp,p);
		try{
			fs.mkdirSync(tmp);
		}
		catch(e){}
	});
}
