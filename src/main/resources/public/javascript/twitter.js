$(function(){

    var bearer_token = "AAAAAAAAAAAAAAAAAAAAACY%2BzwAAAAAA9BbrjkbsipCvTtkcWoo3xkKAHCo%3DchZklsixPCk1wxJKq4kuFKpUxhfD39jRsWdxpzc7368KTpc94j";
    var cb = new Codebird;

    var url = window.location.href;
    var name = getValueAtEnd(window.location.href);
    if(!name){
        name = "calypso";
    }

    getTwits(bearer_token, name);

    function getValueAtEnd(str){
        var split = str.split("=")
        return split[split.length-1];
    }


    function setNewBearToken(){
        cb.setConsumerKey("lV07eLAurD4io5GcyuGYMqUyR", "eY6kz4GQ8xag1Jga7bbsE34janq7M2HMuRCLsdzRfXSEQXQl2u");

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
            "q=" + searchStr,
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