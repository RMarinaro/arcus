var restify = require('restify');
var builder = require('botbuilder');
var ThingspaceCloud = require('./vendor/thingspace-cloud-node.min.js');

//=========================================================
// Bot Setup
//=========================================================

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});
  
// Create chat bot
var connector = new builder.ChatConnector({
    appId: 'b8206fb2-24bf-4771-bbe2-5527f3e67c14',
    appPassword: '6foZqvxFkikRXdniqhBnbXs'
});

// Creat thingspace with hard coded token
var cloud = new ThingspaceCloud({
	authToken: 'MTBI2YKQWZKAF3PUBAXRMR4NLPZKLK766H7FKFT5MXA2HNQ42KCKWGUAB5S4T6MHV4LACNA3AVX6LFT434JKZ7XOKLQZZUHDVTJBMHVPZRIH66UVRGFQNG3TCPA3LOZCFFXF6QROVBP5R2ZAO26C6FOV5RBZVH6WU3MSZZJOSWINMCYYZ54BD7QQASUCTMZR6XX5GB3UR65TBJZHJCPZ4IL6TLTFCNP3LVJLSXND2C2ZEFSCCY4DTHK6NJONTSVFBZW6VVH6PSC7CMQCCZ4KX3BOSMHTY2M5D4T256HOGBTDRHCXMLBVJ6WKGD4JOHWA75T3XBVIPD75HDDP5Q42WJCL5NBZGET6TRYBKJNK3U7LS3JXQAGDHLJLIGVCSJAC',
	htmlEscape: false
}).cloud;

var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());

//=========================================================
// Bots Dialogs
//=========================================================


var handlers = [
	accountHandler,
	pictureHandler,
	helpHandler,
	lastSyncedHandler
];

bot.dialog('/', function (session) {
	session.sendTyping();
	var text = session.message.text.toLowerCase();
	var handlerCallback = function(response) {
		session.send(response);
	}

	console.log("message", text);

	for(var c = 0; c < handlers.length; c++) {
		var handled = handlers[c](text, session, handlerCallback);
		if(handled) {
			return;
		}
	}

	session.send("Sorry I dont know how to handle that command");
	return;
});



function helpHandler(text, session, callback) {

	var query;

	var index = text.indexOf('how do i');
	if(index != -1) {
		query = text.substring(index + 9);
	} else {
		return false;
	}

    var message = new builder.Message(session)
        .textFormat(builder.TextFormat.xml)
        .attachments([
            new builder.HeroCard(session)
                .title("Verizon Support")
                .subtitle(text)
                .images([
                    builder.CardImage.create(session, "https://www.verizon.com/cs/groups/public/documents/adacct/vzlogo_lg.png")
                ])
                .tap(builder.CardAction.openUrl(session, "http://www.verizon.com/search/SearchResults?Ntt=" + encodeURIComponent(query)))
        ]);
    callback(message);
	return true;

}

function pictureHandler(text, session, callback) {
	if(text.indexOf('picture') == -1 && text.indexOf('photo') == -1) {
		return false;
	}

	cloud.search({
		count: 5,
		query : "contentType:image/*",
		sort : "versionCreated+desc",
		success: function(success) {
			console.log(success.body.searchResults.file);

			var files = success.body.searchResults.file;
			var urls = [];

			for(var c = 0; c < files.length; c++) {
				urls.push({ 
					'contentType' : "image/jpeg",
					"contentUrl" : cloud.getThumbnailUrl(files[c].contentToken, 'l')
				});
			}

			var message = new builder.Message(session)
		        .attachments(urls);
            callback(message);
		},
		failure: function(failure) {
		    callback("Could not fetch photos");
		}		
	})

	return true;
}


function lastSyncedHandler(text, session, callback) {
	if(text.indexOf('backed up') == -1 && text.indexOf('backup') == -1) {
		return false;
	}

	cloud.search({
		query: 'file:true',
		count: 1,
		sort : "versionCreated+desc",
		success: function(success) {
			var file = success.body.searchResults.file[0];
			console.log(file);
            callback('Your data was backed up ' + timeSince(new Date(file.versionCreated)) + ' ago.');
		},
		failure: function(failure) {
		    callback("Could not fetch last backed up time");
		}		
	})

	return true;	
}

function accountHandler(text, session, callback) {

	if(text.indexOf('account') == -1) {
		return false;
	}

	cloud.account({
		success: function(success) {
			var usagePercent =  success.body.usage.quotaUsed / success.body.usage.quota * 100;
			var used = formatBytes(success.body.usage.quotaUsed, 2);
			var max = formatBytes(success.body.usage.quota, 2);
		    callback("You are using " + used + " of your " + max);
		},
		failure: function(failure) {
			callback("Could not get account data");
		}
	})

	return true;
}

function formatBytes(bytes,decimals) {
   if(bytes == 0) return '0 Byte';
   var k = 1024; // or 1000 for vendor sizing
   var dm = decimals || 3;
   var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
   var i = Math.floor(Math.log(bytes) / Math.log(k));
   return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function timeSince(date) {

    var seconds = Math.floor((new Date() - date) / 1000);

    var interval = Math.floor(seconds / 31536000);

    if (interval > 1) {
        return interval + " years";
    }
    interval = Math.floor(seconds / 2592000);
    if (interval > 1) {
        return interval + " months";
    }
    interval = Math.floor(seconds / 86400);
    if (interval > 1) {
        return interval + " days";
    }
    interval = Math.floor(seconds / 3600);
    if (interval > 1) {
        return interval + " hours";
    }
    interval = Math.floor(seconds / 60);
    if (interval > 1) {
        return interval + " minutes";
    }
    return Math.floor(seconds) + " seconds";
}
