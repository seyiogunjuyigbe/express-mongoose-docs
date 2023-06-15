var _ = require("underscore");
var express = require("express");

module.exports = function (app) {
 function appendRoutes(route, arr) {
        if (!_.isUndefined(route.route)) {
            route.route.method = Object.keys(route.route.methods).toString();
            arr.push(route.route);
        } else if(route.handle.stack) {
            // Extract routes from middlewere installed Router
            _.each(route.handle.stack, function (route) {
                appendRoutes(route, arr);
            });
        }
    }

    // Add an API endpoint to be used internally by this module
    app.get('/api-docs', function (req, res) {
        try {
            if (app.routes) {
                // Extract all API routes in one array  in case of express3
                var routes = _.flatten(app.routes);
            }
            else {
                // Extract all API routes in one array  in case of express4
                var arr = [];
                _.each(app._router.stack, function (route) {
                   appendRoutes(route, arr);
                });
                
                routes = arr;
            }

            //  res.send(router.stack)
    //     router.stack.forEach((layer) => {
    //     if (layer.route) {
    //       routes.push(layer.route);
    //     } else if (layer.name === 'router' && layer.handle.stack) {
    //         console.log('stack', layer.handle.stack)
    //       // Extract routes from nested routers mounted with app.use('/api', routes)
    //       layer.handle.stack.forEach((nestedLayer) => {
    //         if (nestedLayer.route) {
    //           routes.push(nestedLayer.route);
    //         }
    //       });
    //     }
    //   });
            // Group routes by resource name
            routes = routes.reduce((groupedRoutes, route) => {
                const routePrefix = getRoutePrefix(route.path);
        if (!groupedRoutes[routePrefix]) {
          groupedRoutes[routePrefix] = [];
        }
        groupedRoutes[routePrefix].push(route);
        return groupedRoutes;
            }, {});
            
             // Get the prefix from the route path
            function getRoutePrefix(routePath) {
                return routePath.split('/')[1];
            }

            // Skip the routes to be used internally by this module
            delete routes['api-docs'];
            delete routes['undefined']

            // Transform route groups object to an array of group/routes pairs
            routes = _.pairs(routes);

            var schemas;

            // if (mongoose)
            //     schemas = generateSchemaDocs(mongoose);

            res.send({routes: routes, schemas: schemas, root: app._router.stack, rootthre: app.routes});
        } catch (e) {
            res.status(400).send(e)
        }
    });

    // Configure the directory which holds html docs template
    app.use(express.static(__dirname + '/html'));
};

