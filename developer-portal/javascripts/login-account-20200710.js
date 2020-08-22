/*
 * JBoss, Home of Professional Open Source
 * Copyright 2018 Red Hat Inc. and/or its affiliates and other contributors
 * as indicated by the @authors tag. All rights reserved.
 */

/* Common JS logic for all login/account pages */

/*
 * Common utility methods
 */
var Util = function() {

    this.syncAndRemoveCheckbox = function(checkbox, checkboxHidden) {
    	if(checkbox && checkboxHidden){
        	checkboxHidden.attr('value', checkbox.is(':checked') ? 'yes' : 'no');
        	// push just hidden value and don't rely on checkbox input element
        	checkbox.attr("disabled", true);
    	}
    };
    
    this.stringContains = function(string, substring){
    	return string.indexOf(substring) > -1;
    };
    
    this.containsUsernameUnsupportedCodePoint = function(str) {
        for (var i = 0, n = str.length; i < n; i++) {
            if (str.charCodeAt( i ) <=32 || str.charCodeAt( i ) >= 127) { return true; }
        }
        return false;
    }
    
    this.formFieldRequiredMarkRemove = function(fieldName){
    	var field = $("label[for = "+fieldName+"]");
    	field.html(field.html().replace(" \*", ""));
    };
    
    this.formFieldRequiredMarkAdd = function(fieldName){
    	var field = $("label[for = "+fieldName+"]");
    	if(! util.stringContains(field.text(), "\*"))
    	  field.text(field.text() + " *");
    };
    
    this.getCookie = function(cname) {
        var name = cname + "=";
        var ca = document.cookie.split(';');
        for(var i=0; i<ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0)==' ') c = c.substring(1);
            if (c.indexOf(name) == 0) return c.substring(name.length,c.length);
        }
        return "";
    };
    
    this.deleteCookie = function(name) {
        document.cookie = name + '=;path=/;expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    };

    this.adaptProgressiveProfileLevel = function(){
    	// Download UI texts handling
    	if(rhd.config.user_profile_level == "download"){
    		$('.download-hide').remove();
    		$('.download-show').show();
    	} else {
    		$('.download-show').remove();
    	}
    };

    
    var modalActiveClass = "modal-active";
    this.toggleModal = function(id) {
        var modalWindow = $("#"+id);
        var isModalActive = modalWindow.hasClass(modalActiveClass);
        modalWindow.toggleClass("modal-active");
        if (isModalActive) {
            var popupMask = $("#PopupMask");
            if (popupMask != null)  {
                popupMask.remove();
            }
            modalWindow.css( "z-index" , $("#"+id).data('saveZindex') );
        } else {
            $("body").prepend("<div id='PopupMask' style='position:fixed;width:100%;height:100%;z-index:10;background-color:gray;'></div>");
            $("#PopupMask").css('opacity', 0.7);
            modalWindow.data('saveZindex', modalWindow.css( "z-index"));
            modalWindow.css( "z-index" , 11);
        }
    };
    
    /*
     * Take request param called "un" and fill its value into form field with id "username" 
     */
    this.fillUsernameFieldFromParam = function(){
    	var un = qs["un"];
    	if(un){
    		$('#username').val(un);
    	}
    };
    
    /*
     * parse query string and place it's elements into qs map
     */
    var qs = (function(a) {
        if (a == "") return {};
        var b = {};
        for (var i = 0; i < a.length; ++i)
        {
            var p=a[i].split('=', 2);
            if (p.length == 1)
                b[p[0]] = "";
            else
                b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
        }
        return b;
    })(window.location.search.substr(1).split('&'));

    /* Updates given URI by specified parameter and value. Returns updated URI */
    this.updateQueryStringParameter = function (uri, key, value) {
        var re = new RegExp("([?&])" + key + "=.*?(&|$)", "i");
        var separator = uri.indexOf('?') !== -1 ? "&" : "?";
        if (uri.match(re)) {
            return uri.replace(re, '$1' + key + "=" + value + '$2');
        }
        else {
            return uri + separator + key + "=" + value;
        }
    }
};
util = new Util();

