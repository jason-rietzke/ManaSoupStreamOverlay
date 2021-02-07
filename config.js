//
// config.js
// created 07.02.2021 by Jason Rietzke
//

'use strict'

const fs = require('fs');

const envFile = 'CHANNEL_NAME = \nCLIENT_NAME = \nOAUTH = \n'

fs.writeFile('.env', envFile, function (err) {
	if (err) throw err;
	console.log('configuration succeeded!');
	console.log('now open the .env file and enter your configuration to move on');
	console.log('');
});  