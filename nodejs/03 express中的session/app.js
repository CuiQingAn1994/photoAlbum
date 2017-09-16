// 使用express-session
var express = require("express");
var session = require("express-session");
var body = require("body-parser");
var app = express();
app.use(body.urlencoded({extended:false}));
// 通知app应用session中间件
app.use(session({
	secret:"asdfoiahfoiwah",
	resave:false,
	saveUninitialized:true,
}))
app.use(express.static("./static"));
app.post("/login",function(req,res){
	console.log(req.session) 
	req.session.username = req.body.username;
	req.session.password = req.body.password;
	res.render("./welcome.ejs",{
		username:req.session.username,
		password:req.session.password
	})
})
app.get("/test",function(req,res){
	console.log(req.connection.remoteAddress,req.session.username);
	res.end("1");
})
app.listen(3000,"192.168.2.30");