var LoginForm = function () {
    var showClass = "show";
    var loginForm;
    var federatedIdpBaseUrl;
    this.init = function (form, err, step, usernameValidationToken, url) {
        var input = sessionStorage.getItem("input");
        if (input) {
            sessionStorage.removeItem('input');
            if (err.length == 0) {
                $("#accountlink").show();
            }
            $("#login-show-step2").removeProp('disabled').text($("#login-show-step2").data("textStatic"));
            $('#username').val(input);
            $("#login-step2-username-id").text(input);
            $('#step1').removeClass(showClass);
            $('#step2').addClass(showClass);
            return;
        }
        loginForm = initValidation(form, usernameValidationToken);
        federatedIdpBaseUrl = url;
        showStep(step);

        if (history.pushState) {
            history.replaceState({step: step}, null, null);
            window.addEventListener('popstate', function(e) {
                showStep(e.state.step);
            });
        }
        $("#login-show-step2").on('click tap dbltap longtap', function(e) {
            e.preventDefault();
            validateUsernameOrEmail();
        });
        $('#login-show-step1').on('click tap dbltap longtap', function(e) {
            e.preventDefault();
            showStep(1);
        });
    	form.submit(function( e ) {
    	    // check if user hit enter on step1
    	    if ($('#step1').hasClass(showClass) && $('#password').val() == "") {
                e.preventDefault();
                $('#login-show-step2').click();
                return false;
            }
            loginForm.resetForm();
            loginForm.element("#password");
            if (!loginForm.valid()) {
                e.preventDefault();
                return false;
            }
            $('#kc-login').prop('disabled', 'true').val($('#kc-login').data('valueProcessing'));
            sendFormSubmissionEvent('login','Log In-'+rhd.config.website_current, form[0]);
    	});

        $("#password").keydown(function (e) {
            if (e.keyCode == 13) {
                // e.preventDefault();
                form.submit();
            }
        });

    	if(err && err.length > 0){
    	  sendFormErrorsArrayEvent(form[0].id, 'login','Log In-'+rhd.config.website_current, err);
    	} else {
          sendFormLoadEvent(form[0].id, 'login','Log In-'+rhd.config.website_current);
    	}
    };
    var initValidation = function(form, usernameValidationToken) {
        // Very important to DO NOT validate on submit.
        // Vadliation is only for validating username and in case of 503 on REST API it's important to allow submit
        var validateConfig = {
            onkeyup : false,
            onfocusout : false,
            onsubmit: false,
            rules: {
                "username" : { required: true, maxlength : 45 },
                "password" : { required: true }
            }
        };
        setupLoginRemoteVerification(validateConfig, usernameValidationToken, usernameValidationFinished);
        return form.validate(validateConfig);
    };
    var validateUsernameOrEmail = function() {
        loginForm.resetForm();
        loginForm.element("#username");
    };
    var usernameValidationFinished = function(jqXHR, textStatus) {
        $("#login-show-step2").removeProp('disabled').text($("#login-show-step2").data("textStatic"));
        var response = $.parseJSON(jqXHR.responseText);
        if (jqXHR && jqXHR.status == 403) {
            // Do not reload because REST API returns 403 too early
            //location.reload();
            //return;
        }
        if (loginForm.valid()) {
            var input = $("#username").val();
            $("#login-step2-username-id").text(input);
            showStep(2);
            $('#customer-idp .centered').empty();
            if (response.idp) {
                var idp = response.idp;
                displayCustomerIdp(idp.alias, idp.displayName);
                if (!idp.linkExists) {
                    sessionStorage.setItem("input", input);
                }
            }
            if (history.pushState) {
                history.pushState({step: 2}, null, null);
            }
        }
    };
    var showStep = function(step, performPasswordFocus) {
        var step1Inputs = getFormInputs('#step1');
        var step2Inputs = getFormInputs('#step2');

        // loginForm.resetForm();
        if (step == 1) {
            $('#step1').addClass(showClass);
            $('#step2').removeClass(showClass);
            step2Inputs.attr('tabindex', '-1');
            step1Inputs.removeAttr('tabindex');
            setTimeout(function(){ $("#username").focus(); }, 500);
        } else if (step == 2) {
            // avoid showing second page if username is not filled. It may happen
            var username = $("#username").val();
            if (username == '') {
                return;
            }
            var resetPasswordLink = $("#reset-password");
            if (resetPasswordLink.length) {
                var resetPwdUrl = resetPasswordLink.attr('href');
                resetPwdUrl = util.updateQueryStringParameter(resetPwdUrl, "un", encodeURIComponent(username));
                resetPasswordLink.attr('href', resetPwdUrl);
            }
            $('#step1').removeClass(showClass);
            $('#step2').addClass(showClass);
            step1Inputs.attr('tabindex', '-1');
            step2Inputs.removeAttr('tabindex');
            if (performPasswordFocus == undefined || performPasswordFocus) {
                setTimeout(function(){ $("#password").focus(); }, 500);
            }
        }
    };
    var getFormInputs = function(parentSelector) {
        return $('input, select, a, button', parentSelector);
    };

    var displayCustomerIdp = function(alias, displayName) {
        
        var temp = federatedIdpBaseUrl.split("/");
        temp[5] = alias;
        var loginUrl = temp.join("/");
        var classStr = "button " + alias;
        var elem = "<a href=" + loginUrl + " id=social-" + alias + " class=" + classStr + ">" + displayName + "</a>";
//        var elem = `<a href=\"${loginUrl}\" id=\"social-${alias}\" class=\"${classStr}\">${displayName}</a>`;

        $("#customer-idp .centered").append(elem);
    }
};
loginForm = new LoginForm();
    	

/*
 * Javascripts for validation of user Registration form (login/register.ftl).
 * initValidation() must be called during page initialization.
 */
var RegisterForm = function () {
    var showClass = "show", ignoredClass = "ignored";
    var regForm;
    var regFormElement;
    var currentStep = 1;
    var hasStep2Inputs = true;
    this.init = function (form, requiredFields, visibleFields, termsRequired, usernameValidationToken) {
        regFormElement = form;
        var step1Inputs = getFormInputs('#step1');
        var step2Inputs = getFormInputs('#step2');
        hasStep2Inputs = step2Inputs.size() > 1;

        // button is input as well
        if (!hasStep2Inputs) {
            $("#register-show-step2").text($("#regform-submit").attr('value'));
        }
        if (history.pushState) {
            history.replaceState({step: 1}, null, null);
            window.addEventListener('popstate', function(e) {
                showStep(e.state.step);
            });
        }
        regForm = initValidation(form, requiredFields, visibleFields, termsRequired, usernameValidationToken);

        showStep(1);

        $("#register-show-step2").on('click tap dbltap longtap', function(e) {
            e.preventDefault();
            validateStep1();
        });

        step1Inputs.on('change', updateHeight);
        step2Inputs.on('change', updateHeight);

        sendFormLoadEvent(form[0].id, 'register','Register-'+rhd.config.website_current+"-"+rhd.config.user_profile_level);
    };
    var initValidation = function (regForm, requiredFields, visibleFields, termsRequired, usernameValidationToken) {
    	var validateConfig = {
            debug: false,
            ignore: ".ignored",
            submitHandler: function(form) {
                if (hasStep2Inputs && currentStep == 1) {
                    validateStep1();
                    return;
                }
                $('#regform-submit').prop('disabled', 'true').val($('#regform-submit').data('valueProcessing'));
                addressForm.onSubmit(regForm, usernameValidationToken, function(){
	                util.syncAndRemoveCheckbox($('#user\\.attributes\\.newsletter'), $('#user\\.attributes\\.newsletter\\.hidden'));
	                util.syncAndRemoveCheckbox($('#user\\.attributes\\.newsletterOpenShiftOnline'), $('#user\\.attributes\\.newsletterOpenShiftOnline\\.hidden'));
	                sendFormSubmissionEvent('register','Register-'+rhd.config.website_current+"-"+rhd.config.user_profile_level, form);
	                form.submit();
                }, function(validator){
                	$('#regform-submit').removeProp('disabled').val($('#regform-submit').data('valueStatic'));
                	updateHeight();
                	sendFormErrorsEvent(regForm[0].id, 'register','Register-'+rhd.config.website_current+"-"+rhd.config.user_profile_level, validator);
                });
            },
            invalidHandler: function(event, validator) {
                updateHeight();
            	sendFormErrorsEvent(regForm[0].id, 'register','Register-'+rhd.config.website_current+"-"+rhd.config.user_profile_level, validator);
            },
            rules: {
            	"username" : { required: true, minlength: 5, maxlength : 45, bannedCharsUsername: true},
            	"password" : { required: false, minlength: 8, maxlength : 255}
            },
            messages: {}
        };
    	
    	setupUsernameRemoteVerification(validateConfig,usernameValidationToken);

        setReqFieldValidation(validateConfig, "password", requiredFields, "password");

        setupRhdBasicUserValidations(validateConfig, requiredFields, usernameValidationToken);

    	setupRhdTCValidations(validateConfig, termsRequired);
    	
    	var addressFormInitialized = false;
    	if(visibleFields && (visibleFields["country"] == true || visibleFields["countryForDownload"] == true || visibleFields["address"] == true)){
    	  addressForm.init(regForm, validateConfig, requiredFields, visibleFields, updateHeight);
    	  addressFormInitialized = true;
    	}
    	
        var validationRegFrom = regForm.validate(validateConfig);
        
        /* init address form validations for more complicated address forms, must be called after server side js validation is initialized */
        if(addressFormInitialized && visibleFields && (visibleFields["address"] || visibleFields["countryForDownload"])){
	        addressForm.countryChanged(visibleFields,requiredFields);
        }
        return validationRegFrom;
    };
    var validateStep1 = function() {
        if (!regForm.form()) {
            updateHeight();
            return;
        }

        if (!hasStep2Inputs) {
            $('#register-show-step2').prop('disabled', 'true').text('Creating Account ...');
            $(regForm.currentForm).submit();
            return;
        }
        showStep(2);
        if (history.pushState) {
            history.pushState({step: 2}, null, null);
        }
    };
    var updateHeight = function() {
        var stepSize = $("#step" + currentStep).height();
        $(regFormElement).css('height', stepSize + 20);
    };
    var showStep = function(step) {
        var step1Inputs = getFormInputs('#step1');
        var step2Inputs = getFormInputs('#step2');
        if (step == 1) {
            $('#step2').removeClass(showClass);
            $('#step1').addClass(showClass);
            step2Inputs.addClass(ignoredClass).attr('tabindex', '-1');
            step1Inputs.removeClass(ignoredClass).removeAttr('tabindex');
            setTimeout(function() { step1Inputs[0].focus(); }, 500);
        } else if (step == 2) {
            $('#step1').removeClass(showClass);
            $('#step2').addClass(showClass);
            step1Inputs.addClass(ignoredClass).attr('tabindex', '-1');
            step2Inputs.removeClass(ignoredClass).removeAttr('tabindex');
            setTimeout(function() { step2Inputs[0].focus(); }, 500);
        }
        currentStep = step;
        regForm.resetForm();
        updateHeight();
    };
    var getFormInputs = function(parentSelector) {
        return $('input, select, a, button', parentSelector);
    }
};
registerForm = new RegisterForm();

