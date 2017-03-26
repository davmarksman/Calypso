$(function(){

    $("#searchResults").hide();
    var $form = $('.register');





    $form.on('keyup', 'input', function(e) {
    	var $this = $(this),
    		$input = $this.val();
    	if ($input.length > 0) {
    		$form.find('label').addClass('active');

            $form.find('button').addClass('active');
            console.log(e);
            if (e.which === 13) {
                $form.find('button').click();
                $this.blur();
            }

    		$(this).addClass('active');
    	} else {
    		$form.find('label').removeClass('active');
    		$form.find('button').removeClass('active');
    		$(this).removeClass('active');
    	}
    });

    $form.on('click', 'button.active', function(e) {
    	e.preventDefault;
    	var $this = $(this);
    	$(this).addClass('full');
    	$(this).html('Analysing...');

        search();

//    	setTimeout(()=> {
//    		$form.find('input').val('').removeClass('active');
//    		$form.find('label').removeClass('active');
//    		$this.removeClass('full active');
//    		$this.html('OK');
//    	}, 1200);
    })


    function search(){
        var search = $("#register").val();
        searchCompaniesHouse(search);
    }


    function searchCompaniesHouse(req){
        $.ajax
        ({
          type: "GET",
          url: "/api/search",
          dataType: 'json',
          data: { q: req },
        }).done(function (data){
            var company = {};
            if(data.items.length > 0){
                var dataItem = data.items[0];
                company.no = dataItem.company_number;
                company.status = dataItem.company_status;
                company.creationDate = dataItem.date_of_creation;
                company.name = dataItem.title;
            }
            getAdditionalInfo(company.no, company)
        });
    }

    function getAdditionalInfo(companyNo, company){
        $.ajax
        ({
            type: "GET",
            url: "/api/company",
            dataType: 'json',
            data: { companyNo: companyNo },
        }).done(function (data){
            company.noOfFilings = data.filingHistory.total_count;
            company.insolvency = data.companyInfo.has_insolvency_history;
            company.charges = data.companyInfo.has_charges;
            company.dispute = data.companyInfo.registered_office_is_in_dispute;
            company.address = data.companyInfo.registered_office_address.postal_code;
            var sicCode = "0";
            if(data.companyInfo.sic_codes && data.companyInfo.sic_codes[0]){
                sicCode = data.companyInfo.sic_codes[0];
            }
            company.sicCode = sicCode;
            company.sector = getSector(sicCode);
            company.officers = {
                active: data.officers.active_count,
                resigned: data.officers.resigned_count,
                list: []
            }
            company.capital = getCapital(data.filingHistory.items);
            for(var i =0; i< data.officers.active_count; i++){
                var row = data.officers.items[i];
                company.officers.list.push({
                    name: row.name,
                    appointed: row.appointed_on,
                    role: row.officer_role
                })
            }

            company.risk = calculateRiskInfo(company);
            displayCompanyInfo(company);

            $("#twitterLink").attr('href', "/tweets?q=" + encodeURIComponent(company.name));
        });
    }

    function getCapital(filingHistory){
        var total = 0;
        for(var i = 0; i< filingHistory.length; i++){
            if(filingHistory[i].description_values && filingHistory[i].description_values.capital && filingHistory[i].description_values.capital[0]){
                return {
                    ccy : filingHistory[i].description_values.capital[0].currency,
                    figureStr : filingHistory[i].description_values.capital[0].figure,
                    figureInt : parseInt(filingHistory[i].description_values.capital[0].figure.replace(new RegExp(",", 'g'), "")),
                };
                 //total = total + parseInt(filingHistory[i].description_values.capital[0].figure.replace(new RegExp(",", 'g'), ""));
            }
        }

        return {
               ccy : "GBP",
               figureStr : "0",
               figureInt : 0,
           };
    }

    function calculateRiskInfo(company){
        var premium = company.capital.figureInt / 10;
        var riskText = [];

        if(premium == 0){
            riskText.push({ cat: "General", text: "Company financial information unavailable", colour: "red", health: "terrible", improvement: "", impact: 100 } );
        }
        if(company.status != "active"){
            premium = premium * 0;
            riskText.push({ cat: "General", text: "Company is inactive", colour: "red", health: "terrible", improvement: "", impact: 100 } );
        }

        if(company.insolvency){
            premium = premium * 0;
            riskText.push({ cat: "General", text: "Company is insolvent", colour: "red", health: "terrible", improvement: "", impact: 100 } );
        }

        if(company.dispute || company.charges ){
            premium = premium * 0;
            riskText.push({ cat: "General", text: "Company has outstanding disputes or charges", colour: "red", health: "terrible", improvement: "", impact: 100 } );
        }
        if(premium === 0){
            return {
                           premium : premium,
                           riskText: riskText
                  }
        }


        var modifier = 1;
        var companyAge = 2017 - parseInt(company.creationDate.substring(0,4));
        var health = "great";
        var text = "Company is more than 3 years old";
        var colour = "green"
        if(companyAge <= 3 ){
            modifier = modifier * 1.1;
            text = "Company is less than 3 years old";
            colour = "red";
             health = "bad";
        }else if(companyAge <= 5 ){
            colour = "orange";
             health = "good";
        }
        riskText.push({ cat: "Company Age", text: text, colour: colour, health: health, improvement: "", impact: 10 } );

        var socialRisk = Math.random()/2;
        modifier = modifier * (1 + socialRisk);
        var colour = "green";
        var health = "good"
        if(socialRisk > 0.2){
            colour = "yellow";
            health = "bad"
        }
        riskText.push({ cat: "Social Media", text: "Risk Indicators", colour: colour, health: health, improvement: "", impact: 60 } );

        //terrible, bad, good, great
        var filingsRisk = company.noOfFilings/(50 * companyAge);
        modifier = modifier * (1 + filingsRisk);
        text = "Company has a lot of major changes"
        colour =  company.noOfFilings > 100 ? "orange" : "red"
        health = "good";
        if(filingsRisk < 0.1){
            text= "Company has few major changes";
            colour = "green";
            health = "great";
        }
        riskText.push({ cat: "Company Activity", text: text, health: health, colour: colour, impact: 20 }  );

        var sicRisk = getSicRisk(company.sicCode);
        modifier = modifier * (1 + sicRisk.riskRating)
        riskText.push({ cat: "Industry Sector Risk", text: sicRisk.riskStr, colour: (sicRisk.riskRating > 0.5) ? "orange" : "green", health: (sicRisk.riskRating > 0.3) ? "good" : "bad", improvement: "", impact: 60 } );

        var staffTurnOverRisk = company.officers.resigned  / (company.officers.active * companyAge)
        var colour = "green";
        var health = "good"
        if(staffTurnOverRisk > 0.2){
            colour = "yellow";
        }
        if(staffTurnOverRisk > 0.5){
            colour = "red";
        }
        if(company.officers.resigned/company.officers.active > 2 ){
            health = "bad"
        }

       modifier = modifier * (1 + staffTurnOverRisk)
       riskText.push({ cat: "Senior Staff turnover", text: "" + company.officers.resigned + " resigned officers", colour: colour, health: health, improvement: "Less senior staff turnover", impact: 50 } );
       // riskText.push({ cat: "Other", text: "Other", colour: "green", health: "good", improvement: "", impact: 0 } );


       return {
                premium : Math.floor(premium * modifier),
                riskText: riskText
       }
    }

    function displayCompanyInfo(company){
        $("#searchResults").show(1000);
        $("#searchForm").hide(1000);

        var $companyInfo =  $("#companyInfo");
        $("#companyName").text( company.name );
        $("#companyCreate").text( company.creationDate );
        $("#companySector").text( company.sector );
        $("#companyCapital").text( "GBP" +  company.capital.figureStr );
        $("#premiumnText").html("<small>GBP</small>" + company.risk.premium)
        $("#premiumnTypeText").html("(DNO) Directors and officers")
        setMap(company.address)

        for(var i = 0; i<company.risk.riskText.length; i++){
            createRow(company.risk.riskText[i], $("#gridBody"));
        }
    }

    function createRow(rowData, $root){
    //         riskText.push({ cat: "Company Age", text: text, colour: colour, health: health, improvement: "", impact: 10 } );
        var element = $("<div></div>").addClass("build-container");
        $root.append(element);


        var statusColumn = $("<div></div>").addClass("col-sml status");
        statusColumn.append($("<span></span>").addClass("build-status").attr("data-build-status", rowData.colour));
        element.append(statusColumn);

        var catCol = $("<div></div>").addClass("col-med name").html(rowData.cat);
        element.append(catCol);

        var healthCol = $("<div></div>").addClass("col-smlMid health");
        healthCol.append($("<span></span>").addClass("build-health").attr("data-build-health", rowData.health));
        element.append(healthCol);

        var descCol = $("<div></div>").addClass("col-med duration padText").html(rowData.text);
        element.append(descCol);

        var improveText = rowData.improvement == "" ? "None" : rowData.improvement;
        var improvCol = $("<div></div>").addClass("col-med duration padText").html(improveText);
        element.append(improvCol);

        var impactCol = $("<div></div>").addClass("col-med current-build");
        if (rowData.impact === 0){
            impactCol.append($("<span></span>").addClass("build-complete").html("No Impact"));
        }else if(rowData.impact === 100){
            impactCol.append($("<span></span>").addClass("build-failed").html("High Impact"));
        }else{
            impactCol.append($("<div></div>").addClass("status-bar").append($("<span></span>").addClass("status-value").attr("style", "width: " + rowData.impact  + "%;")));
        }
        element.append(impactCol);
    }

    function getSicRisk(sicCode){
        if(sicCode = "64999"){
                return {
                        riskRating : -0.6,
                        riskStr : "Medium",
                    };
        }
        if(sicCode = "62011"){
                return {
                        riskRating : -0.8,
                        riskStr : "Low",
                    };
        }
        if(sicCode = "82990"){
                return {
                        riskRating : -0.8,
                        riskStr : "Low",
                    };
        }

        return {
                riskRating : 1,
                riskStr : "High",
            };
    }

    function getSector(sicCode){
        if(sicCode == "0"){
            return "Unknown";
        }

        if(sicCode == "64999"){
            return "Ready-Made Interactive Leisure And Entertainment Software Development";
        }

        if(sicCode == "62011"){
            return "Ready-Made Interactive Leisure And Entertainment Software Development";
        }

        if(sicCode == "82990"){
            return "Other business support service activities n.e.c.";
        }
        return "Industrial"
    }

    // Map

    function setMap(postcode) {
    	// set up our geoCoder
    	var geocoder = new google.maps.Geocoder();

    	//send value to google to get a longitude and latitude value
    	geocoder.geocode({'address': postcode}, function(results, status)
    	{
    	  // callback with a status and result
    	  if (status == google.maps.GeocoderStatus.OK)
    	  {
    	    // send the values back in a JSON string
    	    setup_map(results[0].geometry.location.lat(), results[0].geometry.location.lng());
    	  }else{
    	    setup_map(51.5073509, -0.12775829999998223);
    	  }
    	});
    }
    function setup_map(latitude, longitude) {
    	// create a JSON object with the values to mark the position
    	var _position = { lat: latitude, lng: longitude};

    	// add our default mapOptions
    	var mapOptions = {
    	  zoom: 6,              // zoom level of the map
    	  center: _position     // position to center
    	}

    	// load a map within the "map" div and display
    	var map = new google.maps.Map(document.getElementById('map'), mapOptions);

    	// add a marker to the map with the position of the longitude and latitude
    	var marker = new google.maps.Marker({
    	  position: mapOptions.center,
    	  map: map
    	});
    }
});