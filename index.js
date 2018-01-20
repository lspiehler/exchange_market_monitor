const request = require('request');

var exchangeAPIData = {
	bittrex: {
		name: 'Bittrex',
		url: 'https://bittrex.com/api/v1.1/public/getmarkets',
		datarespprop: 'result',
		marketnameprop: 'MarketName',
		structure: 'array'
	},
	cryptopia: {
		name: 'Cryptopia',
		url: 'https://www.cryptopia.co.nz/api/GetMarkets',
		datarespprop: 'Data',
		marketnameprop: 'Label',
		structure: 'array'
	},
	gdax: {
		name: 'GDAX',
		url: 'https://api.gdax.com/products',
		datarespprop: false,
		marketnameprop: 'id',
		structure: 'array'
	},
	hitbtc: {
		name: 'HitBTC',
		url: 'https://api.hitbtc.com/api/2/public/currency',
		datarespprop: false,
		marketnameprop: 'id',
		structure: 'array'
	},
	binance: {
		name: 'Binance',
		url: 'https://api.binance.com/api/v1/exchangeInfo',
		datarespprop: 'symbols',
		marketnameprop: 'symbol',
		structure: 'array'
	},
	kraken: {
		name: 'Kraken',
		url: 'https://api.kraken.com/0/public/AssetPairs',
		datarespprop: 'result',
		marketnameprop: 'altname',
		structure: 'object'
	}
};

var exchangeMonitor = function(apidata) {
	var cachedmarkets = [];
	var name = apidata.name;
	var url = apidata.url;
	
	this.query = function(callback) {
		query(callback);
	}
	
	this.name = function() {
		return name;
	}
	
	var strInArray = function(str, arr) {
		for(var i = 0; i <= arr.length - 1; i++) {
			if(str==arr[i]) {
				return true;
			}
		}
		return false;
	}

	var query = function(callback) {
			var update = {
				exchange: name,
				markets: [],
				added: [],
				removed: []
			}
				
		var headers = {
			'User-Agent': 'request'
		}
		
		var options = {
			url: url,
			//json: true,
			method: 'GET',
			headers: headers
		}
		
		request(options, (err, res, body) => {
			if (err) { callback(err,false); return; }
			var response = JSON.parse(body);
			//console.log(response);
			var newmarkets = [];
			var data;
			if(apidata.datarespprop) {
				data = response[apidata.datarespprop];
			} else {
				data = response;
			}
			//console.log(data);
			if(apidata.structure=='array') {
				for(var i = 0; i <= data.length - 1; i++) {
					//console.log(data[i][apidata.marketnameprop]);
					//if(cachedmarkets.length == 0 && (i==5 || i==1000)) {
						//newmarkets.push(data[i][apidata.marketnameprop]);
						//newmarkets.push('Lyas');
					//} else {
						newmarkets.push(data[i][apidata.marketnameprop]);
					//}
				}
			} else if(apidata.structure=='object') {
				for(var key in data) {
					//if(cachedmarkets.length == 0 && key=='XZECZUSD') {
						//newmarkets.push(data[i][apidata.marketnameprop]);
						//newmarkets.push('Lyas');
					//} else {
						newmarkets.push(data[key][apidata.marketnameprop]);
					//}
				}
			} else {
				callback('Invalid API structure',false);
			}
			if(cachedmarkets.length == 0) {
				cachedmarkets = newmarkets;
				//console.log(name + ' initialized');
				if(cachedmarkets.length > 0) {
					//query();
				} else {
					//console.log('ERROR on ' + name);
				}
			} else {
				//compare newarray against old array to check for removals
				for(var i = 0; i <= newmarkets.length - 1; i++) {
					if(strInArray(newmarkets[i],cachedmarkets)) {
						//console.log(newmarkets[i] + ' still exists on ' + name);
					} else {
						//console.log(newmarkets[i] + ' removed from ' + name);
						update.removed.push(newmarkets[i]);
					}
				}
				for(var i = 0; i <= cachedmarkets.length - 1; i++) {
					if(strInArray(cachedmarkets[i],newmarkets)) {
						//console.log(cachedmarkets[i] + ' still exists on ' + name);
					} else {
						//console.log(cachedmarkets[i] + ' added to ' + name);
						update.added.push(cachedmarkets[i]);
					}
				}
			}
			update.markets = newmarkets;
			//console.log(cachedmarkets);
			//console.log(data.length);
			callback(err,update);
			return;
		});
	}
}

var exchanges = [];

//initialize all exchanges
for (var key in exchangeAPIData) {
	if (exchangeAPIData.hasOwnProperty(key)) {
		//console.log(key);
		var exchange = new exchangeMonitor(exchangeAPIData[key]);
		exchanges.push(exchange);
	}
}

var exchangeMonitorLoop = function(index) {
	var next = 0;
	//console.log(exchanges[index].name());
	if(index < exchanges.length - 1) {
		next = index + 1;
		exchanges[index].query( function(err, update) {
			processUpdates(update);
			exchangeMonitorLoop(next);
		});
	} else {
		exchanges[index].query( function(err, update) {
			processUpdates(update);
			setTimeout( function() {
				exchangeMonitorLoop(next);
			}, 60000);
		});
	}
}

var processUpdates = function(updates) {
	console.log('Queried ' + updates.markets.length + ' markets on ' + updates.exchange + ': ' + updates.added.length + ' added, ' + updates.removed.length + ' removed');
	if(updates.added.length > 0 || updates.removed.length > 0) {
		var message = 'Market update on ' + updates.exchange + '.\r\n\r\nAdded:\r\n\t' + updates.added.join('\r\n\t') + '\r\nRemoved:\r\n\t' + updates.removed.join('\r\n\t')
		console.log(message);
	}
}

exchangeMonitorLoop(0);