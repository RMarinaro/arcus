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
	authToken: 'ATGWRSZKWV7RQ5HUA5G6GU5ROBH5GAMKIQVHJOFMGPMW2MUXDFKEDKQASLILLIZRUUXZHUX4GAIX4RWQBMTA4K4HAH6JFBPL6NYTIC6GDJ2RVPIWURFRGMMTF3KDGIPVRPTTL3VABDJDRGPHOETWJBI7MMHABK75OORBFX75ICSNFZKS3UCWQEDS5VWNI4YRBNHORBIUMXAFOEDWV3FBGUNYRZVETWI37F4KU5SG6ZRPZIPXZDKUA5QDU2QS5MU4IBCOR4O2C4RTQ6A6ZHRY4LSPTKC4TGG6BVSKKL36SAINC6C4RGTN43C5T4I5ZTD5XBXXW46ELKFL3W5V5FLBQGJ2GX2UL6YZVF5PYEWPNOTT7STFGC53AMZRXI3L4NIE',
	htmlEscape: false
}).cloud;

var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());

//=========================================================
// Bots Dialogs
//=========================================================

bot.dialog('/', function (session) {

	cloud.account({
		success: function(success) {
			var usagePercent =  success.body.usage.quotaUsed / success.body.usage.quota * 100;
			var used = formatBytes(success.body.usage.quotaUsed, 2);
			var max = formatBytes(success.body.usage.quota, 2);
		    session.send("You are using " + used + " of your " + max);
		},
		failure: function(failure) {
			session.send("Could not get account data");
		}
	})
    
});

function formatBytes(bytes,decimals) {
   if(bytes == 0) return '0 Byte';
   var k = 1024; // or 1000 for vendor sizing
   var dm = decimals || 3;
   var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
   var i = Math.floor(Math.log(bytes) / Math.log(k));
   return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

