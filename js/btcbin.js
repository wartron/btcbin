var lastView= false;
var btcbin = {
	lang: "en",
	viewing: null,
	init: function(){	
		$("#droptables").click(function (){
			btcbin.db.drop();
		});
		$("#export").click(function (){
			btcbin.db.getall({},function(results){
				var all = []
				$.each(results.rows,function( rowIndex ){
					var row = results.rows.item( rowIndex );
					all.push(row);
					
				});
				var json = JSON.stringify(all);
				$("#textarea").val(json);
				$.mobile.changePage( "#export",{ role: "dialog"});
				
			});
		});
		$(".qrlink").click(function (){
			var qrsrc = $(this).attr('qrsrc');
			btcbin.views.qr($("#"+qrsrc).val())
		});
		$("#viewfav").click(function (){
			var id = $(this).attr("wid"),
				fav = $(this).attr("fav"),
				callback = function(res){
				
				};
			if(fav=='true'){
				btcbin.db.updatefav(id,0,callback);
				btcbin.views.walletFav(id,'false');
			}else{
				btcbin.db.updatefav(id,1,callback);
				btcbin.views.walletFav(id,'true');
			}
			
		});
		$(".langselector a").live('click',function(e){
			nlang = $(this).attr("lang");
			if(btcbin.lang != nlang){
				btcbin.lang = nlang;
				btcbin.localize();
			}
			$.mobile.changePage( "#tos",{changeHash: false});		
		});		
		
		$("#cmd_edit").click(function (){
		//	$.mobile.changePage( "#edit",{changeHash: false});
		//	btcbin.views.walletedit();
		});
		
		$("#cmd_deldel").click(function (){
			if(btcbin.viewing){
				btcbin.db.deletewallet(btcbin.viewing,function(res){
					//console.log("deleted " + btcbin.viewing);
					$('#confirmdel').dialog('close');
					btcbin.viewing = null;
				});
			}
		});
		$("#cmd_delhide").click(function (){
			if(btcbin.viewing){
				btcbin.db.hidewallet(btcbin.viewing,function(res){
					//console.log("hide " + btcbin.viewing);
					$('#confirmdel').dialog('close')
				});
			}
		});
		$("#cmd_save").click(function (){
			var id = btcbin.viewing,
				title = $("#edittitle").val(),
				amount = parseFloat($("#editamount").val()),
				isfav = ($("#editfav").attr('checked')=='checked')?1:0,
				ishide = ($("#edithide").attr('checked')=='checked')?1:0;
				

			if( !(amount >= 0)){//to catch NAN
				amount = 0.0;
			}
			
			var newdata = {title:title,
							amount:amount,
							//addr:addr.addr,
						//	key:addr.key,
							fav:isfav,
							deleted:ishide
							};
			btcbin.db.updatewallet(id,newdata,function(res){
				//alert("created "+newid);
				//var url = "#view?id="+newid;				
				//$.mobile.changePage(url,{dataUrl:url});
				//$('#edit').dialog('close');
		
				$("#editback").trigger("click");
		
					//var url = "#view?id="+id;				
					//$.mobile.changePage(url,{dataUrl:url});
					//$.mobile.hidePageLoadingMsg();  
				
				//$.mobile.hidePageLoadingMsg();  
			});
				
		});
		$("#cmd_generate").click(function (){
			$.mobile.showPageLoadingMsg();  
			setTimeout(function() { 
				var addr = btcbin.addressfactory.single(),
					title = $("#gentitle").val(),
					amount = parseFloat($("#genamount").val()),
					isfav = ($("#genfav").attr('checked')=='checked')?1:0;
				
				if(!title){
					title = addr.addr.substr(0,5);
				}
				if( !(amount >= 0)){//to catch NAN
					amount = 0.0;
				}
				
				var newdata = {title:title,
								amount:amount,
								addr:addr.addr,
								key:addr.key,
								fav:isfav
								};
				var id = btcbin.db.savewallet(null,newdata,function(newid){
					//alert("created "+newid);
					var url = "#view?id="+newid;				
					$.mobile.changePage(url,{dataUrl:url});
					$.mobile.hidePageLoadingMsg();  
				});
			},500);
			
		});
		
		btcbin.localize();
		
		btcbin.db.init();
		btcbin.addressfactory.init();
		btcbin.router.init(window.location.href);

		
	},
	localtxt: function(id){
		var t = strings[btcbin.lang][id];
		if(t)
			return t;
		t = strings["en"][id];
		if(t)
			return t;
		return btcbin.lang+'.'+id;
	},
	localize: function(){	
		$("[rel*=localize]").each(function (){
			var elm,key,val;
			elm = $(this);
			key = elm.attr("rel").match(/localize\[(.*?)\]/)[1];
			val = btcbin.localtxt(key);
			var c = elm.find(".ui-btn-text");		
			if(c.length==1){
				c.text(val);
			}else{
				elm.html(val);
			}		
		});
	},
	log: function(o){
		//console.log(o);		
	},
	db:{
		options:{
			name:'btcbin',
			version:'1.0',
			display:'btcbin',
			maxsize: 1024* 10
		},
		_db: null,
		init: function(){
			btcbin.db._db = openDatabase(
				btcbin.db.options.name,
				btcbin.db.options.version,
				btcbin.db.options.display,
				btcbin.db.options.maxsize
			);
			
			btcbin.db._db.transaction(function( transaction ){
				transaction.executeSql(
				
					"CREATE TABLE IF NOT EXISTS wallets (" +
					"id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT," +
					"title TEXT NOT NULL," +
					"amount FLOAT NOT NULL," +
					"addr TEXT NOT NULL," +
					"key TEXT NOT NULL," +
					"created INT NOT NULL," +
					"fav BOOLEAN NOT NULL DEFAULT  '0'," +
					"deleted BOOLEAN NOT NULL DEFAULT  '0'" +
					");"
				);		 
			});
				
		},
		drop:function(){
			btcbin.db._db.transaction(function( transaction ){
				transaction.executeSql("DROP TABLE wallets;");		 
			});
		},
		getfav:function(callback){
			btcbin.db.getall({fav:true},callback);
		},
		getdead:function(callback){
			btcbin.db.getall({dead:true},callback);
		},
		getall:function(flags,callback){
			flags = flags? flags: {};
			
			var sql = "SELECT * FROM wallets WHERE deleted = 0;";		
			
			if(flags.fav){
				sql = "SELECT * FROM wallets WHERE fav = 1 AND deleted = 0;";
			}else if(flags.dead){
				sql = "SELECT * FROM wallets WHERE deleted = 1;";
			}else{
			
			}
			
			btcbin.db._db.transaction(function( transaction ){
				transaction.executeSql(
					(sql),
					[],
					function( transaction, results ){
						callback( results );
					}
				);			 
			});				
		},
		getwallet:function(id,callback){
			btcbin.db._db.transaction(function( transaction ){
				transaction.executeSql(
					("SELECT * FROM wallets WHERE id = "+id),
					[],
					function( transaction, results ){
						callback( results );
					}
				);			 
			});		
			
		},
		hidewallet:function(id,callback){
			btcbin.db._db.transaction(function( transaction ){
			
				transaction.executeSql(
					("UPDATE wallets SET deleted = 1 WHERE id = ?;"),
					[id],
					function( transaction, results ){
						callback(results);
					}
				);			 
			});		
		},
		deletewallet:function(id,callback){
			btcbin.db._db.transaction(function( transaction ){
			
				transaction.executeSql(
					("DELETE FROM wallets WHERE id = ?"),
					[id],
					function( transaction, results ){
						callback(results);
					}
				);			 
			});		
		},
		updatefav:function(id,fav,callback){
			btcbin.db._db.transaction(function( transaction ){
			
				transaction.executeSql(
					("UPDATE wallets SET fav = ? WHERE id = ?;"),
					[fav,id],
					function( transaction, results ){
						callback(results);
					}
				);			 
			});		
		},
		savewallet:function(id,data,callback){
			if(id){
				//console.log("updating " + id);
			}else{
				//console.log("new addr");
				//console.log(data);
			}
		

			btcbin.db._db.transaction(function( transaction ){
				var foo = new Date;
				var unixtime_ms = foo.getTime();
				var unixtime = parseInt(unixtime_ms / 1000);
			
				transaction.executeSql(
					("INSERT INTO wallets (title,amount,addr,key,created,fav) VALUES (?,?,?,?,?,?);"),
					[data.title,data.amount,data.addr,data.key,unixtime,data.fav],
					function( transaction, results ){
						var newid = results.insertId;
						callback(newid);
					}
				);			 
			});		
		},
		updatewallet:function(id,data,callback){
			btcbin.db._db.transaction(function( transaction ){
				transaction.executeSql(
					("UPDATE wallets SET title = ?,amount = ?,fav = ?,deleted = ? WHERE id = ?;"),
					[data.title,
					data.amount,
					data.fav,
					data.deleted,
					id],
					function( transaction, results ){
				
						callback(results);
					}
				);			 
			});		
		}
	},
	addressfactory: {
		init:function(){
		
		},
		single: function(){
			try {
				var key = new Bitcoin.ECKey(false);
				var bitcoinAddress = key.getBitcoinAddress();
				var privateKeyWif = key.getBitcoinWalletImportFormat();
			}
			catch (e) {
				alert(e);
				bitcoinAddress = false;
			}
			
			if (bitcoinAddress && privateKeyWif) {
				return {addr:bitcoinAddress,key:privateKeyWif};
			}
				
			return null;
		},
		bulk : function(count){
			var ret = []
			while(count > 0){
				ret.push(ww.addressfactory.single());
				count--;
			}
			return ret;
		}
	},
	router:{
		init:function(url){		
			//for when refreshed while viewing a wallet address
			btcbin.router.pagechange(url);
		},
		pagechange: function(url){		
		
			btcbin.router.home(url);
			
			btcbin.router.list(url);
			
			btcbin.router.wallet(url);
			
			//btcbin.router.walletedit(url);
		},
		home:function(url){
			var u = $.mobile.path.parseUrl( url ),
				re = /^#home/;
			if ( u.hash.search(re) !== -1 ) {

				btcbin.views.home(true);//need to do a refersh
			}		
		},
		list:function(url){
			var u = $.mobile.path.parseUrl( url ),
				re = /^#list/;
			if ( u.hash.search(re) !== -1 ) {

				btcbin.views.list(true);//need to do a refersh
			}		
		},

		wallet: function(url){
			
			var u = $.mobile.path.parseUrl( url ),
				re = /^#view/;
				//console.log("HASH:"+u.hash);
			if ( u.hash.search(re) !== -1 ) {
				
				if ((u.hash.indexOf("dialog") != -1 )) {
					//console.log("dialog");
					btcbin.views.walletedit();
				}else{
					$.mobile.showPageLoadingMsg();  
					btcbin.views.wallet( u );
				}
			}				
		},
		walletedit: function(url){
			if(btcbin.viewing){
				var u = $.mobile.path.parseUrl( url ),
					re = /^#edit/;
				if ( u.hash.search(re) !== -1 ) {
					$.mobile.showPageLoadingMsg();  
					btcbin.views.walletedit( );
				}
			}else{
				//$.mobile.changePage("#home");
			}
		}
		
	},
	views:{
		listitem: function(data){
			var markup = "<li class=\"wid"+data.id+"\">";
			markup += "<a href=\"#\" wid=\""+data.id+"\" class=\"viewallet\">"+data.title;
			if(data.amount>0){
				markup += "<span class=\"ui-li-count\">"+data.amount+" BTC</span>";
			}
			markup += "</a>";
			markup += "<a href=\"#\" wid=\""+data.id+"\" data-icon=\"delete\" class=\"delwallet\">Delete</a>";
			markup += "</li>";
			return markup
		},	
		home: function(fresh){
			var $page = $( "#home" ),
				$list = $( "#favlist" );

				//console.log("views.home");
			var wallets = btcbin.db.getfav(function (results){
				var markup = "";
				
				$.each(results.rows,function( rowIndex ){
					var row = results.rows.item( rowIndex );
					markup += btcbin.views.listitem(row);
				});
			

				
				$list.html(markup);
				
				if(fresh)
					$list.listview('refresh');
			});


			//$list.html(markup);
			//$list.trigger( "create" );

		},
		list: function(fresh){
			var $page = $( "#list" ),
				$list = $( "#walletlist" ),
				$deadlist = $( "#deadlist" );
				
				//console.log("views.list");
				
			var wallets = btcbin.db.getall({},function (results){
				var markup = "";
				
				$.each(results.rows,function( rowIndex ){
					var row = results.rows.item( rowIndex );
					markup += btcbin.views.listitem(row);
				});
			

				
				$list.html(markup);
				
				if(fresh)
					$list.listview('refresh');
			});
			
			var wallets = btcbin.db.getdead(function (results){
				var markup = "";
				
				$.each(results.rows,function( rowIndex ){
					var row = results.rows.item( rowIndex );
					markup += btcbin.views.listitem(row);
				});
			

				
				$deadlist.html(markup);
				
				if(fresh)
					$deadlist.listview('refresh');
			});


		},
		qr: function(str){
			$.mobile.changePage( "#qr",{} );
		
			var $page = $( "#qr" ).children( ".ui-dialog" ),
				$header = $page.children( ":jqmData(role=header)" ),
				$content = $page.children( ":jqmData(role=content)" );
				
			$content.html(btcbin.qrCode.createTableHtml(str));
			var table = $content.find("table")
			//table.width("100%");
			setTimeout(function(){
				var h = table.parent().width();
				table.width(h);
				table.height(h);
			},500);
			
		
			//table.height("470px");
			
			//if(fid="
			
		},
		walletedit: function(){
					
			var fid = btcbin.viewing;
			//console.log("walletedit"+btcbin.viewing);
			if(fid){
				
				var $page = $( "#edit" ).children( ".ui-dialog" ),
					$header = $page.children( ":jqmData(role=header)" ),
					$content = $page.children( ":jqmData(role=content)" );
					
					
			
				btcbin.db.getwallet(fid,function (data){
				//console.log("getwallet"+fid);
					
					if(data.rows.length==1){
						var wallet = data.rows.item(0);
						
						$header.find( "h1" ).html( "Editing " + wallet.title );
						$content.find( "#edittitle" ).val(wallet.title);
						$content.find( "#editamount" ).val(wallet.amount);
						
						$content.find( "#editfav" ).attr("checked",wallet.fav==1).checkboxradio('refresh');
						$content.find( "#edithide" ).attr("checked",wallet.deleted==1).checkboxradio('refresh');
						
						
						//console.log("done");
					}else{
						//console.log("zerorows");
					}
					$.mobile.hidePageLoadingMsg();
					
				});
			}		

		},
		wallet: function(urlObj){
			
		
			lastView = true;
			//console.log("vies.wallet");
			//console.log(urlObj);
			var fid = parseInt(urlObj.hash.replace( /.*id=/, "" ))
			//console.log("wallet"+fid);
			if(fid){
				btcbin.viewing = fid;
				
				var $page = $( "#view" ),
					$header = $page.children( ":jqmData(role=header)" ),
					$content = $page.children( ":jqmData(role=content)" );
					
					
				
				btcbin.db.getwallet(fid,function (data){

					
					if(data.rows.length==1){
						var wallet = data.rows.item(0);
						
						$header.find( "h1" ).html( wallet.title );
						
						$content.find( "#viewamount" ).html(wallet.amount);
						
						$content.find( "#viewaddr" ).val(wallet.addr);
						
						$content.find( "#viewkey" ).val(wallet.key);
						//console.log(wallet);
						btcbin.views.walletFav(wallet.id,(wallet.fav==1)?'true':'false');
					}else{
					
					}
					$.mobile.hidePageLoadingMsg();
					
				});
			}		

		},
		walletFav: function(id,fav){
				var favem = $( "#viewfav" );			
				
				if(fav=="true"){
					favem.removeClass("ui-btn-up-c ui-btn-hover-c ui-btn-down-c")
					favem.attr('data-theme', 'e')
					favem.addClass("ui-btn-up-e");
				}else{
					favem.removeClass("ui-btn-up-e ui-btn-hover-e ui-btn-down-e")
					favem.attr('data-theme', 'c')
					favem.addClass("ui-btn-up-c");
				}
				
				favem.attr('wid',id);
				favem.attr('fav',fav);
					
		},
		
		walletXX: function(urlObj, fresh ){
			

			if(fid){
				
				var $page = $( "#view" ),
					$header = $page.children( ":jqmData(role=header)" ),
					$content = $page.children( ":jqmData(role=content)" ),
					markup = "";
					
				btcbin.db.getwallet(fid,function (data){
						
					var wallet = data.rows.item(0);

					var br = "<br>";
					
					markup += "Balance:<br>" + wallet.amount +" BTC" + br + br;
					markup += "Address:<Br>" + wallet.addr + br + br;
					
					markup += "Private Key:" + br;
					markup += wallet.key.substr(0,26) + br;
					markup += wallet.key.substr(26) + br + br;

					markup += btcbin.qrCode.createTableHtml(wallet.addr)+ br;
					
					markup += btcbin.qrCode.createTableHtml(wallet.key)+ br;
						
					$header.find( "h1" ).html( wallet.title );
					$content.html( markup )
					
					//$content.append(btcbin.qrCode.createCanvas(wallet.addr));				
					//$content.append(btcbin.qrCode.createCanvas(wallet.key));	
					
					
					$page.page().trigger( "create" );
					
					options.dataUrl = urlObj.href;		
					$.mobile.changePage( $page, options );
					
					
				});
					
			}
		}	
	},
	qrCode: {
		// determine which type number is big enough for the input text length
		getTypeNumber: function (text) {
			var lengthCalculation = text.length * 8 + 12; // length as calculated by the QRCode
			if (lengthCalculation < 72) { return 1; }
			else if (lengthCalculation < 128) { return 2; }
			else if (lengthCalculation < 208) { return 3; }
			else if (lengthCalculation < 288) { return 4; }
			else if (lengthCalculation < 368) { return 5; }
			else if (lengthCalculation < 480) { return 6; }
			else if (lengthCalculation < 528) { return 7; }
			else if (lengthCalculation < 688) { return 8; }
			else if (lengthCalculation < 800) { return 9; }
			else if (lengthCalculation < 976) { return 10; }
			return null;
		},

		createCanvas: function (text) {
			// create the qrcode itself
			var typeNumber = btcbin.qrCode.getTypeNumber(text);
			var qrcode = new QRCode(typeNumber, QRCode.ErrorCorrectLevel.H);
			qrcode.addData(text);
			qrcode.make();

			var width = qrcode.getModuleCount() * 2;
			var height = qrcode.getModuleCount() * 2;

			// create canvas element
			var canvas = document.createElement('canvas');
			canvas.width = width;
			canvas.height = height;
			var ctx = canvas.getContext('2d');
			// compute tileW/tileH based on width/height
			var tileW = width / qrcode.getModuleCount();
			var tileH = height / qrcode.getModuleCount();

			// draw in the canvas
			for (var row = 0; row < qrcode.getModuleCount(); row++) {
				for (var col = 0; col < qrcode.getModuleCount(); col++) {
					ctx.fillStyle = qrcode.isDark(row, col) ? "#000000" : "#ffffff";
					ctx.fillRect(col * tileW, row * tileH, tileW, tileH);
				}
			}

			// return just built canvas
			return canvas;
		},

		// generate a QRCode and return it's representation as an Html table 
		createTableHtml: function (text) {
			var typeNumber = btcbin.qrCode.getTypeNumber(text);
			var qr = new QRCode(typeNumber, QRCode.ErrorCorrectLevel.H);
			qr.addData(text);
			qr.make();

			var tableHtml = "";
			tableHtml = "<table class='qrcode_table'>";
			for (var r = 0; r < qr.getModuleCount(); r++) {
				tableHtml += "<tr>";
				for (var c = 0; c < qr.getModuleCount(); c++) {
					if (qr.isDark(r, c)) {
						tableHtml += "<td class='qrcode_tddark'/>";
					} else {
						tableHtml += "<td class='qrcode_tdlight'/>";
					}
				}
				tableHtml += "</tr>";
			}
			tableHtml += "</table>";

			return tableHtml;
		}
	}
}




