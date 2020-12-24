module.exports = {
  gdFindiUrl: function(){
    //return `https://precom.gdfindi.pro`
    return `https://clb-win-0002.clb.svc.fortknox.local`
  },
  htmlTemplate: function (title, library, style, header, body, script) {
    var styleHeader = '';
    var headerContent = function (header) {
      if (header === false) {
        return '';
      } else {
        var defaultHeader = `
<div class="topnav">
    <a href="/">HOME</a>
    ${header}
    <div class="topnav-right">
        <a href="/lexerproject">Log out</a>
    </div>
</div>
<style>
/* Add a black background color to the top navigation */
.topnav {
    background-color: #333;
    overflow: hidden;
}

/* Style the links inside the navigation bar */
.topnav a {
  float: left;
  color: #f2f2f2;
  text-align: center;
  padding: 14px 16px;
  text-decoration: none;
  font-size: 17px;
}

/* Change the color of links on hover */
.topnav a:hover {
  background-color: #ddd;
  color: black;
}

/* Add a color to the active/current link */
.topnav a.active {
  background-color: #4CAF50;
  color: white;
}

/* Right-aligned section inside the top navigation */
.topnav-right {
  float: right;
}
</style>
            `;
        return defaultHeader;
      }
    }

    var html = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css">
<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap-theme.min.css">
<link href='https://fonts.googleapis.com/css?family=Roboto' rel='stylesheet'>
<script src="https://code.jquery.com/jquery-3.5.1.min.js"></script>
<script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js"></script>
${library}
<style>
body {
    font-family: 'Roboto';
}
${style}
</style>
</head>
<body>
${headerContent(header)}
${body}
<script>
${script}
</script>
</body>
</html>                                		
`;

    return html;
  },

  htmlVFKTemplate: function (title, library, style, header, body, script, step) {
    var styleHeader = '';
    var headerContent = function (header) {
      if (header === false) {
        return '';
      } else {
        var defaultHeader = `
<div class="topnav">
    <a id='lexer-logo' href='http://www.lexer.co.jp/en'><img src="http://www.lexer.co.jp/static/images/en/common/logo.png" alt="lexer-logo">
    <div class="topnav-right">
        <a id='logout' href="/lexerproject">Log out</a>
    </div>
</div>
<style>
/* Add a gray background color to the top navigation */
.topnav {
    background-color: #F2F2F2;
    overflow: hidden;
}

/* Style the links inside the navigation bar */
.topnav #logout{
  float: right;
  color: black;
  text-align: center;
  padding: 32px 20px;
  text-decoration: none;
  font-size: 17px;
}
.topnav #lexer-logo{
    float: left;
    padding: 25px 10px;
    text-align: center;
    text-decoration: none;
}

/* Change the color of links on hover */
.topnav #logout:hover {
  background-color: #333;
  color: #F2F2F2;
}

/* Add a color to the active/current link */
.topnav #logout.active {
  background-color: #4CAF50;
  color: white;
}

/* Right-aligned section inside the top navigation */
.topnav-right {
  float: right;
}
#main_title{
    font-size: 2.5em;
    font-weight: bold;
    padding: 20px 0;
    text-align: center;
  }
#vfk-body {
    padding: 5px 0;
    overflow: auto;
}
html {
	-webkit-font-smoothing: antialiased!important;
	-moz-osx-font-smoothing: grayscale!important;
	-ms-font-smoothing: antialiased!important;
}
body {
  background-color: rgb(0,0,0,0.005);
}
#stepper {
    overflow: hidden;
    position: fixed;
    bottom: 0;
    width: 100%;
    padding-top: 5px;
}

