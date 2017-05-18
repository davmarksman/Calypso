$(function(){

    var bearer_token = "hidden";
    var cb = new Codebird;

    var url = window.location.href;
    var name = getValueAtEnd(window.location.href);
    if(!name){
        name = "calypso";
    }

    getTwits(bearer_token, name.match('^[a-zA-Z0-9]+')[0]);

    function getValueAtEnd(str){
        var split = str.split("=")
        return decodeURI(split[split.length-1]);
    }


    function setNewBearToken(){
        cb.setConsumerKey("hid", "hid");

        cb.__call(
            "oauth2_token",
            {},
            function (reply, err) {
                if (err) {
                    console.log("error response or timeout exceeded" + err.error);
                }
                if (reply) {
                    bearer_token = reply.access_token;
                }
            }
        );
    }


    function getTwits(bearerToken, searchStr){
        cb.setBearerToken(bearerToken);
        cb.__call(
            "search_tweets",
            "q=" + encodeURIComponent(searchStr),
            function (reply) {
                displayResults(searchStr, reply);
            },
            true
        );
    }

    function displayResults(search, reply){
        $("#titleTwit").html("@" + search);
        $lis = $("li");

        for(var i = 0; i < $lis.length; i++){
            $($lis[i]).find(".twitText").html("<h3>" + reply.statuses[i].user.screen_name + "</h3><br/>"
            + reply.statuses[i].text);
            $($lis[i]).find(".avatar").prepend("<img src=\"" + reply.statuses[i].user.profile_image_url  + "\">");

        }

    }

});