$(document).ready(function () {
	$.mobile.defaultPageTransition = 'slide'	
	
	window.applicationCache.addEventListener('updateready', function(e) {
		if (window.applicationCache.status == window.applicationCache.UPDATEREADY) {			
			if (confirm('A new version of this site is available. Load it?')) {
				window.applicationCache.swapCache();
				window.location.reload();
			}
		}
	}, false);

	
	$(document).bind( "pagechange", function( e, data ) {
		//console.log("pagechange");
		
		if(lastView){		
			lastView= false;
			//btcbin.viewing = null;
			/*
			var $page = $( "#view" ),
				$header = $page.children( ":jqmData(role=header)" ),
				$content = $page.children( ":jqmData(role=content)" );
			$content.html( "" )
			$header.find( "h1" ).html("Loading...");
			*/
		}
		
		if ( typeof data.toPage.context.URL === "string" ) {
			//console.log("string" + data.toPage.context.URL);
			//console.log(e);
			btcbin.router.pagechange(data.toPage.context.URL);
		}
	});
	
	

	
	/*
	
	
	$( document ).delegate("#home", "pagebeforecreate", function() {
		btcbin.views.home(1);
	});
	$( document ).delegate("#list", "pagebeforecreate", function() {
		btcbin.views.list(1);
	});
	*/
	
	btcbin.init();
});

function a(){
alert('a');
}



		
	$( document ).bind("pagebeforechange", function() {
		//console.log("agebeforechange");
	});
	
	
	$( document ).delegate(".delwallet", "click", function(e) {
		var id = $(this).attr("wid");
		btcbin.db.hidewallet(id,function(res){
			$(".wid"+id).remove();
		});
	});	
	
	$( document ).delegate(".viewallet", "click", function(e) {
		var id = $(this).attr("wid"),
			url = "#view?id="+id;
		
		$.mobile.changePage(url,{dataUrl:url});
	});	