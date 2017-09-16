// 引入模块
var express = require("express");
var body = require("body-parser");
// cookie-parser的作用就是给req对象添加了一个cookies属性。方便获取cookie。与body-parser的作用类似
var cookie = require("cookie-parser");
var app = express();
app.use(body.urlencoded({extended:false}));
app.use(express.static("./static"));
app.use(cookie());
// 定义接口路由
app.post("/login",function(req,res){
	var username = req.body.username;
	var password = req.body.password;
	// 添加到cookie中
	res.cookie("username","123",{maxAge:5000});
	console.log(req.cookies);
	// 渲染
	res.render("./welcome.ejs",{
		username:username,
		password:password
	});
});
app.listen(3000);