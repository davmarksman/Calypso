/* From img to background */
bg_image_replace(".card-image a img", ".card-image a");

function bg_image_replace(image, parent){
  $(image).each(function(index,elem){

    var src = $(elem).attr("src"),
        $parent = $(elem).closest(parent);

    $parent.css("background-image","url(" + src + ")");
  });
}


/* Review */
$( '.card-image' ).mouseover(function(){
        $('.card-modal').fadeIn(100).toggleClass('active');
    }).mouseout(function(){
        $('.card-modal').fadeOut(100).toggleClass('active');
    });