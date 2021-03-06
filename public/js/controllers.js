angular.module('fio.controllers', [])

// Control the UI for the user's entries data list
.controller('IOCtrl', function($scope, $filter, $timeout, DataServices) {

  var DS = DataServices;

  var templates_url = 'public/partials/io/';
  $scope.templates = {
    'entries': templates_url + 'entries.html',
    'errors': templates_url + 'errors.html'
  }

  $scope.today = new Date();
  $scope.order = '-date';     // the order in which dailies are shown
  $scope.categories = [];
  $scope.entries = [];        // the list of entries for this user
  $scope.dailies = [];        // the list of entries grouped by day shown to the user

  $scope.init_io_ctrl = function() {
    // Get entries and convert to dailies
    $scope.entries = DS.get_entries();
    $scope.dailies = DS.entries_to_dailies($scope.entries);

    // Get categories
    $scope.categories = DS.get_categories();

    // Fill date input with today's date
    $scope.date = $filter('date')($scope.today, 'dd/MM/yyyy');
  }; // init_data_ctrl()

$scope.add_entry = function() {
    var new_entry = {date: new Date(moment($scope.date, 'DD/MM/YYYY')), amount: $scope.amount, category: $scope.category.cat, note: $scope.note};
    // DS.save_entry(new_entry)
    $scope.entries.push(new_entry);
    $scope.dailies = DS.inject_to_dailies(new_entry, $scope.dailies);
  };

  $scope.submit_new_entry_form = function() {
    // If inputs were OK, reset the fiels
    // and make the form pristine again
    if ($scope.addEntry.$valid) {
      $scope.add_entry();
      $scope.reset_new_entry_form();
    }
    // Else change form state to submitted and invalid
    // so that can handle showing of errors
    else {
      $scope.submitted_invalid = true;
    }
  }

  $scope.disregard_new_entry_form = function() {
    $scope.reset_new_entry_form();
  }

  $scope.reset_new_entry_form = function() {
    $scope.submitted_invalid = false;
    $scope.date = $filter('date')($scope.today, 'dd/MM/yyyy');
    $scope.amount = '';
    $scope.category = '';
    $scope.note = '';
    $scope.addEntry.$setPristine();
  }

  $scope.process_edits = function(daily, entry) {
    // DS.update_entry(entry);

    // Copy the formatted date value to the actual date
    // moment.js uses different formatting syntax (uppercase)
    entry.date = new Date(moment(entry.formatted_date, 'DD/MM/YYYY'));

    // If the date has changed, reorganise dailies
    if ($filter('date')(daily.date, 'yyyy-MM-dd')
        != $filter('date')(entry.date, 'yyyy-MM-dd')) {

      // Remove entry from our dailies list
      DS.remove_from_dailies(daily.$$hashKey, entry.$$hashKey, $scope.dailies);
      DS.remove_daily_if_empty($scope.dailies, daily);

      // Re-inject the entry into a suitable place accorring to the edited date
      $scope.dailies = DS.inject_to_dailies(entry, $scope.dailies);

    }
  }

  $scope.set_entry_date = function(date, entry) {
    entry.formatted_date = $filter('date')(date, 'dd/MM/yyyy');
    entry.date = date;
  }

  // Remove entry, but with timeouts, so that we get to show animations
  $scope.remove_entry = function(daily, entry) {
    $scope.entries.splice($scope.entries.indexOf(entry), 1);   
    $timeout(function() {
      DS.remove_from_dailies(daily.$$hashKey, entry.$$hashKey, $scope.dailies);
      $timeout(function() {
        // If this leaves us with an empty daily, remove that, too
        DS.remove_daily_if_empty($scope.dailies, daily);
      }, 400);
    }, 400);
  }

  // Check whether a new month starts at a given daily in the output
  $scope.month_unchanged = function(daily, index) {
    return (daily == $scope.get_daily_at(0) && 
            $filter('date')(daily.date, 'yyyy-MM') == $filter('date')(new Date(), 'yyyy-MM')) ||
           $filter('date')($scope.get_daily_at(index - 1).date, 'yyyy-MM') == $filter('date')(daily.date, 'yyyy-MM')
  }

  // This is used to get dailies at specific positions in the *sorted* list
  // Return a day in the distant past for index -1
  $scope.get_daily_at = function(index) {
    var sorted_list = $filter('orderBy')($scope.dailies, $scope.order);
    var daily = typeof sorted_list[index] == 'undefined' ? 
                {date: new Date('01/01/0000')} : 
                sorted_list[index];
    return daily;
  }

  $scope.get_daily_totals = function(daily) {
    return DS.get_totals_for(daily);
  }

  $scope.get_totals = function() {
    return DS.get_totals($scope.dailies);
  }

  $scope.get_type = function(amount) {
    return DS.get_amount_type(amount);
  }
});