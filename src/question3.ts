import { MbtaApiIntegration } from "./datasources/MBTA/datasource";
import { RouteData, RouteType } from "./datasources/MBTA/models";

async function main() {
  const api = new MbtaApiIntegration();

  const args = process.argv.slice(2);

  //Get the stops the user passed in on the command line
  if (args.length !== 2) {
    throw Error(
      "You must pass in 2 stop names, each in quotes, and seperated by a space"
    );
  }
  const [startStop, endStop] = args;
  let startRoute = null;
  let endRoute = null;
  console.log(args);

  const stopsMap = await api.buildStopsToRoutesMap([
    RouteType.LIGHT_RAIL,
    RouteType.HEAVY_RAIL,
  ]);
  //find out which routes the given stops are on

  stopsMap.forEach((stops, route) => {
    if (stops.includes(startStop)) {
      startRoute = route;
    }
    if (stops.includes(endStop)) {
      endRoute = route;
    }
  });

  console.log(startRoute, endRoute);

  // How to model connections between routes?
  //      List of routes to connecting stop?
  //      Ex: [Red, Orange]: Downtown Crossing

  //What happens if either the start or dest stop are on multiple lines?
  // Ex: Park Street
  // What happens if lines are not directly connected?
  // Ex: Blue to Red
  //  Find lines that they are connected to and check for connenctions between those lines
  // Future enhancements: Find the shortest connection between the 2 lines

  // What happens if lines have sections that overlap?
  // Ex: all of the green lines

  // Return a list of stops that will get you from the source to the dest
}

main();
