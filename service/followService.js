const Follow = require("../models/follow");
const followsUserIds = async (identityUserId) => {
    try {
       // Obtener usuarios que SIGUE identityUserId
       let following = await Follow.find({ user: identityUserId })
          .select("followed")
          .lean();
 
       // Obtener usuarios que SIGUEN a identityUserId
       let followers = await Follow.find({ followed: identityUserId })
          .select("user")
          .lean();
 
       // Procesar arrays de identificadores
       let followingClean = following.map(follow => follow.followed);
       let followersClean = followers.map(follow => follow.user);
 
       return {
          following: followingClean,
          followers: followersClean,
       };
    } catch (error) {
       console.error("Error en followsUserIds:", error);
       return { following: [], followers: [] };
    }
 };
 

const followThisUser = async (identityUserId, profileUserId) => {
   try {
      let following = await Follow.findOne({
         user: identityUserId,
         followed: profileUserId,
      })

      let followers = await Follow.findOne({
         user: identityUserId,
         followed: profileUserId,
      })

      return {
         following,
         followers,
      };
   } catch (error) {
      return {};
   }
};
module.exports = {
   followsUserIds,
   followThisUser,
};
