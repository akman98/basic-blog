const LocalStrategy=require('passport-local').Strategy;

function initialize(passport,getUserByEmail,getUserById){
	const authenticateUser=async (email,password,done)=>{
		const user=await getUserByEmail(email);
		if(user==null){
			return done(null,false,{message:'no user with that email'});
		}
		if(password==user.password){
			return done(null,user);
		}else{
			return done(null,false,{message:'invalid password'});
		}
	}
	passport.use(new LocalStrategy({usernameField:'email',password:'password'},authenticateUser));
	passport.serializeUser((user,done)=>{console.log(user._id);return done(null,user._id);});
	passport.deserializeUser(async (id,done)=>{
		console.log(id+' ds');
		const user1=await getUserById(id);
		return done(null,user1)
	});
};

module.exports=initialize;