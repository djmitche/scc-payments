angular.module('payment', []);

angular.module('payment').constant('paypal', {
    business: 'sheltieshores@gmail.com',
});

angular.module('payment').constant('dues', {
    membership_levels: [
        // options for each level:
        //  name -- name of the level
        //  dues -- base dues for this level
        //  league_fee_limit: maximum amount member can pay for all leagues
        //      if this differs per year, a list of caps starting with first
        //      year curlers
        //  allowed_tiers: which league tiers member can join {tier: true/false}
        //  includes_association_memberships: if true, GNCC, USCA/USWCA dues
        //      are included in the membership
        {
            name: "Regular",
            dues: 225,
            league_fee_limit: [
                0,   // first year: total of $225
                110, // second year: total of $335
                240, // third and higher year: total of $465
            ],
            allowed_tiers: {1: true, 2: true, 3: true},
            includes_association_memberships: true,
        }, {
            name: "Young Adult",
            dues: 225,
            league_fee_limit: 0, // all leagues included
            allowed_tiers: {1: true, 2: true, 3: true},
            includes_association_memberships: true,
        }, {
            name: "Contributing / Daytime",
            dues: 85,
            league_fee_limit: 150, // up to $235
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

angular.module('payment').controller('DuesController',
function($scope, dues, paypal) {
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
    $scope.member_years = 1;
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
        $scope.level = membership_levels_by_name[newValue];
    });

    $scope.league_fee_limit = null;
    var updateLeagueFeeLimit = function() {
        var lfl = $scope.level.league_fee_limit;
        if (!angular.isDefined(lfl)) {
            $scope.league_fee_limit = null;
            return;
        }
        if (lfl instanceof Array) {
            var i = new Number($scope.member_years) - 1;
            if (i >= lfl.length) {
                i = lfl.length - 1;
            }
            $scope.league_fee_limit = lfl[i];
        } else {
            $scope.league_fee_limit = lfl;
        }
    };
    $scope.$watch('level', updateLeagueFeeLimit);
    $scope.$watch('member_years', updateLeagueFeeLimit);

    // Generate a "cart" consisting of items from the user's selections.
    var updateCart = function() {
        var cart = [{
            name: $scope.level.name + ' Membership',
            amount: $scope.level.dues,
            notes: 'Membership year: ' + $scope.member_years,
        }];

        var league_limit = $scope.league_fee_limit;
        angular.forEach($scope.leagues, function (selected, name) {
            if (!selected) {
                return;
            }
            var league = leagues_by_name[name];
            if (!$scope.level.allowed_tiers[league.tier]) {
                $scope.leagues[name] = false;
                return;
            }
            var cost = league.cost;
            if (angular.isDefined(league_limit) && cost > league_limit) {
                cost = league_limit;
            }
            cart.push({
                name: league.name + ' League',
                amount: cost,
                notes: $scope.league_notes[league.name],
            });
            league_limit -= cost;
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
    $scope.$watch('league_fee_limit', updateCart);
    $scope.$watchCollection('leagues', updateCart);
    $scope.$watchCollection('league_notes', updateCart);
    $scope.$watchCollection('associations', updateCart);

    // Process a payment!
    $scope.pay = function() {
        var ff = {};

        ff.cmd = '_cart';
        ff.business = paypal.business;
        ff.item_name = "Schenectady Curling Club Member Dues";
        ff.first_name = $scope.first_name;
        ff.last_name = $scope.last_name;
        ff.email = $scope.email;
        ff.no_note = '1';
        ff.currency_code = 'USD';
        ff.lc = 'US';
        ff.no_shipping = '1';
        ff.return = 'http://people.v.igoro.us/~dustin/ssc-payments/';
        ff.cancel = 'http://people.v.igoro.us/~dustin/ssc-payments/';
        ff.upload = '1';

        var i = 1;
        angular.forEach($scope.cart, function(item) {
            ff['item_name_' + i] = item.name;
            ff['amount_' + i] = item.amount;
            if (item.notes) {
                ff['on0_' + i] = 'notes';
                ff['os0_' + i] = item.notes;
            }
            i += 1;
        });

        // Turn that into a browser form and submit it, because PayPal was
        // designed in the 1990's and hasn't improved since.
        var form = $('<form>');
        form.attr("action", "https://www.paypal.com/cgi-bin/webscr");
        form.attr("method", "POST");
        form.attr("style", "display: none;");
        angular.forEach(ff, function(value, name) {
            var input = $("<input>")
                .attr("type", "hidden")
                .attr("name", name)
                .val(value);
            form.append(input);
        });
        $("body").append(form);
        form.submit();
        form.remove();
    };
});

