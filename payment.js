angular.module('scc', []);

angular.module('scc').constant('dues', {
    membership_levels: [
        // options for each level:
        //  name -- name of the level
        //  dues -- base dues for this level
        //  league_cost_cap: maximum amount member can pay for all leagues
        //      if this differs per year, a list of caps starting with first
        //      year curlers
        //  allowed_tiers: which league tiers member can join {tier: true/false}
        //  includes_association_memberships: if true, GNCC, USCA/USWCA dues
        //      are included in the membership
        {
            name: "Regular",
            dues: 225,
            league_cost_cap: [
                0,   // first year: total of $225
                110, // second year: total of $335
                240, // third and higher year: total of $465
            ],
            allowed_tiers: {1: true, 2: true, 3: true},
            includes_association_memberships: true,
        }, {
            name: "Young Adult",
            dues: 225,
            league_cost_cap: 0, // all leagues included
            allowed_tiers: {1: true, 2: true, 3: true},
            includes_association_memberships: true,
        }, {
            name: "Contributing / Daytime",
            dues: 85,
            league_cost_cap: 150, // up to $235
            allowed_tiers: {1: false, 2: false, 3: true},
            includes_association_memberships: false,
        }, {
            name: "Junior",
            dues: 50,
            // note: really only Erdman/Gabel are allowed in tier 2..
            allowed_tiers: {1: false, 2: true, 3: false},
            includes_association_memberships: true,
        }, {
            name: "College",
            dues: 55,
            allowed_tiers: {1: false, 2: false, 3: false},
            includes_association_memberships: true,
        }, {
            name: "Little Rock",
            dues: 30,
            allowed_tiers: {1: false, 2: false, 3: false},
            includes_association_memberships: false,
        }, {
            name: "Honorary",
            dues: 0,
            allowed_tiers: {1: true, 2: true, 3: true},
            includes_association_memberships: true,
        }, {
            name: "Social",
            dues: 30,
            allowed_tiers: {1: false, 2: false, 3: false},
            includes_association_memberships: false,
        }, {
            name: "Non-Resident",
            dues: 60,
            allowed_tiers: {1: false, 2: false, 3: false},
            includes_association_memberships: false,
        },
    ],
    associations: {
        // dues for each association
        GNCC: 13,
        USCA: 29,
        USWCA: 5,
    },
    leagues: [
        // options for each league:
        //  name: league name
        //  tier: 1, 2, or 3
        //  half: 'first' or 'second'; omitted for full-year leagues
        //  cost: cost to register

        // 1st tier
        {
            name: "Blackhall",
            tier: 1,
            cost: 100,
        }, {
            name: "Van De Car",
            tier: 1,
            cost: 100,
        }, {
            name: "Pletenik",
            tier: 1,
            cost: 100,
        }, {
            name: "Bradshaw",
            half: 'first',
            tier: 1,
            cost: 50,
        }, {
            name: "Fitzgerald",
            half: 'second',
            tier: 1,
            cost: 50,
        }, {
            name: "Graham",
            tier: 1,
            cost: 100,
        }, {
            name: "Dr. Ack",
            half: 'first',
            tier: 1,
            cost: 50,
        }, {
            name: "All-American",
            half: 'second',
            tier: 1,
            cost: 50,
        },


        // 2nd tier
        {
            name: "Erdman",
            half: 'first',
            tier: 2,
            cost: 30,
        }, {
            name: "Gabel",
            half: 'second',
            tier: 2,
            cost: 30,
        }, {
            name: "Stopera",
            tier: 2,
            cost: 60,
        },


        // 3rd tier
        {
            name: "Friday Social",
            tier: 3,
            cost: 30,
        }, {
            name: "Sovik Open",
            tier: 3,
            cost: 30,
        }, {
            name: "Wednesday Morning",
            half: 'first',
            tier: 3,
            cost: 15,
        }, {
            name: "Griffin",
            half: 'second',
            tier: 3,
            cost: 15,
        }, {
            name: "Thursday Prayer Meeting",
            tier: 3,
            cost: 30,
        }, {
            name: "Schenectady-Albany",
            tier: 3,
            cost: 30,
        },
    ],
});

angular.module('scc').controller('DuesController',
function($scope, dues) {
    $scope.dues = dues;

    var membership_levels_by_name = {};
    dues.membership_levels.forEach(function(lvl) {
        membership_levels_by_name[lvl.name] = lvl;
    });

    var leagues_by_name = {};
    dues.leagues.forEach(function(lg) {
        leagues_by_name[lg.name] = lg;
    });

    // initial values
    $scope.level = dues.membership_levels[0];
    $scope.city = "Schenectady"
    $scope.state = "NY"
    $scope.zip = "12309"
    $scope.leagues = {};
    $scope.league_notes = {};
    $scope.associations = {};

    // SELECT only supports string values, so
    // update $scope.level with the level info
    // whenever the membership level changes
    $scope._level_name = $scope.level.name;
    $scope.$watch('_level_name', function(newValue) {
        console.log("update level");
        $scope.level = membership_levels_by_name[newValue];
    });

    // Generate a "cart" consisting of items from the user's selections.
    var updateCart = function() {
        console.log("update cart");
        var cart = [{
            name: $scope.level.name + ' Membership',
            amount: $scope.level.dues,
            // TODO: membership year
        }];
        angular.forEach($scope.leagues, function (selected, name) {
            if (!selected) {
                return;
            }
            var league = leagues_by_name[name];
            if (!$scope.level.allowed_tiers[league.tier]) {
                $scope.leagues[name] = false;
                return;
            }
            // TODO: cap total league cost
            cart.push({
                name: league.name + ' League',
                amount: league.cost,
                notes: $scope.league_notes[league.name],
            });
        });
        if (!$scope.level.includes_association_memberships) {
            angular.forEach($scope.associations, function (selected, name) {
                if (!selected) {
                    return;
                }
                cart.push({
                    name: name + ' Membership',
                    amount: dues.associations[name],
                });
            });
        } else {
            $scope.associations = {};
        }
        $scope.cart = cart;

        var total = 0;
        $scope.cart.forEach(function(item) {
            total = total + item.amount;
        });
        $scope.total_dues = total;
    };
    $scope.$watch('level', updateCart);
    $scope.$watchCollection('leagues', updateCart);
    $scope.$watchCollection('league_notes', updateCart);
    $scope.$watchCollection('associations', updateCart);
});