/*
 * Javascripts for validation of user account update form shown during login flows (login/login-update-profile.ftl).
 * initValidation() must be called during page initialization.
 */
var UpdateForm = function () {
	var updformType = "login-profile-update";
	var updformName = "Additional Action Required-"+rhd.config.website_current+"-"+rhd.config.user_profile_level;
	var isFirstSocLogFlow;
    this.initValidation = function (regForm, requiredFields, visibleFields, isFirstSocialLoginFlow, enterPassword, enterUserProfile, termsRequired, usernameValidationToken) {
        isFirstSocLogFlow = isFirstSocialLoginFlow;
    	if(isFirstSocialLoginFlow){
    		updformType = "register-social";
    		updformName = "Register using a social account-"+rhd.config.website_current+"-"+rhd.config.user_profile_level;
    	}
    	
    	var validateConfig = {
            submitHandler: function(form) {
            	$('#regform-submit').prop('disabled', 'true').val($('#regform-submit').data('valueProcessing'));
            	addressForm.onSubmit(regForm, usernameValidationToken, function(){
	                util.syncAndRemoveCheckbox($('#user\\.attributes\\.newsletter'), $('#user\\.attributes\\.newsletter\\.hidden'));
	                util.syncAndRemoveCheckbox($('#user\\.attributes\\.newsletterOpenShiftOnline'), $('#user\\.attributes\\.newsletterOpenShiftOnline\\.hidden'));
	                sendFormSubmissionEvent(updformType, updformName, form);
	                form.submit();
            	}, function(validator){
            		$('#regform-submit').removeProp('disabled').val($('#regform-submit').data('valueStatic'));
            		sendFormErrorsEvent(regForm[0].id, updformType, updformName, validator);
            	});
            },
            invalidHandler: function(event, validator) {
            	sendFormErrorsEvent(regForm[0].id, updformType, updformName, validator);
            },
            rules: {},
            messages: {}
        };
    	
    	if(isFirstSocialLoginFlow){
    		validateConfig.rules["username"] = { required: true, minlength: 5, maxlength : 45, bannedCharsUsername: true};
    		setupUsernameRemoteVerification(validateConfig,usernameValidationToken);
    	}
    	
    	var addressFormInitialized = false;
    	if(enterUserProfile){
    		setupRhdBasicUserValidations(validateConfig, requiredFields, usernameValidationToken);
    		if(visibleFields && (visibleFields["country"] == true || visibleFields["countryForDownload"] == true || visibleFields["address"] == true)){
    	      addressForm.init(regForm, validateConfig, requiredFields, visibleFields);
    	      addressFormInitialized = true;
    	    }
    	}

    	if(enterPassword){
		  validateConfig.rules["password"] = { required: true,  minlength: 8, maxlength: 255 };
    	}
        
    	// terms handling
    	setupRhdTCValidations(validateConfig, termsRequired);
    	
        regFormValidation = regForm.validate(validateConfig);
        // run email validation on update page so error message is shown if email is invalid
        if(!isFirstSocialLoginFlow && enterUserProfile){
        	regFormValidation.element("#email");
        }
        
        /* init address form validations for more complicated address forms, must be called after server side js validation is initialized */
        if(addressFormInitialized && visibleFields && (visibleFields["address"] || visibleFields["countryForDownload"])){
	        addressForm.countryChanged(visibleFields,requiredFields);
        }
        
        sendFormLoadEvent(regForm[0].id, updformType, updformName);
    }
};
updateForm = new UpdateForm();


function setReqFieldValidation(validateConfig, formFieldName, requiredFieldsConfig, configFieldName, configFieldName2, configFieldName3){
  	if(requiredFieldsConfig && (requiredFieldsConfig[configFieldName] == true || requiredFieldsConfig[configFieldName2] == true || requiredFieldsConfig[configFieldName3] == true)){
  		validateConfig.rules[formFieldName].required = true;
  	} else {
  		validateConfig.rules[formFieldName].required = false;
  	}
}

function setupLoginRemoteVerification(validateConfig, usernameValidationToken, completeCallback) {
    validateConfig.rules.username["onkeyup"] = false;
    validateConfig.rules.username["onfocusout"] = false;
    validateConfig.rules.username["remote"] = {
        url: "/auth/realms/redhat-external/rhdtools/loginExists",
        type: "post",
        cache: false,
        contentType: "application/json",
        async: true,
        dataProcess: true,
        beforeSend: function(jqXHR, settings) {
            $("#login-show-step2").prop('disabled', 'true').text($("#login-show-step2").data("textProcessing"));
            settings.data = JSON.stringify(
                {
                    username: $("#username").val(),
                    token : usernameValidationToken
                }
            );
        },
        dataFilter: function(response) {
            return $.parseJSON(response).exists;
        },
        complete: completeCallback
    };
}

