const jwt = require('jsonwebtoken')
const User = require('../models/user')

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '') //ovo će uzeti iz headera requesta vrijednost pod key-em Authorization i iz te vrijednosti uklonit "Bearer (razmak)" tj. zamjenit će ga sa praznim stringom
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        //userov id je u tokenu pa ćemo ga izvući. On je na decoded._id
        const user = await User.findOne({ _id: decoded._id, 'tokens.token': token})
        //potraži usera koji ima taj i taj _id i koji u tokens.token ima ovaj token kojeg smo izvukli ('tokens.token' u navodnicima da bi se mogla stavit točka u nazivu propertija)

        if (!user) {
            throw new Error() //znači ako nije pronaša usera onda je to problem, i dosta je bacit error da se okine catch dole
        }
        //sad ćemo poslat route handleru usera da ga ne mora opet tražit ako smo ga već našli i tako trošit resurse nepotrebno
        req.token = token
        req.user = user
        next()
    } catch (e) {
        res.status(401).send({error: 'Please authenticate'})
    }
}

module.exports = auth