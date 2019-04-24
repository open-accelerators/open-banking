{% for auth_provider in site.authentication_providers %}
	{% case auth_provider.kind %}
	{% when 'keycloak' %}
	{% assign auth_url = {{auth_provider.authorize_url}} | split: '?' | first %}
	{% endcase %}
{% endfor %}
<script type="text/javascript">
var str = '{{auth_url}}',
  delimiter = '/auth',
  start = 2,
  fragments = str.split(delimiter).slice(0,start),
  result = fragments.join(delimiter);
  var clientId;
  var clientSecret;
  
  function setCredentials(clientId, clientSecret, element) {
    element.setAttribute("onclick", "getToken(clientId, clientSecret);")
    
  }
  
  function addKey(call) {
    var sel = document.getElementById('keySelect');
    var el = document.getElementById('oidc');
    keys = sel.options[sel.selectedIndex].value;
  	clientSecret = keys.split("|")[0]
    clientId = keys.split("|")[1]
    
    if (call == 'auth') {
    var state = setCookie('state', 12, 1)
    setCookie('application', clientId, 2)
    el.setAttribute("href", "{{auth_url}}?response_type=code&client_id=" + clientId + "&client_secret=" + clientSecret + "&redirect_uri=https://" + "{{provider.domain}}" + "{{request.path}}" + "&state=" + state);
    } else if (call == 'token') {
      setCredentials(clientId, clientSecret, el);
    }
}
  function getToken(clientId, clientSecret) {
    {% assign path = request.path | remove_first: '/' %}
    {% assign params = request.request_uri | split: '?' | last %}
    {% if params contains 'state=' %}
    window.history.replaceState({}, document.title, "/" + "{{path}}");
  
    {% assign code = params | split: 'code=' | last | split: '&' | first %}
    var code = '{{ code }}';
    var tokenUrl = result + '/token';
    var  formData = "response_type=code&client_id=" + clientId + "&client_secret=" + clientSecret + "&redirect_uri=https://" + "{{provider.domain}}" + "{{request.path}}" + "&state=" + getCookie('state') + "&grant_type=authorization_code&code=" + code;  //Name value Pair
   
    $.ajax({
        url : tokenUrl,
        type: "POST",
        data : formData,
        success: function(response, textStatus, jqXHR)
        {
          var token = response.access_token;
          console.log(response); //data - response from server
        	var tokenResponse = false;
          var inputs = $("input[name='Authorization']");
          if (inputs.length > 0) {
            tokenResponse = true;
            // set the value of the inputs
            inputs.each(function(index) {
              $(this).val('Bearer '+token);
            });
            alert("Success! Token: " + token);
            return;
          }
        },
        error: function (response, textStatus, jqXHR)
        {
     		alert(textStatus);
        }
});
   
    {% elsif params contains 'state=&'  %}
      alert('state is invalid or expired');
    {% endif %}
  };
</script>