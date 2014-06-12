## Intro

Facilitate the use of pre-built binaries, or rebuild them if missing.

In your project that normally builds a binary file as part of a `npm install`, you now have the option of committing pre-built binaries for various platforms and architectures.


## How to use

		$ npm install node-pre-gyp-build


Update your project's `package.json` and add (and adapt) the `install` and `prebuild` targets in a `script` section:

	    "scripts": {
	        "install": "node_modules/.bin/pre-gyp-build install <path to your prebuilt folder> <name of module to build, does not have to end with .node>",
	        "prebuild": "node_modules/.bin/pre-gyp-build build <path to your prebuilt folder> <name of module to build, does not have to end with .node>",
	    },


Once this has been done, a `npm install` will pick up a prebuilt binary from the given location if there is one for the target platform and architecture.
Otherwise, a regular node-gyp build will be triggered.


## Create prebuilt binaries

With the changes made to your `package.json` as indicated above:

		$ npm run-script prebuild

to build the binary for the current platform and architecture, and place that binary under the location indicated in the package.json's script section.