function setupUsernameRemoteVerification(validateConfig, usernameValidationToken){
	validateConfig.rules.username["onkeyup"] = false;
	validateConfig.rules.username["remote"] = {
	    url: "/auth/realms/redhat-external/rhdtools/usernameUsed",
	    type: "post",
	    cache: false,
	    contentType: "application/json",
	    async: true,
	    dataProcess: true,
	    beforeSend: function(jqXHR, settings) {
	        settings.data = JSON.stringify(
	            {
	                username: $("#username").val(),
	                token : usernameValidationToken
	            }
	        );
	    },
	    dataFilter: function(response) {
	        return !$.parseJSON(response).exists;
	    }
	};
}

/*
 * Function to setup RHD basic user validations.
 * If requiredFields is not defined then no any field is required.
 */
function setupRhdBasicUserValidations(validateConfig, requiredFieldsConfig, apiToken) {
	validateConfig.rules["email"] = {required: false, email: true, bannedCharsEmail:true};
    setReqFieldValidation(validateConfig, "email", requiredFieldsConfig, "email");
    validateConfig.rules.email["onkeyup"] = false;
    validateConfig.rules.email["remoteCustom"] = {
        url: "/auth/realms/redhat-external/rhdtools/verifyEmail",
        type: "post",
        cache: false,
        contentType: "application/json",
        async: true,
        dataProcess: true,
        isValidOnError: true,
        beforeSend: function(jqXHR, settings) {
            settings.data = JSON.stringify(
                {
                    token : apiToken,
                    email: $("#email").val(),
                    username: $("#email").attr("data-uname"),
                    emailStrictCheck: rhd.config.email_strict_check
                }
            );
        },
        dataFilter: function(response) {
            var result = $.parseJSON(response);
            var emailElm = $("#email");
            if (!result.valid) {
                emailElm.attr("data-validation-messageId", "data-msg-domainnotexists");
                return false;
            } else if(result.strictCheckFailed){
            	emailElm.attr("data-validation-messageId", "data-msg-emailNotStrict");
            	return false;
            } else {
                emailElm.attr("data-validation-messageId", "data-msg-emailexists");
                return !result.used;
            }
        }
    };
    validateConfig.messages["email"] = {
        remoteCustom: function(data, element) {
            var emailElm = $(element);
            if (emailElm.attr("data-validation-messageId")) {
                return emailElm.attr(emailElm.attr("data-validation-messageId"));
            }
        }
    };
    validateConfig.rules["firstName"] = {required: false, maxlength: 45, bannedChars: true};
    setReqFieldValidation(validateConfig, "firstName", requiredFieldsConfig, "firstName");

    validateConfig.rules["lastName"] = {required: false, maxlength: 45, bannedChars: true};
    setReqFieldValidation(validateConfig, "lastName", requiredFieldsConfig, "lastName");

    validateConfig.rules["user.attributes.company"] = {required: false, maxlength: 45, bannedChars: true};
    setReqFieldValidation(validateConfig, "user.attributes.company", requiredFieldsConfig, "company");
    
    validateConfig.rules["user.attributes.jobTitle"] = {required: false, maxlength: 45, bannedChars: true};
    setReqFieldValidation(validateConfig, "user.attributes.jobTitle", requiredFieldsConfig, "jobTitle", "jobTitleSelect");

    validateConfig.rules["user.attributes.phoneNumber"] = {required: false, minlength: 8, maxlength: 45, phone: true};
    setReqFieldValidation(validateConfig, "user.attributes.phoneNumber", requiredFieldsConfig, "phoneNumber");
}

function setupRhdTCValidations(validateConfig, termsRequired){
	if(termsRequired){
		for (var i = 0; i < termsRequired.length; i++) { 
			validateConfig.rules["user.attributes.tcacc-"+termsRequired[i]] = {required: true};
		}
	}
}


/*
 * Object used to handle Address part of user form. Mainly to show correct input field types and change them dynamically.
 * init() must be called during page initialization.
 */
