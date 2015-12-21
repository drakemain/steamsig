module.exports = {
  personastate
}

function personastate(state) {
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