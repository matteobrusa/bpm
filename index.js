"use strict" 

//loadParams()

var authToken
var client_id= "366c7b23d83b4ace88e0665044caa68d"


function getParams() {
  var query = location.hash.substring(1)
  var result = {};
  query.split("&").forEach(function(part) {
    var item = part.split("=");
    result[item[0]] = decodeURIComponent(item[1]);
  });
  return result;
}

function auth() {
	var redir="https://accounts.spotify.com/authorize?client_id="+client_id+"&response_type=token"
		+"&scope="+encodeURIComponent("playlist-read-private playlist-read-collaborative")
		+"&redirect_uri="+ encodeURIComponent(window.location.origin)
	window.location= redir
}

var params= getParams()

if (!params.access_token) 
	auth()
else
	authToken= params.access_token


function loadPlaylists() {

	$.ajax({
		url: "https://api.spotify.com/v1/me/playlists?limit=50",
		type: "GET",
		headers: {"Authorization": "Bearer "+ authToken},
		error: auth,
		success: function(data) { 
			
			var section= $("#playlists")

			for (var n in data.items) {
				var item= data.items[n]
				var name= item.name
				var id= item.id

				var div=$("<div>")
				div.html(name)
				div.attr("data-id", id)

				section.append(div)
			}

			$("div", section).click(function (el){
				var id=$(el.target).attr("data-id")
				highlightPlaylist(el.target)

	 
				$("#tracks").empty()
				loadPlaylist("https://api.spotify.com/v1/playlists/"+id+"/tracks")
			})
		}
	})	
}

// var track_bpm= {}

function loadPlaylist(url) {

	$.ajax({
		url: url,
		type: "GET",
		headers: {"Authorization": "Bearer "+ authToken},
		error: function (request, status, error) {
				if (error="429") {
					setTimeout(function() {
						loadPlaylist(url)
					}, 2000)
				}
			},
		success: function(res) { 

			var calls= []
		 
			for ( var n in res.items) {
					
				var item= res.items[n]
				var title= item.track.name
				var artist= item.track.artists["0"].name
				var id= item.track.id

				var row= $("<tr>")

				row.attr("data-uri", item.track.uri)

				row.attr("id", id)

				var t= $("<td>")
				t.html(title)
				row.append(t)

				t= $("<td>")
				t.html(artist)
				row.append(t)

				t= $("<td>")
				row.append(t)

				$("#tracks").append(row)

				//track_bpm[id]= ""
				
				fetchBPM(id, t, n*50)

				row.click(openSpotify)
				
			}


			if (res.next){
				setTimeout(function() {	
					loadPlaylist(res.next)
				}, 80*100)
			}
		}
	})
}

function openSpotify(el) {
	var uri= $(el.target.parentElement).attr("data-uri")
	//var url= "https://open.spotify.com/track/"+id
	//window.open(uri, "spoty")
	$("iframe").attr("src", uri)

	highlightElement(el.target.parentElement)
}

var lastHighlight

function highlightElement(el) {
	if (lastHighlight)
		lastHighlight.removeClass("highlight")
	lastHighlight= $(el)
	lastHighlight.addClass("highlight")
}

var lastHighlightPlaylist

function highlightPlaylist(el) {
	if (lastHighlightPlaylist)
		lastHighlightPlaylist.removeClass("highlight")
	lastHighlightPlaylist= $(el)
	lastHighlightPlaylist.addClass("highlight")
}


function reorder (id, bpm){

	var parent= $("#tracks")
	var list= parent.children("tr")

	list.detach()
	var n= list.sort(function (a,b){

		var x= a.getAttribute("bpm")
		if (x==null)
			x=0
		var y= b.getAttribute("bpm")
		if (y==null)
			y=0

		x= parseInt(x)
		y= parseInt(y)

		return y-x
	})

	
	parent.append(list)
}

function fetchBPM(id, el, delay) {

	 

	setTimeout(function() {
					 
	$.ajax({
			url: "https://api.spotify.com/v1/audio-features/"+id,
			type: "GET",
			headers: {"Authorization": "Bearer "+ authToken},
			success: function(data) { 
				var bpm= parseFloat(data.tempo)
				if (bpm<100) bpm*=2

				bpm= parseInt(bpm)
				
				el.html(bpm)

				el.parent().attr("bpm", bpm)

				reorder(id, bpm)
			},
			error: function (request, status, error) {
				if (error="429") {
					
					fetchBPM(id, el,2000)
				}
			}

		})
	}, delay)
}
 

function sortByColumn(n) {
  // sort items in table

     var asc   =  true,
        tbody = $("#tracks")

    tbody.find('tr').sort(function(a, b) {
      
		return $('td:nth-child('+n+')', a).text().localeCompare($('td:nth-child('+n+')', b).text());
      
    }).appendTo(tbody);
}


$(document).ready(function() {
	 
 	$("th").click(function (el){
		var n=$(this).index()
 		sortByColumn(n+1)
 	})

	loadPlaylists()

})

 
 
/////// using local storage, no data is sent over the wire

function loadParams() {

	authToken= localStorage.getItem("authToken")
	streamId= localStorage.getItem("streamId")
	articles= localStorage.getItem("articles")

	$("#articles").empty()
	$("#outofstock").empty()
	$("#streams").empty()
	$("#compareTable").empty()
	
}

function saveParamsAndReload() {

	localStorage.clear()

	if (streamId && streamId.length>0)
		localStorage.setItem("streamId",streamId)
	
	if (authToken && authToken.length>0)
		localStorage.setItem("authToken",authToken)

	if (articles && articles.length>0)
		localStorage.setItem("articles",articles)
	
	$("#articles").empty()
	$("#outofstock").empty()
	$("#streams").empty()
	$("#compareTable").empty()
			
	loadData()

	console.log("saved params.")
}

 