var AddressForm = function () {

	/* Object containing country codes as a key and object with states as a value (object with states has state codes as a keys and state names as a values) */
	var statesByCountry = {};
	statesByCountry["US"] = {
		AL:"Alabama", AK:"Alaska", AZ:"Arizona", AR:"Arkansas",CA:"California",CO:"Colorado",CT:"Connecticut",DE:"Delaware",DC:"District Of Columbia",FL:"Florida",GA:"Georgia",HI:"Hawaii",ID:"Idaho",IL:"Illinois",IN:"Indiana",IA:"Iowa",KS:"Kansas",KY:"Kentucky",LA:"Louisiana",ME:"Maine",MD:"Maryland",MA:"Massachusetts",MI:"Michigan",MN:"Minnesota",MS:"Mississippi",MO:"Missouri",MT:"Montana",NE:"Nebraska",NV:"Nevada",NH:"New Hampshire",NJ:"New Jersey",NM:"New Mexico",NY:"New York",NC:"North Carolina",ND:"North Dakota",OH:"Ohio",OK:"Oklahoma",OR:"Oregon",PA:"Pennsylvania",RI:"Rhode Island",SC:"South Carolina",SD:"South Dakota",TN:"Tennessee",TX:"Texas",UT:"Utah",VT:"Vermont",VA:"Virginia",WA:"Washington",WV:"West Virginia",WI:"Wisconsin",WY:"Wyoming",AS:"American Samoa",GU:"Guam",MP:"Northern Marianas",PW:"Palau",PR:"Puerto Rico",VI:"Virgin Islands",AA:"Armed Forces(AA)",AE:"Armed Forces(AE)",AP:"Armed Forces(AP)"
		};
	statesByCountry["CA"] = {
        AB:"Alberta",BC:"British Columbia",MB:"Manitoba",NB:"New Brunswick",NL:"Newfoundland",NT:"Northwest Territory",NS:"Nova Scotia",NU:"Nunavut Territory",ON:"Ontario",PE:"Prince Edward Island",QC:"Quebec",SK:"Saskatchewan",YT:"Yukon Territory"
		};
	statesByCountry["MX"] = {
        AG:"Aguascalientes", BC:"Baja California", BS:"Baja California Sur", CH:"Chihuahua", CL :"Colima", CM:"Campeche", CO:"Coahuila", CS:"Chiapas", DF:"Ciudad de Mexico", DG:"Durango",	GR:"Guerrero", GT:"Guanajuato",HG:"Hidalgo",JA:"Jalisco",MI:"Michoacan",MO:"Morelos",MX:"Mexico",NA:"Nayarit",NL:"Nuevo Leon",OA:"Oaxaca",PU:"Puebla",QR:"Quintana Roo",QT:"Queretaro", SI:"Sinaloa",SL:"San Luis Potosi",SO:"Sonora",TB:"Tabasco",TL:"Tlaxcala",TM:"Tamaulipas",VE:"Veracruz", YU:"Yucatan",ZA:"Zacatecas"
		};

	var fillSelect = function(selectField, options, selectedValue) {
        selectField.find('option').remove();
        selectField.append($("<option />").val("").text(""));
        for(var key in options){
            var val = options[key];
            var item = $("<option />").val(key).text(options[key]);
            if (key == selectedValue) {
                item.attr("selected", "selected");
            }
			selectField.append(item);
		}
	};
	
	var fieldInfoPerCountryCache = {};

    var countryField, addressStateContainer, addressStateField, addressStateTextContainer, addressStateTextField, addressCityContainer, addressCityField;
    
    var adrValidationNecessary = false;

	this.init = function(regForm, validateConfig, requiredFieldsConfig, visibleFieldsConfig, countryChangedCallback) {
		
		validateConfig.rules["user.attributes.country"] = {required: false, bannedChars: true};
	    setReqFieldValidation(validateConfig, "user.attributes.country", requiredFieldsConfig, "country", "address", "countryForDownload");

	    validateConfig.rules["user.attributes.addressLine1"] = {required: false, minlength: 2, maxlength: 45, bannedChars: true};
	    setReqFieldValidation(validateConfig, "user.attributes.addressLine1", requiredFieldsConfig, "address");

	    validateConfig.rules["user.attributes.addressLine2"] = {required: false, minlength: 2, maxlength: 45, bannedChars: true};

	    validateConfig.rules["user.attributes.addressPostalCode"] = {required: false, minlength: 2, maxlength: 20, bannedChars: true};
	    setReqFieldValidation(validateConfig, "user.attributes.addressPostalCode", requiredFieldsConfig, "address");

	    validateConfig.rules["user.attributes.addressState"] = {required: true};
	    validateConfig.rules["user.attributes.addressStateText"] = {required: false, minlength: 2, maxlength: 45, bannedChars: true};

	    validateConfig.rules["user.attributes.addressCity"] = {required: false, minlength: 2, maxlength: 45, bannedChars: true};
	    setReqFieldValidation(validateConfig, "user.attributes.addressCity", requiredFieldsConfig, "countryForDownload", "address");

		
        countryField = $("#user\\.attributes\\.country");
        addressStateContainer = $("#addressStateContainer");
        addressStateField = $("#user\\.attributes\\.addressState");
        addressStateTextContainer = $("#addressStateTextContainer");
        addressStateTextField = $("#user\\.attributes\\.addressStateText");
        addressCityContainer = $("#addressCityContainer");
        addressCityField = $("#user\\.attributes\\.addressCity");

        /* init country changed logic for more complicated address forms */
        if(visibleFieldsConfig && (visibleFieldsConfig["address"] || visibleFieldsConfig["countryForDownload"])){
	        countryField.change(function() {
	            addressForm.countryChanged(visibleFieldsConfig,requiredFieldsConfig, countryChangedCallback);
	        });
        }
        
        adrValidationNecessary = visibleFieldsConfig && visibleFieldsConfig["address"];
	};
	
	this.onSubmit = function(regForm, apiToken, callbackOk, callbackError) {
		if(!adrValidationNecessary){
			callbackOk();
		} else {
		      $.ajax({
			        url: "/auth/realms/redhat-external/rhdtools/adr/validate",
			        type: "post",
			        cache: false,
			        contentType: "application/json",
			        async: true,
			        beforeSend: function(jqXHR, settings) {
			            settings.data = JSON.stringify(
			                {
			                	countryCode: $("#user\\.attributes\\.country").val(), 
			                	state: addressStateTextField.prop('disabled')?(addressStateField.prop('disabled')?"":$("#user\\.attributes\\.addressState").val()):$("#user\\.attributes\\.addressStateText").val(), 
			                	city: $("#user\\.attributes\\.addressCity").val(), 
			                	postalCode: $("#user\\.attributes\\.addressPostalCode").val(), 
			                	address2: $("#user\\.attributes\\.addressLine2").val(), 
			                	address1: $("#user\\.attributes\\.addressLine1").val(),
			                	county: $("#user\\.attributes\\.county").val(),
			                    token : apiToken
			                }
			            );
			        },
			        success: function(ret) {
		        		if(!ret.valid){
			        		var validator = regForm.validate();
			        		if(containsErrorForField(ret.errorFields,"state", false)){
			        			if(!addressStateField.prop('disabled')){
			        			  validator.showErrors({"user.attributes.addressState": regForm.data("msgAdrInvalid")});
			        			} else if(!addressStateTextField.prop('disabled')){
			        			  validator.showErrors({"user.attributes.addressStateText": regForm.data("msgAdrInvalid")});
			        			}  
			        		}
			        		if(containsErrorForField(ret.errorFields,"city",true)){
			        			validator.showErrors({ "user.attributes.addressCity": regForm.data("msgAdrInvalid") });
			        		}
			        		if(containsErrorForField(ret.errorFields,"postalCode",true)){
			        			validator.showErrors({ "user.attributes.addressPostalCode": regForm.data("msgAdrInvalid") });
			        		}
			        		if(containsErrorForField(ret.errorFields,"address2",false)){
			        			validator.showErrors({ "user.attributes.addressLine2": regForm.data("msgAdrInvalid") });
			        		}
			        		if(containsErrorForField(ret.errorFields,"address1",false)){
			        			validator.showErrors({ "user.attributes.addressLine1": regForm.data("msgAdrInvalid") });
			        		}
			        		if(containsErrorForField(ret.errorFields,"countryCode",false)){
			        			validator.showErrors({ "user.attributes.country": regForm.data("msgAdrInvalid") });
			        		}
			        		callbackError(validator);
		        		} else {
		        		    $("#user\\.attributes\\.addressCounty").val(ret.streetAddress.county);
		        			callbackOk();
		        		}
			        },
			        error: function(jqXHR, textStatus, errorThrown){
			        	callbackOk();
			        }   
		      });
		}
	   
	}
	
	var containsErrorForField = function(errorFields, fieldName, onUnsupported){
		return errorFields && (errorFields.indexOf(fieldName) > -1 || (onUnsupported && errorFields.indexOf("unsupported") > -1));
	}


    /* Handles necessary changes in the form if country is changed.
     * @param visibleFieldsConfig configuration of visible fields
     */
    this.countryChanged = function(visibleFieldsConfig, requiredFieldsConfig, countryChangedCallback) {
        var country = countryField.val();
        if(country){
	        var fieldInfo = fieldInfoPerCountryCache[country];
	        if(fieldInfo){
	        	setupFields(country, visibleFieldsConfig, requiredFieldsConfig, fieldInfo);
                if (countryChangedCallback) {
                    countryChangedCallback();
                }
	        } else {
	        	$.ajax({
	    		  url: "/auth/realms/redhat-external/rhdtools/adr/fieldInfo?country="+country,
	    		  headers: { "Accept": "application/json" }  
	    		}).success(function(data) {
	    			fieldInfoPerCountryCache[country] = data;
	    			setupFields(country, visibleFieldsConfig, requiredFieldsConfig, data);
	    		}).error(function(data) {
	    			setupFields(country, visibleFieldsConfig, requiredFieldsConfig, null);
	    		}).success(function() {
                    if (countryChangedCallback) {
                        countryChangedCallback();
                    }
                });
	        }
        } else {
        	setupFields(country, visibleFieldsConfig, requiredFieldsConfig,null);
        }
    };
    
    var setupFields = function(country, visibleFieldsConfig, requiredFieldsConfig, fieldInfo){
        var addressStateError = $("#user\\.attributes\\.addressState-error");
        var addressStateTextError = $("#user\\.attributes\\.addressStateText-error");
        var addressCityError = $("#user\\.attributes\\.addressCity-error");
        
        if(requiredFieldsConfig && requiredFieldsConfig["address"]){
          adjustFieldLabel("user\\.attributes\\.addressLine1", fieldInfo, "address1", true);
          adjustFieldLabel("user\\.attributes\\.addressLine2", fieldInfo, "address2", false);
          adjustFieldLabel("user\\.attributes\\.addressPostalCode", fieldInfo, "postalCode", true);
          
          adjustFieldRequiredValidationRule("user\\.attributes\\.addressLine1", fieldInfo, "address1", true);
          adjustFieldRequiredValidationRule("user\\.attributes\\.addressLine2", fieldInfo, "address2", false);
          adjustFieldRequiredValidationRule("user\\.attributes\\.addressPostalCode", fieldInfo, "postalCode", true);
        }
        
        if (isStateVisible(visibleFieldsConfig, country, fieldInfo)) {
            var options = statesByCountry[country];
            if(options){
              var initValue = addressStateField.attr("data-value");
              fillSelect(addressStateField, options, initValue);
              
              addressStateTextContainer.hide();
              addressStateTextError.hide();
              addressStateTextField.prop('disabled', true);
              addressStateTextContainer.detach();
              
              addressStateField.prop('disabled', false);
              addressStateContainer.show();
              addressStateError.show();
              addressStateContainer.insertAfter("#addressStateAnchor");
              
              // always required client side validation for this case - set in the rules from init
            } else {
              addressStateContainer.hide();
              addressStateError.hide();
              addressStateField.prop('disabled', true);
              addressStateContainer.detach();
                
              addressStateTextField.prop('disabled', false);
              addressStateTextContainer.show();
              addressStateTextError.show();
              addressStateTextContainer.insertAfter("#addressStateAnchor");
              adjustFieldLabel("user\\.attributes\\.addressStateText", fieldInfo, "state", false, "province");
              adjustFieldRequiredValidationRule("user\\.attributes\\.addressStateText", fieldInfo, "state", false, "province");
            }
            
        } else {
            addressStateContainer.hide();
            addressStateError.hide();
            addressStateField.prop('disabled', true);
            addressStateTextContainer.hide();
            addressStateTextError.hide();
            addressStateTextField.prop('disabled', true);
            addressStateTextContainer.detach();
            addressStateContainer.detach();
        }

        if (isCityVisible(visibleFieldsConfig, country, fieldInfo)) {
            addressCityField.prop('disabled', false);
        	addressCityContainer.show();
            addressCityError.show();
            addressCityContainer.insertAfter("#addressCityAnchor");
            adjustFieldLabel("user\\.attributes\\.addressCity", fieldInfo, "city", true);
            adjustFieldRequiredValidationRule("user\\.attributes\\.addressCity", fieldInfo, "city", true);
        } else {
            addressCityContainer.hide();
            addressCityError.hide();
            addressCityField.prop('disabled', true);
            addressCityContainer.detach();
        }
	};
	var isStateVisible = function(visibleFieldsConfig, country, fieldInfo) {
        if ((visibleFieldsConfig && visibleFieldsConfig["address"] && (isFieldVisible(fieldInfo, "state") || isFieldVisible(fieldInfo, "province"))) || statesByCountry[country] ) {
            return true;
        }
        return false;
    };
    var isCityVisible = function(visibleFieldsConfig, country, fieldInfo) {
        if ((visibleFieldsConfig && visibleFieldsConfig["address"] && (!fieldInfo || isFieldVisible(fieldInfo, "city"))) || country == "UA" ) {
            return true;
        }
        return false;
    };
    
    var isFieldVisible = function(fieldInfo, fieldInfoName){
    	return fieldInfo && (fieldInfo[fieldInfoName]=="DISPLAYED_REQUIRED" || fieldInfo[fieldInfoName]=="DISPLAYED_NOT_REQUIRED"); 
    };
    var isFieldRequired = function(fieldInfo, fieldInfoName){
    	return fieldInfo && fieldInfo[fieldInfoName]=="DISPLAYED_REQUIRED"; 
    };
    var adjustFieldLabel = function(formFieldName, fieldInfo, fieldInfoName, defaultVal, fieldInfoName2){
    	if ((!fieldInfo && defaultVal) || isFieldRequired(fieldInfo, fieldInfoName) || (fieldInfoName2 && isFieldRequired(fieldInfo, fieldInfoName2))){
            util.formFieldRequiredMarkAdd(formFieldName);
    	} else {
            util.formFieldRequiredMarkRemove(formFieldName);    		
    	}
    };
    var adjustFieldRequiredValidationRule = function(formFieldName, fieldInfo, fieldInfoName, defaultVal, fieldInfoName2){
    	var ff = $('#'+formFieldName);
    	var r = ff.rules();
    	r["required"] = fieldInfo ? ( isFieldRequired(fieldInfo, fieldInfoName) || (fieldInfoName2 ? isFieldRequired(fieldInfo, fieldInfoName2):false)) : defaultVal ;
    	ff.rules("add",r);
    };
};
addressForm = new AddressForm();

