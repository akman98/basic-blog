if(process.env.NODE_ENV!=='production'){
	require('dotenv').config();
}
const express=require('express');
const mongoose=require('mongoose');
const passport=require('passport');
const flash=require('express-flash');
const session=require('express-session');
const methodOverride=require('method-override');
const Blog=require('./models/blog');
const User=require('./models/user');

dbURI='mongodb+srv://adi98:mdbuserPW@cluster0-qmm9y.mongodb.net/basicblog?retryWrites=true&w=majority';
mongoose.connect(dbURI,{useNewUrlParser:true,useUnifiedTopology:true})
	.then((result)=>{app.listen(3000);console.log('server3000 up');})
	.catch((err)=>console.log(err));

const initializePassport=require('./passport-config');
initializePassport(
	passport,
	async (email)=>{
		let user=null;
		await User.find({"email":email})
			.then(result=>{
				if(result.length==0) user=null;
				else user=result[0];
			}).catch(err=>{console.log(err);});	
		return user;
	},
	async (id)=>{
		let user=null;
		await User.findById(id)
			.then(result=>{
				user=result;console.log(result);
			}).catch(err=>{console.log(err);});
		return user;
	}
);

const app=express();
app.set('view engine','ejs');
app.use(express.static('public'));
app.use(express.urlencoded({extended:true}));
app.use(flash());
app.use(session({
	secret:process.env.SESSION_SECRET,
	resave:false,
	saveUninitialized:false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'));

app.get('/login',checkNotAuthenticated,(req,res)=>{
	res.render('login.ejs',{title:'login',userLoggedIn:false});
});
app.get('/register',checkNotAuthenticated,(req,res)=>{
	res.render('register.ejs',{title:'register',userLoggedIn:false});
});
app.post('/register',(req,res)=>{
	const user=new User(req.body);
	user.save()
		.then((result)=>{
			res.redirect('/login');
		}).catch((err)=>{console.log(err);
		});
});
app.post('/login',passport.authenticate('local',{
	successRedirect:'/',
	failureRedirect:'/login',
	failureFlash:true
}));
app.delete('/logout',(req,res)=>{
	req.logout();
	res.redirect('/login');
});

app.get('/',(req,res)=>{res.redirect('/blogs');});

app.get('/about',(req,res)=>{
	res.render('about',{title:'about page',userLoggedIn:req.isAuthenticated()});
});

app.get('/blogs',(req,res)=>{
	console.log('in hrere');
	Blog.find().sort({createdAt:-1})
		.then((result)=>{
			res.render('blogs/index',{
				title:'all blogs',
				userLoggedIn:req.isAuthenticated(),
				blogs:result
			})
		}).catch((err)=>{console.log(err);
		});
});

app.post('/blogs',(req,res)=>{
	const {title,snippet,body}=req.body;
	const blog=new Blog({author_id:req.user._id,title:title,snippet:snippet,body:body});
	blog.save()
		.then((result)=>{
			res.redirect('/blogs');
		}).catch((err)=>{console.log(err);
		});
});

app.get('/blogs/create',checkAuthenticated,(req,res)=>{
	res.render('blogs/create',{title:'create a blog',userLoggedIn:true});
});

app.get('/blogs/:id',(req,res)=>{
	const id=req.params.id;
	Blog.findById(id)
		.then(async (result)=>{
			let author=null;
			await User.findById(result.author_id)
				.then(result=>{author=result;})
				.catch(err=>{console.log(err);});
			res.render('blogs/details',{
				blog:result,
				author:author.name,
				title:'blog details',
				userLoggedIn:req.isAuthenticated(),
				userIsAuthor:(req.isAuthenticated()&&(req.user._id==result.author_id))
			});
		}).catch(err=>{console.log(err);res.status(404).render('404',{
				title:'blog not found',userLoggedIn:req.isAuthenticated()
			});
		});
});

app.delete('/blogs/:id',(req,res)=>{
	const id=req.params.id;
	Blog.findByIdAndDelete(id)
		.then(result=>{
			res.json({redirect:'/blogs'})
		}).catch(err=>{console.log(err);
		});
});

app.use((req,res)=>{
	res.status(404).render('404',{
		title:'error',
		userLoggedIn:req.isAuthenticated()
	});
});

function checkAuthenticated(req,res,next){
	if(req.isAuthenticated()){
		 next();
	}else{
	res.redirect('/login');}
}
function checkNotAuthenticated(req,res,next){
	if(req.isAuthenticated()){
		 res.redirect('/');
	}else{
	next();}
}