var exports = module.exports = {};

exports.personastate = function(state) {
  switch (state) {
    case 0:
      return "Offline";

    case 1:
      return "Online";

    case 2:
      return "Busy"

    case 3:
      return "Away";

    case 4:
      return "Snooze";

    case 5:
      return "Looking to trade";
  }
}

exports.timecreated = function(time) {
  var dateCreated = new Date(time * 1000);

  var month = dateCreated.getMonth(),
      year = dateCreated.getFullYear();

  return parseMonth(month) + " " + year;
}

function parseMonth(month) {
  switch (month) {
    case 0:
      return "January";
    case 1:
      return "February";
    case 2:
      return "March";
    case 3:
      return "April";
    case 4:
      return "May";
    case 5:
      return "June";
    case 6:
      return "July";
    case 7:
      return "August";
    case 8:
      return "September";
    case 9:
      return "October";
    case 10:
      return "November";
    case 11:
      return "December";
  }
}