var images = [];
var passes = 0;

function regLinkClickHandlers() {
    var $j = jQuery.noConflict();
    var logToConsole = cordova.require("salesforce/util/logger").logToConsole;
    
    $j('#link_upload_checkin').click(function() {
        var $j = jQuery.noConflict();
        logToConsole("link_upload_checkin clicked");
        if(images.length == 0){
        	alert('Please take a picture...');
        	return;
        }
        if($j('#select_contacts').val() == ''){
        	alert('Please select a contact...');
        	return;
        }
        $j.mobile.showPageLoadingMsg();
        navigator.geolocation.getCurrentPosition(geolocationSuccess,
        		function(errorMsg) {
        			onGPSError(errorMsg);
        		},
        		{ maximumAge: 3000, timeout: 15000, enableHighAccuracy: true });        
    });

    $j('#link_reset').click(function() {
        logToConsole("link_reset clicked");
        resetStuff();
    });
    
    $j('#link_img1').click(function() {
        getPhoto('image1');
    });

    $j('#link_img2').click(function() {
        getPhoto('image2');
    });

    $j('#link_img3').click(function() {
        getPhoto('image3');
    });

    $j('#link_img4').click(function() {
        getPhoto('image4');
    });

	queryContacts();
}

function resetStuff(){
    $j('#image1').attr('src', "images/camera.png");
    $j('#image2').attr('src', "images/camera.png");
    $j('#image3').attr('src', "images/camera.png");
    $j('#image4').attr('src', "images/camera.png");
    $j('#select_contacts').val("");
    images = [];
}

function queryContacts(){
    forcetkClient.query("SELECT Id, Name FROM Contact", onSuccessSfdcContacts, onErrorSfdc);
}

// Called when we have a new photo
function onPhotoDataSuccess(imageData, imageName) {
    var $j = jQuery.noConflict();

    SFHybridApp.logToConsole("in onPhotoDataSuccess, imageName = " + imageName);

    // Update the image on screen
    $j('#' + imageName).attr('src', "data:image/jpeg;base64," + imageData);
    images.push(imageData);
}

// Take picture using device camera and retrieve image as base64-encoded string
function getPhoto(imageName) {
    var $j = jQuery.noConflict();

    SFHybridApp.logToConsole("in capturePhoto, imageName = " + imageName);

    $j('#' + imageName).attr('data-old-src', $j('#' + imageName).attr('src'));
    $j('#' + imageName).attr('src', "images/camera.png");

    navigator.camera.getPicture(function(imageData) {
        onPhotoDataSuccess(imageData, imageName);
    }, function(errorMsg) {
        onPhotoDataError(errorMsg);
    }, {
        quality: 50,
        correctOrientation: true,
        sourceType: Camera.PictureSourceType.CAMERA,
        destinationType: Camera.DestinationType.DATA_URL
    });
}

// We loaded the contact list
function onSuccessSfdcContacts(response) {
    var $j = jQuery.noConflict();
    cordova.require("salesforce/util/logger").logToConsole("onSuccessSfdcContacts: received " + response.totalSize + " contacts");

    $j("#div_sfdc_contact_list").html("")
    var select = $j('<select id="select_contacts"></select>');
    $j("#div_sfdc_contact_list").append(select);

    select.append($j('<option value="">Select a Contact</option>'));
    $j.each(response.records, function(i, contact) {
        var id = contact.Id;
        var newOption = $j('<option value = "' + contact.Id + '">' + contact.Name + '</select>');
        select.append(newOption);
    });

    $j("#div_sfdc_contact_list").trigger("create")
}

//onSuccess Callback
//This method accepts a Position object, which contains the
//current GPS coordinates
function geolocationSuccess(position){
	var type = (position.coords.altitude == null)?'Cell/WIFI':'GPS';

    forcetkClient.create('Claim_Report__c', {
        "User__c": currentUserId,
        "Contact__c": $j('#select_contacts').val(),
        "Location__Latitude__s": position.coords.latitude,
        "Location__Longitude__s": position.coords.longitude,
        "Type__c": type,
        "Platform__c":  device.platform,
        "UUID__c": device.uuid,
        "Version__c": device.version
    }, function(data){
    	uploadImages(data.id);
    }, onErrorSfdc);
}

function uploadImages(claimId){
	passes = 0;
	for(i = 0; i < images.length; i++){
	    forcetkClient.create('Attachment', {
	        "ParentId": claimId,
	        "Name": "image" + i + ".png",
	        "ContentType": "image/png",
	        "Body": images[i]
	    }, finishImageUplaod, onErrorSfdc);
	}
}

function finishImageUplaod(response){
    SFHybridApp.logToConsole('Created Attachment ' + response.id);
    passes++;
    if(passes == images.length){
    	resetStuff();
        jQuery.noConflict().mobile.hidePageLoadingMsg();
    	alert('Success!!');
    }
}

// Show error page
function onPhotoDataError(errorMsg) {
    var $j = jQuery.noConflict();

    $j('#dialog-text').html(errorMsg);
    $j.mobile.changePage('#jqm-dialog');
    $j('#Image').attr('src', $j('#Image').attr('data-old-src'));
    $j('#Image').removeAttr('data-old-src');
}

//onError Callback receives a PositionError object
function onGPSError(error) {
    var $j = jQuery.noConflict();
    $j.mobile.hidePageLoadingMsg();
    $j('#dialog-text').html('code: '+ error.code    + '<br/>' +
            'message: ' + error.message + '<br/>');
}

// Oops...
function onErrorSfdc(error) {
    jQuery.noConflict().mobile.hidePageLoadingMsg();
    cordova.require("salesforce/util/logger").logToConsole("onErrorSfdc: " + JSON.stringify(error));
    alert(JSON.stringify(error));
}


