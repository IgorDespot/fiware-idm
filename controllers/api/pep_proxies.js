var debug = require('debug')('idm:api-pep_proxies');
var models = require('../../models/models.js');
var uuid = require('uuid');

// MW to check pep proxy authentication
exports.authenticate = function(id, password, callback) {

    debug("--> authenticate")
    
    // Search the user through the email
    models.pep_proxy.find({
        where: {
            id: id
        }
    }).then(function(pep_proxy) {
        if (pep_proxy) {
            // Verify password 
            if(pep_proxy.verifyPassword(password)){
                callback(null, pep_proxy);
            } else { callback(new Error('invalid')); }   
        } else { callback(new Error('pep_proxy_not_found')); }
    }).catch(function(error){ callback(error) });
};

// MW to Autoload info if path include pep_proxyId
exports.search_pep_proxy = function(req, res, next) {

    debug("--> load_pep_proxy");

    // Search application whose id is applicationId
    models.pep_proxy.findOne({
        where: { oauth_client_id: req.application.id }
    }).then(function(pep_proxy) {
        req.pep_proxy = pep_proxy
        next();
    }).catch(function(error) { 
        debug('Error: ' + error)
        if (!error.error) {
            error = { error: {message: 'Internal error', code: 500, title: 'Internal error'}}
        }
        res.status(error.error.code).json(error)
    });
}

// GET /v1/:applicationId/pep_proxies -- Send index of pep_proxies
exports.info = function(req, res) {
	debug('--> info')

    if (req.pep_proxy) {
	   delete req.pep_proxy.dataValues.password
       res.status(200).json({pep_proxy: req.pep_proxy});
    } else {
       res.status(404).json({error: {message: "Pep Proxy not found", code: 404, title: "Not Found"}})
    }
}

// POST /v1/:applicationId/pep_proxies -- Cretate pep_proxy
exports.create = function(req, res) {
	debug('--> create')
	
    if (req.pep_proxy) {
        error = { error: {message: 'Pep Proxy already registered', code: 409, title: 'Conflict'}}
        res.status(409).json(error)
    } else {
        // Id and password of the proxy
        var id = 'pep_proxy_'+uuid.v4()
        var password = 'pep_proxy_'+uuid.v4()

        // Build a new row in the pep_proxy table
        var pep_proxy = models.pep_proxy.build({id: id, password: password, oauth_client_id: req.application.id});
        pep_proxy.save({
            fields: ['id','password','oauth_client_id']
        }).then(function(pep_proxy) {
            res.status(201).json({pep_proxy: {id: id, password: password}});
        }).catch(function(error) {
            debug('Error: ' + error)
            if (!error.error) {
                error = { error: {message: 'Internal error', code: 500, title: 'Internal error'}}
            }
            res.status(error.error.code).json(error)
        })
    }
}

// PATCH /v1/:applicationId/pep_proxies -- Reset password pep_proxy
exports.update = function(req, res) {
    debug('--> update')

    if (req.pep_proxy) {
        var password = 'pep_proxy_'+uuid.v4()
        req.pep_proxy.password = password

        req.pep_proxy.save().then(function(pep_proxy) {

            var response = {new_password: password}
            res.status(200).json(response);

        }).catch(function(error) {
            debug('Error: ' + error)
            if (!error.error) {
                error = { error: {message: 'Internal error', code: 500, title: 'Internal error'}}
            }
            res.status(error.error.code).json(error)
        })
    } else {
        res.status(404).json({error: {message: "Pep Proxy not found", code: 404, title: "Not Found"}})
    }
}

// DELETE /v1/:applicationId/pep_proxies -- Delete pep_proxy
exports.delete = function(req, res) {
	debug('--> delete')
    
    if (req.pep_proxy) {
        req.pep_proxy.destroy().then(function() {
            res.status(204).json("Pep Proxy "+req.pep_proxy.id+" destroyed");
        }).catch(function(error) {
            debug('Error: ' + error)
            if (!error.error) {
                error = { error: {message: 'Internal error', code: 500, title: 'Internal error'}}
            }
            res.status(error.error.code).json(error)
        })
    } else {
        res.status(404).json({error: {message: "Pep Proxy not found", code: 404, title: "Not Found"}})
    }
}