.md-stepper-horizontal {
	display:table;
	width:100%;
	margin:0 auto;
	background-color:#FFFFFF;
	box-shadow: 0 3px 8px -6px rgba(0,0,0,.50);
}
.md-stepper-horizontal .md-step {
	display:table-cell;
	position:relative;
	padding:24px;
}
.md-stepper-horizontal .md-step:active {
	background-color:rgba(0,0,0,0.04);
}
.md-stepper-horizontal .md-step{
	background-color:rgba(0,0,0,0.1);
}
.md-stepper-horizontal .md-step.md-step.active.editable, .md-stepper-horizontal .md-step.md-step.active.last{
	background-color:rgba(0,0,0,0.3);
}
.md-stepper-horizontal .md-step:first-child:active {
	border-top-left-radius: 0;
	border-bottom-left-radius: 0;
}
.md-stepper-horizontal .md-step:last-child:active {
	border-top-right-radius: 0;
	border-bottom-right-radius: 0;
}
.md-stepper-horizontal .md-step:hover .md-step-circle {
	background-color:#757575;
}
.md-stepper-horizontal .md-step:first-child .md-step-bar-left,
.md-stepper-horizontal .md-step:last-child .md-step-bar-right {
	display:none;
}
.md-stepper-horizontal .md-step .md-step-circle {
	width:30px;
	height:30px;
	margin:0 auto;
	background-color:#999999;
	border-radius: 50%;
	text-align: center;
	line-height:30px;
	font-size: 16px;
	font-weight: 600;
	color:#FFFFFF;
}
.md-stepper-horizontal.green .md-step.active .md-step-circle {
	background-color:#00AE4D;
}
.md-stepper-horizontal.orange .md-step.active .md-step-circle {
	background-color:#F96302;
}
.md-stepper-horizontal .md-step.active .md-step-circle {
	background-color: rgb(7, 81, 141);
}
.md-stepper-horizontal .md-step.done .md-step-circle:before {
	font-family:'FontAwesome';
	font-weight:100;
	content: "\\f00c";
}
.md-stepper-horizontal .md-step.last .md-step-circle:before {
	font-family:'FontAwesome';
	font-weight:100;
	content: "\\f00c";
}
.md-stepper-horizontal .md-step.done .md-step-circle *,
.md-stepper-horizontal .md-step.last .md-step-circle *,
.md-stepper-horizontal .md-step.editable .md-step-circle * {
	display:none;
}
.md-stepper-horizontal .md-step.editable .md-step-circle {
	-moz-transform: scaleX(-1);
	-o-transform: scaleX(-1);
	-webkit-transform: scaleX(-1);
	transform: scaleX(-1);
}
.md-stepper-horizontal .md-step.editable .md-step-circle:before {
	font-family:'FontAwesome';
	font-weight:100;
	content: "\\f040";
}
.md-stepper-horizontal .md-step .md-step-title {
	margin-top:16px;
	font-size:16px;
	font-weight:600;
}
.md-stepper-horizontal .md-step .md-step-title,
.md-stepper-horizontal .md-step .md-step-optional {
	text-align: center;
	color:rgba(0,0,0,.26);
}
.md-stepper-horizontal .md-step.active .md-step-title {
	font-weight: 600;
	color:rgba(0,0,0,.87);
}
.md-stepper-horizontal .md-step.active.done .md-step-title,
.md-stepper-horizontal .md-step.active.last .md-step-circle *,
.md-stepper-horizontal .md-step.active.editable .md-step-title {
	font-weight:600;
}
.md-stepper-horizontal .md-step .md-step-optional {
	font-size:12px;
}
.md-stepper-horizontal .md-step.active .md-step-optional {
	color:rgba(0,0,0,.54);
}
.md-stepper-horizontal .md-step .md-step-bar-left,
.md-stepper-horizontal .md-step .md-step-bar-right {
	position:absolute;
	top:36px;
	height:1px;
	border-top:5px solid #000000;
}
.md-stepper-horizontal .md-step .md-step-bar-right {
	right:0;
	left:50%;
	margin-left:20px;
}
.md-stepper-horizontal .md-step .md-step-bar-left {
	left:0;
	right:50%;
	margin-right:20px;
}
${style}
</style>
            `;
        return defaultHeader;
      }
    }
    var curStep = [];
    for (var i = 0; i < 4; i++) {
      if (step == i + 1) {
        curStep[i] = 'active editable'
      } else if (step < i + 1) {
        curStep[i] = 'active'
      } else if (i == 3 && step >= 4) {
        curStep[i] = 'active last'
      } else {
        curStep[i] = 'active done'
      }
    }
    var html = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css">
<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap-theme.min.css">
<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.5.0/css/font-awesome.min.css">
<link href='https://fonts.googleapis.com/css?family=Roboto' rel='stylesheet'>
<script src="https://code.jquery.com/jquery-3.5.1.min.js"></script>
<script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js"></script>
${library}
<style>
body {
    font-family: 'Roboto';
}
${style}
</style>
</head>
<body>
${headerContent(header)}
<div class='title' id="main_title"><img src="gdf.png" alt="gdf-logo">&nbsp;&nbsp;GD.findi / Production Plan Scheduling</div>
<div id='vfk-body'>
${body}
</div>
<div id="stepper">
  <div class="md-stepper-horizontal">
    <div class="md-step ${curStep[0]}" style="cursor: pointer;" onclick="window.location='/projectlist'">
      <div class="md-step-circle"><span>1</span></div>
      <div class="md-step-title">Select Project</div>
      <div class="md-step-bar-left"></div>
      <div class="md-step-bar-right"></div>
    </div>
    <div id="step2" class="md-step ${curStep[1]}">
      <div class="md-step-circle"><span>2</span></div>
      <div class="md-step-title">Submit to PVDO</div>
      <div class="md-step-bar-left"></div>
      <div class="md-step-bar-right"></div>
    </div>
    <div id="step3" class="md-step ${curStep[2]}">
      <div class="md-step-circle"><span>3</span></div>
      <div class="md-step-title">Generating output</div>
      <div class="md-step-bar-left"></div>
      <div class="md-step-bar-right"></div>
    </div>
    <div class="md-step ${curStep[3]}">
      <div class="md-step-circle"><span>4</span></div>
      <div class="md-step-title">Transfer</div>
      <div class="md-step-bar-left"></div>
      <div class="md-step-bar-right"></div>
    </div>
  </div>
</div>
<script>
${script}
</script>
</body>
</html>                                		
`;

    return html;
  }

};