/*
 * Forgot Password request page javascripts (login/login-reset-password.ftl).
 * initValidation() must be called during page initialization.
 */
var ForgotPasswordReqForm = function () {
    this.initValidation = function (regForm) {
        regForm.validate({
        	submitHandler: function(form) {
                sendFormSubmissionEvent("fp-request", "Reset Your Password Request-"+rhd.config.website_current, form);
                form.submit();
            },
            invalidHandler: function(event, validator) {
            	sendFormErrorsEvent(regForm[0].id, "fp-request", "Reset Your Password Request-"+rhd.config.website_current, validator);
            },
            rules: {
            	"username": {required: true}
            }
        });
        sendFormLoadEvent(regForm[0].id, "fp-request", "Reset Your Password Request-"+rhd.config.website_current);
    }
};
forgotPasswordReqForm = new ForgotPasswordReqForm();


/**
 * Function to show/hide user account dropdown menu
 * https://github.com/redhat-developer/developers.redhat.com/blob/master/_docker/drupal/drupal-filesystem/web/themes/custom/rhdp/rhd-frontend/src/scripts/@rhd/js/header.js
 */
function initHeaderDropdown() {
    $(function() {
        $(document).click(function(event) {
            if(!$(event.target).closest("a.dropdwn-trigger").length) {
                if($('.rh-universal-header ul.rh-user-menu').is(":visible")) {
                    $('.rh-universal-header ul.rh-user-menu').hide();
                }
            }
        });

        $("a.dropdwn-trigger").on("click", function(event){
            event.preventDefault();
            var width = $('ul.rh-universal-login').outerWidth();
            $('ul.rh-user-menu').width(width);
            $('ul.rh-user-menu').show();
        })
    });
}

