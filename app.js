var express = require("express");
var app = express();
var body_paser = require("body-parser");
var session = require("express-session");
var mongo = require("mongodb");
var formidable = require("formidable");
var fs = require("fs");
var mongoClient = mongo.MongoClient;
var connect_str="mongodb://localhost:27017/ickt7";
app.use(session({
	secret:"wqerwqerwqruio",
	resave:false,
	saveUninitialized:true
}))
app.use(body_paser.urlencoded({extended:false}));
app.use(express.static("./static"));
app.use(express.static("./albums"));
app.get("/regist",function(req,res){
	res.render("./regist.ejs");

});
//检测用户名
app.get("/checkusername",function(req,res){
	var username=req.query.username;
	mongoClient.connect(connect_str,function(err,db){
		if(err){
		res.send({
			error:1,
			data:"连接数据库失败！！！"
		});
		return;
	}
		var obj = {username:username};
		db.collection("students").findOne(obj,function(err,data){
			if(err){
				res.send({
					error:2,
					data:"查询数据库失败"

				});
				db.close();
				return;
			}
			if(data===null){
				res.send({error:0,data:"可以注册"})
			}else{

				res.send({error:3,data:"用户名已经被占用"})
			}
			db.close();

		})
	}) 	
});
//注册路由
app.post("/regist",function(req,res){
	//获取前端提交过来的数据
	var formid = new formidable.IncomingForm();
	formid.uploadDir = "./uploads";
	console.log(00000);
	formid.parse(req,function(err,fields,files){
		console.log(123)
		if(err){
			res.send("抱歉，解析上传数据失败");
			return;
		}
		var username = fields.username;
		var password = fields.password;
		fs.mkdir("./albums/"+username,function(err){
			if(err){
				res.send("创建用户文件夹失败")
				return;
			}

			fs.mkdir("./albums/"+username+"/head_pic",function(err){
				
				if(err){
					res.send("创建头像文件夹失败");
					return;
				}
				var ext = files.head_pic.name.slice(files.head_pic.name.lastIndexOf("."));
				if(!files.head_pic.size){
					files.head_pic.path = "./static/imgs/default/111.jpg";
					ext=".jpg";

					fs.readFile("./static/imgs/default/default.jpg",function(err,data){
						if(err){
							//读取头像失败
							res.send("读取头像失败");
							return;
						}
					//读取成功,开始复制
						fs.appendFile("./static/imgs/default/111.jpg",data,function(err){
							if(err){
								res.send("复制文件失败");
								return;
							}
							var newPath = username+"/head_pic/"+"head_pic"+ext;
							fs.rename(files.head_pic.path,"./albums/"+newPath,function(err){
								if(err){
									res.send("头像文件改名失败");
									return;
								}
								mongoClient.connect(connect_str,function(err,db){
									if(err){
										res.send("连接数据库失败！！！");
										return;
									}
									db.collection("students").insertOne({username:username,password:password,head_pic:newPath},function(err,data){
										if(err){
											res.send("插入数据失败");
											db.close();
											return;
										}
										db.close();
										req.session.username = username;
										req.session.head_pic = newPath;
										res.redirect("/main.html");
									});
								});
								
							});
						});
					});
				}else{
					var newPath = username+"/head_pic/"+"head_pic"+ext;
					fs.rename(files.head_pic.path,"./albums/"+newPath,function(err){
						if(err){
							res.send("头像文件改名失败");
							return;
							}
						mongoClient.connect(connect_str,function(err,db){
							if(err){
								res.send("连接数据库失败！！！");
								return;
							}
							db.collection("students").insertOne({username:username,password:password,head_pic:newPath},function(err,data){
								if(err){
									res.send("插入数据失败");
									db.close();
									return;
								}
								db.close();
								req.session.username = username;
								req.session.head_pic = newPath;
								res.redirect("/main.html");
							})
						})	
					})
				}
			});
			fs.mkdir("./albums/"+username+"/我的相册",function(err){
				if(err){
					res.send("创建文件夹失败")
					return;
				}
			})
			
		});
	});	
	
});
//登录路由
app.post("/login",function(req,res){
	var username = req.body.username;
	var password = req.body.password;
	console.log(username,password)
	//连接数据库
	mongoClient.connect(connect_str,function(err,db){
		if(err){
			res.status(500).send("连接数据库失败");
			return;
		}
		var obj = {
			username:username,
			password:password
		}
		db.collection("students").findOne(obj,function(err,data){
			if(err){
				res.status(500).send("查询数据库失败");
				db.close();
				return;
			}
			db.close();
			if(data===null){
				res.redirect("/login");
			}else{
				req.session.username = username;
				req.session.head_pic = data.head_pic;
				res.redirect("/main.html");
			}
		})
	})
})
app.use("*",function(req,res,next){
	if(!req.session.username){
		res.redirect("/");
	}else{
		next();
	}
})
// 跳转主页路由
app.get("/main.html",function(req,res){
	res.render("./main.ejs",{
		username:req.session.username,
		head_pic:req.session.head_pic
	})
})
app.get("/manage",function(req,res){
	var username = req.session.username;
	 fs.readdir("./albums/"+username,function(err,data){
    if(err){
      res.send("读取失败");
      return;
    }
     res.render("./manage.ejs",{
      username:req.session.username,          
      head_pic:req.session.head_pic,
      albums:data
    })
  })
})
app.get("/creat_album",function(req,res){
	var album_name = req.query.album_name;
	console.log("创建相册")
	fs.mkdir("./albums/"+req.session.username+"/"+album_name,function(err){
		if(err){
			res.json({error:1,data:"创建相册失败"});
		}
	})
	res.json({error:0,data:"创建相册成功"})
})
//获取某一个相册的路由
app.get("/getAlbumContent",function(req,res){
	console.log("执行了");
	var album_name = req.query.album_name;
	var username = req.session.username;
	fs.readdir("./albums/"+username+"/"+album_name,function(err,data){
		if(err){
			res.json({
				error:1,
				data:"读取文件夹失败"
			})
			return;
		}
		res.json({
			error:0,
			data:data
		})
	})
})
app.post("/uploads",function(req,res){
	console.log("上传图片")
	var formid = new formidable.IncomingForm()
	formid.uploadDir = "./uploads";
	console.log("上传图片11111")
	formid.parse(req,function(err,fields,files){
		console.log("上传图片22222")
		if(err){
			console.log(err)
			res.send("抱歉，解析上传数据失败");
			return;
		}
		fs.rename(files.upload.path,"./albums"+"/"+req.session.username+"/"+fields.album_name+"/"+files.upload.name,function(err){
			console.log("./albums"+req.session.username+"/"+fields.album_name+"/"+files.upload.name)
			if(err){
				console.log(err);
				res.send("解析上传数据失败")
				return;
			}
			res.redirect("/manage");

		})
	})
})
app.get("/all_albums",function(req,res){
	fs.readdir("./albums",function(err,data){
		if(err){
			res.send("抱歉，读取用户失败");
			return;
		}
		//创建一个新的空数组
		var arr = [];
		for(var i=0;i<data.length;i++){
			var head_pic_name = fs.readdirSync("./albums/"+data[i]+"/head_pic")[0];
			arr.push({username:data[i],head_pic:head_pic_name});
		}
		res.render("./all_albums.ejs",{
			data:arr,
			username:req.session.username,
			head_pic:req.session.head_pic
		})

	})
})
app.get("/show_user_albums",function(req,res){
	var username = req.query.username;
	fs.readdir("./albums/"+username,function(err,data){
		if(err){
			res.send("读取目录失败")
			return;
		}
		res.render("./show_user_albums.ejs",{
			username:req.session.username,
			head_pic:req.session.head_pic,
			data:data,
			person:username
		})
	})
})
app.get("/each_pic",function(req,res){
	var username = req.query.username;
	var album_name = req.query.album_name;
	fs.readdir("./albums/"+username+"/"+album_name,function(err,data){
		if(err){
			res.send("查询文件失败");
			return;
			console.log(data)
		}
		res.render("./each_pic.ejs",{
			username:req.session.username,
			head_pic:req.session.head_pic,
			data:data,
			person:username,
			album_name:album_name
		})
	})
})
app.listen(3000);


