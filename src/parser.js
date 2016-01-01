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

  return getMonthName(month) + " " + year;
}

function getMonthName(month) {
  months = ["January", "February", "March", 
    "April", "May", "June", "July", "August",
    "September", "October", "November",
    "December"];

    return months[month];
}