/**
 * https://github.com/redhat-developer/developers.redhat.com/blob/master/_docker/drupal/drupal-filesystem/web/themes/custom/rhdp/rhd-frontend/src/scripts/%40rhd/js/menu.js
 */
function initMobileMenu() {
    $(function() {
        $('.menu-toggle').click(function() {
            $('body').toggleClass('mobile-tray-open');
            $('.rhd-mobile-tray').slideToggle(250);
        });
        $('.rhd-mobile-overlay').click(function() {
            $('body').toggleClass('mobile-tray-open');
            $('.rhd-mobile-tray').slideToggle(250);
        });
    });
}

/**
 * Creates and dispatches an DTM event
 * @param {String} evt - The name of the event
 * @param {Object} evtData - The event data object
 */
function sendCustomEvent(evt, evtData){
  window.digitalData = window.digitalData || {};
  digitalData.event = digitalData.event || [];
  digitalData.event.push(evtData);

  if(document.createEvent && document.body.dispatchEvent){
    var event = document.createEvent('Event');
    event.initEvent(evt, true, true); //can bubble, and is cancellable
    document.body.dispatchEvent(event);
  } else if(window.CustomEvent && document.body.dispatchEvent) {
    var event = new CustomEvent(evt, {bubbles: true, cancelable: true});
    document.body.dispatchEvent(event);
  }
}

/**
 * Creates and dispatches an DTM form load event
 */
function sendFormLoadEvent(formId, formType, formName){
  if (window.digitalData) {
	var ddFormEvent = {
		eventInfo: {
		  eventAction: 'formLoad',
		  eventName: 'formLoad',
		  formId: formId,
		  formName: formName,
		  formStep: 'view',
		  formType: formType,
		  offerId: '',
		  timeStamp: new Date(),
		  processed: {
		    adobeAnalytics: false
		  }
		}
	};
	sendCustomEvent('formEvent', ddFormEvent);
  }
}

/**
 * Creates and dispatches an DTM form submission event
 */
function sendFormSubmissionEvent(formType, formName, formDom){
  if (window.digitalData) {	
	var ddFormEvent = {
		eventInfo: {
		  eventAction: 'formSubmission',
		  eventName: 'formSubmit',
		  formId: formDom.id,
		  formName: formName,
		  formStep: 'submit',
		  formType: formType,
		  offerId: '',
		  fieldValues: [],
		  timeStamp: new Date(),
		  processed: {
		    adobeAnalytics: false
		  }
		}
	};
	
	for (var i = 0; i < formDom.length; i++) {
		if(formDom.elements[i].type != "submit" && formDom.elements[i].type != "hidden" && formDom.elements[i].type != "password" && !formDom.elements[i].disabled){
			var en = formDom.elements[i].name;
			if(en && en.indexOf("password") == -1 && en.indexOf("pwd") == -1){
				if(formDom.elements[i].type != "checkbox" || formDom.elements[i].checked){
				  ddFormEvent.eventInfo.fieldValues.push(en+":"+formDom.elements[i].value);
				}
			}
		}
	}
	
	sendCustomEvent('formEvent', ddFormEvent);
  }
}


function sendSocialLinkEvent(sprov){
  if (window.digitalData) {	
	var ddSocialLinkEvent = {
	  eventInfo: {
	    eventAction: 'link',
	    eventName: 'social account link',
	    socialAccount: sprov,
	    socialAccountsLinked: ['<string>', '<string>', '<string>'],
	    timeStamp: new Date(),
	    processed: {
	      adobeAnalytics: false
	    }
	  }
	};
	ddSocialLinkEvent.eventInfo.socialAccountsLinked = digitalData.user[0].profile[0].profileInfo.socialAccountsLinked;
	sendCustomEvent('socialLinkEvent', ddSocialLinkEvent); 
  }	
}

/**
 * Creates and dispatches an DTM form submission error event with errors taken from jquery validator
 */
function sendFormErrorsEvent(formId, formType, formName, validator){
  if (window.digitalData) {
	var em = [];
	for (var i in validator.errorMap) {
		em.push(i + ":" + validator.errorMap[i]);
	}
	sendFormErrorsArrayEvent(formId, formType, formName, em);
  }
}

/**
 * Creates and dispatches an DTM form submission error event with errors array pushed in as third param
 */
function sendFormErrorsArrayEvent(formId, formType, formName, errorMessage){
  if (window.digitalData) {

	  var ddFormEvent = {
		eventInfo: {
		  eventAction: 'formSubmission',
		  eventName: 'formSubmit',
		  formId: formId,
		  formName: formName,
		  formStep: 'error',
		  formType: formType,
		  offerId: '',
		  errorMessage: [],
		  timeStamp: new Date(),
		  processed: {
		    adobeAnalytics: false
		  }
		}
	};
	
	if(errorMessage){
	  ddFormEvent.eventInfo.errorMessage = errorMessage;
	}

	sendCustomEvent('formEvent', ddFormEvent);
  }	
}

