<script src="/javascripts/cookie.js"></script>
{% if request.request_uri contains "state=" %}
<script type="text/javascript">
  var stateValue = getCookie('state');
  {% assign url = request.request_uri %}
  {% assign modified_params = url | replace: 'session_state', 'session_id'%}
  
  {% assign returnedState = modified_params | split: '?state=' | last | split: '&' | first | split: 'state=' | last %}
  if(stateValue == '{{returnedState}}') {
     alert("Success! Authorized");
  }else{
   alert("Error! Invalid state");
   }
  
</script>
{% assign url = request.request_uri %}

{% assign param = url | split: 'client_id=' | last %}
<a class="btn btn-primary" id="oidc" href="javascript:void(0);" >Get Token</a>
<select id="keySelect" onchange="addKey('token')">
          <option>Choose your application</option>
  		{% for application in current_account.applications %}
          <option value="{{application.keys.first}}|{{application.application_id}}">{{application.name}} | {{application.service.name}}</option>
   		{% endfor %}
</select>
{% else %}
<a class="btn btn-primary" id="oidc" href="">Authorize</a>
<select id="keySelect" onchange="addKey('auth')">
          <option>Choose your application</option>
  		{% for application in current_account.applications %}
          <option value="{{application.keys.first}}|{{application.application_id}}">{{application.name}} | {{application.service.name}}</option>
   		{% endfor %}
</select>
{% endif %}