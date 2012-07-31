$(function() {

// Constants

CLIENTID = '729810e4ea4449abb6f63f99a35332f4';
REDIRECT_URI = 'http://people.ischool.berkeley.edu/~i155-001/i153/a4/';
DEFAULT_TAG = 'olympics';
TAG_PREFIX = 'tag_';
USER_PREFIX = 'user_';
GEOTAG_PREFIX = 'geotag_';
ACCESS_TOKEN = self.document.location.hash != "" ? self.document.location.hash.split('=')[1] : "";

onPageLoad();
setOnClickActions();

function onPageLoad() {
    // Creates a GET variable which contains all gets variables
    var $_GET = {};
    document.location.search.replace(/\??(?:([^=]+)=([^&]*)&?)/g, function () {
        function decode(s) {
            return decodeURIComponent(s.split("+").join(" "));
        }
        $_GET[decode(arguments[1])] = decode(arguments[2]);
    });

    // If a user has been selected in the URL (http://url?user=aleveaux)
    if (ACCESS_TOKEN != "" && typeof $_GET["user"] != "undefined")
    {
        // Get the button for the selected user
        var button = $("a[href*='"+$_GET["user"]+"']")[0];
        // Activate the button (put in orange)
        activateButton(button);
        // Retrieve user ID for the selected user and then gets all his photos (see retrieveUserID function)
        retrieveUserID($_GET["user"]);
    }
    else
        // Call the instagram API to get all photos with default tag (olympics)
        instagramAPICall('tags', DEFAULT_TAG);
}

function setOnClickActions()
{
    // When a button which contains a tag_prefix in href is clicked (href='tag_something')
    $("a[href^='"+TAG_PREFIX+"']").click(function(e) {
        onClickDefault(this, e);
        // Call the instagram API to get all photos with tag 'something' (see comment above)
        instagramAPICall('tags', getArgInLink(this, TAG_PREFIX));
    });

    // When a button which contains a user_prefix in href is clicked (href='user_someone')
    $("a[href^='"+USER_PREFIX+"']").click(function(e) {
        onClickDefault(this, e);
        // Get the 'someone' part (see comment above)
        var userName = getArgInLink(this, USER_PREFIX);
        if (ACCESS_TOKEN == "")
             // If not connected. To get users photos you need to be connected somehow...
            connectToInstagramToSeeUserPhotos(userName);
        else
            // If already connected retrieve the user ID using the user name of the account
            // and then get all of his photos
            retrieveUserID(userName);
    });

    // When a button which contains a geotag_prefix in href is clicked (href='geotag_somewhere')
    $("a[href^='"+GEOTAG_PREFIX+"']").click(function(e) {
        onClickDefault(this, e);
        // Get the latitude and longitude in the somewhere part of the href (see comment above)
        // Then retrieve the location ID using the lat/long and finally get all the photos using this
        // location ID
        retrieveLocationID(getArgInLink(this, GEOTAG_PREFIX).split('_'));
    });
}

// When a button is clicked, changes it to active and prevent from following the link
function onClickDefault(button, e) {
    e.preventDefault();
    activateButton(button);
}

// Connects to instagram to be able to see the userName photos
// When connected instagram redirect to the website and I append
// the userName in the redirect link to be able to load the user selected
// See line 26 of this js file.
function connectToInstagramToSeeUserPhotos(userName) {
    var redirect_uri = REDIRECT_URI+"?user="+userName;
    var url = "https://instagram.com/oauth/authorize/?client_id="+CLIENTID;
    url += "&redirect_uri="+redirect_uri+"&response_type=token";
    window.location.replace(url);
}

// Returns the arg in the href link.
// Ex: href='tag_swimming' will return swimming.
// Ex: href='user_phelps' will return phelps.
function getArgInLink(a, prefix) {
    var splittedArray = a.href.split('/');
    var arg = splittedArray[splittedArray.length-1];
    arg = arg.slice(prefix.length);
    return arg;
}

// Activate the selected button by changing the color and deselect the previous selected button
function activateButton(button) {
    $(".btn-custom").addClass('btn-inverse');
    $(".btn-custom").removeClass('btn-custom');
    $(button).removeClass('btn-inverse');
    $(button).addClass('btn-custom');
    $("#carousel_title").html(button.innerHTML);
}

// Gets the user ID using the user name account.
// To get all photos of an instagram account you need first to be connected (dont know why)
// And then use the user ID and not the user name (dont know why either)
// So to get the user ID there is an API which is below
function retrieveUserID(userName) {
    $.ajax({
            type: "GET",
            dataType: "jsonp",
            cache: false,
            url: "https://api.instagram.com/v1/users/search?q="+userName+"&client_id="+CLIENTID,
            success: function(data) {
                instagramAPICall('users', data.data[0].id, "&access_token="+ACCESS_TOKEN);
            }
        });
}

// To get all geotagged photo of a certain location you first need to get a location ID.
// There is an API that lets you enter a latitude and longitude parameter and returns a list of locations ID
// (I always take the first one)
function retrieveLocationID (lat_long) {
    $.ajax({
            type: "GET",
            dataType: "jsonp",
            cache: false,
            url: "https://api.instagram.com/v1/locations/search?lat="+lat_long[0]+"&lng="+lat_long[1]+"&client_id="+CLIENTID,
            success: function(data) {
                instagramAPICall('locations', data.data[0].id);
            }
        });
}

// When a API call is made I fadeOut the carousel.
// Add a loading animation (gif).
// Do the query.
// Callback to displayImgs
function instagramAPICall(type, to_search, accessTokenQuery) {
    accessTokenQuery = accessTokenQuery || "";
    $(".wrapper > ul").fadeOut('slow');
    $('#loading_icon').css({'opacity': '1'});
    var url = "https://api.instagram.com/v1/"+type+"/"+to_search+"/media/recent?client_id="+CLIENTID+accessTokenQuery;
    $.ajax({
            type: "GET",
            dataType: "jsonp",
            cache: false,
            url: url,
            success: displayImgs
        });
}

// When instagram answers back I loop through the pictures in the "data" and add them to the carousel.
// When its done and the pictures are loaded I fadeIn the carousel back and hide the loading gif.
function displayImgs(data)
{
        var content = '';
        var nb_img;
        for (nb_img = 0; typeof data.data[nb_img] != 'undefined' && nb_img < 50; nb_img++)
        {
            var image = data.data[nb_img].images.standard_resolution.url;
            content += '<li><a href="'+image+'" rel="lightbox"><img src="'+image+'" alt="image" /></a></li>';
        }
        $(".wrapper > ul").html(content);
        // The carousel plugin will take every pictures in the liquid div and create the actual carousel.
        $('#liquid').liquidcarousel({height:300});
        // The lightbox plugin enters in action. Its selects every link images that have a rel="lightbox"
        $("a[rel*='lightbox']").lightBox();
        // The carousel plugin set the carousel to "display: block" but I dont want to make it appears
        // until the first three pictures have not been fully loaded so I set back the carousel to display: none
        $(".wrapper > ul").css({'display':'none'});
        var i = 1;
        // I select the first three images and wait for them to be fully loaded
        $("#liquid ul > li:nth-child(-n+3) img").load(function()
        {
            // When i == 3 it means that all three images have been loaded
            // If there is less than 3 images in the carousel I enter the if with i == nb_img
            // nb_img comes from the "for loop" above
            if (i == nb_img || i == 3)
            {
                // Hides loading gif
                $('#loading_icon').css({'opacity': '0'});
                // Fades in the carousel
                $("#liquid ul").fadeIn('slow');
            }
            i++;
        });
}

});