function sendAsyncUDEvent() {
	if (window.digitalData) {
		var ddAjaxUserEvent = {
			eventInfo : {
				eventAction : 'available',
				eventName : 'user data',
				user : [],
				timeStamp : new Date(),
				processed : {
					adobeAnalytics : false
				}
			}
		};
		ddAjaxUserEvent.eventInfo.user = window.digitalData.user;
		sendCustomEvent('ajaxAuthEvent', ddAjaxUserEvent);
	}
}

/*
 * jquery Validation settings
 */
jQuery.validator.setDefaults({
    errorElement: "span",
    errorPlacement: function(error, element) {
        if (element.attr('type') == 'checkbox') {
            error.insertAfter( $("label[for='" + element.attr('id') + "']") );
        } else {
            error.insertAfter( element );
        }
    },
    onkeyupDefault: $.validator.defaults.onkeyup,
    onkeyup: function(element) {
        var element_id = $(element).attr('id');
        if (this.settings.rules[element_id] && this.settings.rules[element_id].onkeyup !== false) {
            $.validator.defaults.onkeyupDefault.apply(this, arguments);
        }
    },
    highlight: function( element, errorClass, validClass ) {
        if ( element.type === "radio" ) {
            this.findByName( element.name ).addClass( errorClass ).removeClass( validClass );
            this.findByName( element.name ).parent().addClass( errorClass ).removeClass( validClass );
        } else {
            $( element ).addClass( errorClass ).removeClass( validClass );
            $( element ).parent().addClass( errorClass ).removeClass( validClass );
        }
    },
    unhighlight: function( element, errorClass, validClass ) {
        if ( element.type === "radio" ) {
            this.findByName( element.name ).removeClass( errorClass ).addClass( validClass );
            this.findByName( element.name ).parent().removeClass( errorClass ).addClass( validClass );
        } else {
            $( element ).removeClass( errorClass ).addClass( validClass );
            $( element ).parent().removeClass( errorClass ).addClass( validClass );
        }
    }
});


showHidePasswordCfg = {
    innerToggle: 'focus',
    toggle: {
        className: "rhdPasswordToggle",
        verticalAlign: "bottom",
        styles: {
            "margin-bottom": "4px"
        }
    },
    wrapper: {
        enforceWidth: false,
        inheritStyles: []
    }
};

/* jquery validators. More in footer-js.ftl */
jQuery.validator.addMethod("required", function(value, element) {
    return $.trim(value);
});
/*
 * Additional validators
 */
jQuery.validator.addMethod("phone", function(value, element) {
    var re = new RegExp('^\\+?[0-9\\.\\- ]+$');
    return this.optional(element) || re.test(value);
});

jQuery.validator.addMethod("bannedChars", function(value, element) {
    return !(util.stringContains(value,"\"") || util.stringContains(value,"$") || util.stringContains(value,"^") || util.stringContains(value,"<") || util.stringContains(value,">") || util.stringContains(value,"|") || util.stringContains(value,"+") || util.stringContains(value,"%") || util.stringContains(value,"\\"));
});

jQuery.validator.methods.email = function( value, element ) {
    return this.optional( element ) || /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/.test( value );
};

jQuery.validator.addMethod("bannedCharsUsername", function(value, element) {
    return !(util.containsUsernameUnsupportedCodePoint(value) || util.stringContains(value,"\"") || util.stringContains(value,"$") || util.stringContains(value,"^") || util.stringContains(value,"<") || util.stringContains(value,">") || util.stringContains(value,"|")
        || util.stringContains(value,"+") || util.stringContains(value,"%") || util.stringContains(value,"/")|| util.stringContains(value,"(") || util.stringContains(value,")") || util.stringContains(value,";") || util.stringContains(value,":") || util.stringContains(value,",")
        || util.stringContains(value,"\\") || util.stringContains(value,"~") || util.stringContains(value,"*") || util.stringContains(value,"=") || util.stringContains(value,"#"));
});

jQuery.validator.addMethod("bannedCharsEmail", function(value, element) {
    return !(util.stringContains(value,"$") || util.stringContains(value,"^") || util.stringContains(value,"|") || util.stringContains(value,"%") || util.stringContains(value,"\\") || util.stringContains(value,"~") || util.stringContains(value,"*") || util.stringContains(value,"="));
});

/*
 * Customized remote validation to handle error responses.
 * It consumes parameter isValidOnError. If it's true then it clears the validation error
 * It's 100% copy of "remote" validator but only added "error" parameter and logic to clear the validation error
 */
jQuery.validator.addMethod("remoteCustom", function(value, element, param, method) {
    if ( this.optional( element ) ) {
        return "dependency-mismatch";
    }

    method = typeof method === "string" && method || "remoteCustom";

    var previous = this.previousValue( element, method ),
        validator, data, optionDataString;

    if ( !this.settings.messages[ element.name ] ) {
        this.settings.messages[ element.name ] = {};
    }
    previous.originalMessage = previous.originalMessage || this.settings.messages[ element.name ][ method ];
    this.settings.messages[ element.name ][ method ] = previous.message;

    param = typeof param === "string" && { url: param } || param;
    optionDataString = $.param( $.extend( { data: value }, param.data ) );
    if ( previous.old === optionDataString ) {
        return previous.valid;
    }

    previous.old = optionDataString;
    validator = this;
    this.startRequest( element );
    data = {};
    data[ element.name ] = value;
    $.ajax( $.extend( true, {
        mode: "abort",
        port: "validate" + element.name,
        dataType: "json",
        data: data,
        context: validator.currentForm,
        error: function(jqXHR) {
            if (param.isValidOnError) {
                submitted = validator.formSubmitted;
                validator.resetInternals();
                validator.toHide = validator.errorsFor( element );
                validator.formSubmitted = submitted;
                validator.successList.push( element );
                validator.invalid[ element.name ] = false;
                validator.showErrors();
                previous.valid = true;
                validator.stopRequest( element, true );
            }
        },
        success: function( response ) {
            var valid = response === true || response === "true",
                errors, message, submitted;

            validator.settings.messages[ element.name ][ method ] = previous.originalMessage;
            if ( valid ) {
                submitted = validator.formSubmitted;
                validator.resetInternals();
                validator.toHide = validator.errorsFor( element );
                validator.formSubmitted = submitted;
                validator.successList.push( element );
                validator.invalid[ element.name ] = false;
                validator.showErrors();
            } else {
                errors = {};
                message = response || validator.defaultMessage( element, { method: method, parameters: value } );
                errors[ element.name ] = previous.message = message;
                validator.invalid[ element.name ] = true;
                validator.showErrors( errors );
            }
            previous.valid = valid;
            validator.stopRequest( element, valid );
        }
    }, param ) );
    return "pending";
});
